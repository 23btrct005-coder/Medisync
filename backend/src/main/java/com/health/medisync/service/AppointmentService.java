package com.health.medisync.service;

import com.health.medisync.model.Appointment;
import com.health.medisync.model.Appointment.AppointmentStatus;
import com.health.medisync.model.Appointment.ConsultationType;
import com.health.medisync.model.Doctor;
import com.health.medisync.model.Patient;
import com.health.medisync.model.User;
import com.health.medisync.model.Hospital;
import com.health.medisync.model.HospitalAdmin;
import com.health.medisync.repository.AppointmentRepository;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.PatientRepository;
import com.health.medisync.repository.UserRepository;
import com.health.medisync.repository.RatingRepository;
import com.health.medisync.model.DoctorDTO;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.json.JSONArray;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final RatingRepository ratingRepository;

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;

    public AppointmentService(AppointmentRepository appointmentRepository, 
                              DoctorRepository doctorRepository, 
                              PatientRepository patientRepository,
                              UserRepository userRepository,
                              NotificationService notificationService,
                              RatingRepository ratingRepository) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.ratingRepository = ratingRepository;
    }

    public boolean hasBookedAppointment(Long doctorId, Long patientId) {
        return appointmentRepository.existsByDoctorIdAndPatientIdAndStatus(
            doctorId, patientId, AppointmentStatus.BOOKED);
    }

    public List<String> getAvailableSlots(Long doctorId, LocalDate date) {
        System.out.println("TRACE: Fetching slots for Doctor ID: " + doctorId + ", Date: " + date);
        
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new RuntimeException("Doctor Record Not Found for ID: " + doctorId));

        System.out.println("TRACE: Doctor found: " + doctor.getName() + ", ApptsEnabled: " + doctor.getAppointmentsEnabled());

        if (doctor.getAppointmentsEnabled() != null && !doctor.getAppointmentsEnabled()) {
            return Collections.emptyList();
        }

        // 1. Generate all possible slots from consultationTimings (e.g., "10:00 AM - 05:00 PM")
        List<String> allSlots = parseSlots(doctor);
        System.out.println("TRACE: Total possible slots: " + allSlots.size());

        // 2. Filter out booked or pending (not expired) slots
        LocalDateTime expiryTime = LocalDateTime.now().minusMinutes(10);
        List<Appointment> existing = new ArrayList<>();
        try {
            existing = appointmentRepository.findByDoctorIdAndAppointmentDate(doctorId, date);
            System.out.println("TRACE: Found " + existing.size() + " existing appointments/holds.");
        } catch (Exception e) {
            System.err.println("WARNING: Database query for existing appointments failed: " + e.getMessage());
            // Fallback: Assume no existing appointments if DB query fails due to schema sync issues
        }
        
        Set<String> takenSlots = existing.stream()
            .filter(a -> a.getStatus() == AppointmentStatus.BOOKED || 
                        a.getStatus() == AppointmentStatus.AWAITING_VERIFICATION ||
                        (a.getStatus() == AppointmentStatus.PENDING && a.getCreatedAt() != null && a.getCreatedAt().isAfter(expiryTime)))
            .map(a -> a.getTimeSlot())
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        ZoneId clinicalZone = ZoneId.of("Asia/Kolkata");
        List<String> results = allSlots.stream()
            .filter(slot -> !takenSlots.contains(slot))
            .filter(slot -> {
                // HARDEN: Filter out past slots if date is today (Local Context)
                if (date.isEqual(LocalDate.now(clinicalZone))) {
                    try {
                        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);
                        java.time.LocalTime slotTime = java.time.LocalTime.parse(slot.trim(), formatter);
                        return slotTime.isAfter(java.time.LocalTime.now(clinicalZone).plusMinutes(2)); // 2-min buffer
                    } catch (Exception e) { return true; }
                }
                return true;
            })
            .collect(Collectors.toList());
            
        System.out.println("TRACE: Returning " + results.size() + " available slots.");
        return results;
    }

    private List<String> parseSlots(Doctor doctor) {
        String timings = doctor.getConsultationTimings();
        int duration = (doctor.getSlotDuration() != null && doctor.getSlotDuration() > 0) ? doctor.getSlotDuration() : 15;
        DateTimeFormatter displayFormatter = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);

        if (timings == null || timings.trim().isEmpty()) {
            List<String> defaultSlots = new ArrayList<>();
            java.time.LocalTime t = java.time.LocalTime.of(9, 0);
            for(int i=0; i<16; i++) {
                defaultSlots.add(t.format(displayFormatter));
                t = t.plusMinutes(duration);
            }
            return defaultSlots;
        }

        try {
            String[] parts = timings.split(" - ");
            if (parts.length != 2) throw new Exception("INVALID_TIMING_FORMAT");

            java.time.LocalTime start;
            java.time.LocalTime end;

            try {
                // Try parsing as 24-hour format (e.g. 09:00)
                DateTimeFormatter isoFormatter = DateTimeFormatter.ofPattern("HH:mm");
                start = java.time.LocalTime.parse(parts[0].trim(), isoFormatter);
                end = java.time.LocalTime.parse(parts[1].trim(), isoFormatter);
            } catch (Exception e) {
                // Fallback to display format (e.g. 09:00 AM)
                start = java.time.LocalTime.parse(parts[0].trim(), displayFormatter);
                end = java.time.LocalTime.parse(parts[1].trim(), displayFormatter);
            }

            List<String> slots = new ArrayList<>();
            java.time.LocalTime current = start;
            int safetyCounter = 0;

            while (safetyCounter < 200) { // Limit to 200 slots per doctor to prevent infinite loops
                slots.add(current.format(displayFormatter));
                current = current.plusMinutes(duration);

                // Termination Logic:
                if (start.isBefore(end)) {
                    // Normal shift (e.g. 09:00 - 17:00)
                    if (!current.isBefore(end)) break;
                } else {
                    // Midnight crossing shift (e.g. 23:00 - 01:00)
                    // Stop if we've wrapped around past midnight AND reached the end time
                    if (current.isBefore(start) && !current.isBefore(end)) break;
                }
                safetyCounter++;
            }
            return slots;

        } catch (Exception e) {
            System.err.println("WARN: Failed to parse timings for doctor " + doctor.getId() + ": " + timings + ". Falling back to 15-min default series.");
            List<String> fallbackSlots = new ArrayList<>();
            java.time.LocalTime t = java.time.LocalTime.of(9, 0);
            for(int i=0; i<20; i++) {
                fallbackSlots.add(t.format(displayFormatter));
                t = t.plusMinutes(duration);
            }
            return fallbackSlots;
        }
    }

    @Transactional
    public Map<String, Object> initiateBooking(String rawEmail, Long doctorId, LocalDate date, String slot, ConsultationType type) throws Exception {
        final String patientEmail = (rawEmail != null) ? rawEmail.trim().toLowerCase() : null;
        System.out.println("DEBUG: Initiating booking for " + patientEmail + ", Doctor: " + doctorId + ", Type: " + type);

        Patient patient = patientRepository.findByUserUsernameIgnoreCase(patientEmail)
            .orElseGet(() -> {
                System.out.println("INFO: Patient profile missing for " + patientEmail + ". Attempting self-healing...");
                User user = userRepository.findByUsernameIgnoreCase(patientEmail).orElse(null);
                if (user != null) {
                    Patient p = new Patient();
                    p.setUser(user);
                    p.setName(patientEmail.split("@")[0]);
                    p.setEmail(patientEmail);
                    System.out.println("SUCCESS: Reconstructed patient profile for " + patientEmail);
                    return patientRepository.save(p);
                }
                System.err.println("ERROR: No User account found for " + patientEmail);
                throw new RuntimeException("Patient profile and User account not found for: " + patientEmail);
            });
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (!doctor.getAppointmentsEnabled()) {
            throw new RuntimeException("This doctor is not accepting appointments at the moment.");
        }

        // Concurrency check (Harden: Final Conflict Shield)
        LocalDateTime expiryTime = LocalDateTime.now().minusMinutes(10);
        List<Appointment> conflicts = appointmentRepository.findConflictingAppointments(doctor, date, slot, expiryTime);
        if (!conflicts.isEmpty()) {
            boolean hasBooked = conflicts.stream().anyMatch(a -> a.getStatus() == Appointment.AppointmentStatus.BOOKED);
            if (hasBooked) {
                throw new RuntimeException("This slot is already officially booked by another patient. Please select another cloud window.");
            }
            throw new RuntimeException("This slot is currently being authorized by another patient. Please wait a few minutes or choose another time.");
        }

        Double fee = (type == ConsultationType.ONLINE) ? doctor.getOnlineConsultationFee() : doctor.getOfflineConsultationFee();
        if (fee == null) {
            System.out.println("DEBUG: Explicit fees missing for doctor. Checking legacy string fee...");
            String feeStr = doctor.getConsultationFee();
            if (feeStr != null && !feeStr.isEmpty()) {
                String numericFee = feeStr.replaceAll("[^0-9]", "");
                if (!numericFee.isEmpty()) {
                    fee = Double.valueOf(numericFee);
                }
            }
        }

        // Final Stabilization Fallback: Ensure fee is NEVER null to prevent NPE
        if (fee == null) {
            System.out.println("WARNING: No fees configured for doctor " + doctorId + ". Using Clinical Default: ₹1.0");
            fee = 1.0; 
        }
        
        // Payment Configuration Check with Robust Demo Mode Fallback
        boolean isDemoMode = (razorpayKeyId == null || razorpayKeyId.trim().isEmpty() || 
                             razorpayKeySecret == null || razorpayKeySecret.trim().isEmpty() ||
                             razorpayKeyId.contains("YOUR_") || razorpayKeySecret.contains("YOUR_"));
        
        System.out.println("DEBUG: Payment Mode Check - isDemoMode: " + isDemoMode + " (Key: " + (razorpayKeyId != null ? "PRESENT" : "NULL") + ")");
        
        String orderId;
        if (isDemoMode) {
            System.out.println("INFO: Razorpay keys missing. Operating in Clinical Demo Mode.");
            orderId = "demo_order_" + System.currentTimeMillis();
        } else {
            try {
                System.out.println("INFO: Initializing official Razorpay transaction...");
                RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
                JSONObject orderRequest = new JSONObject();
                int amountInPaise = (int)((fee != null ? fee : 1.0) * 100);
                orderRequest.put("amount", amountInPaise); // amount in paise
                orderRequest.put("currency", "INR");
                orderRequest.put("receipt", "appt_" + System.currentTimeMillis());

                if (doctor.getRazorpayAccountId() != null && !doctor.getRazorpayAccountId().isEmpty()) {
                    System.out.println("INFO: Route enabled - sending funds to " + doctor.getRazorpayAccountId());
                    JSONArray transfers = new JSONArray();
                    JSONObject transfer = new JSONObject();
                    transfer.put("account", doctor.getRazorpayAccountId());
                    transfer.put("amount", (int)(fee * 100));
                    transfer.put("currency", "INR");
                    transfers.put(transfer);
                    orderRequest.put("transfers", transfers);
                }

                Order order = client.orders.create(orderRequest);
                orderId = order.get("id");
                System.out.println("SUCCESS: Razorpay order created: " + orderId);
            } catch (Exception e) {
                System.err.println("FATAL: Razorpay communication failure: " + e.getMessage());
                throw new RuntimeException("Payment gateway error: " + e.getMessage());
            }
        }

        ZoneId clinicalZone = ZoneId.of("Asia/Kolkata");
        // 1. Block past dates
        LocalDate today = LocalDate.now(clinicalZone);
        if (date.isBefore(today)) {
            throw new RuntimeException("Cannot book appointments for past dates.");
        }

        // 2. Block past time slots for today
        if (date.isEqual(today)) {
            try {
                java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("h:mm a", java.util.Locale.ENGLISH);
                java.time.LocalTime slotTime = java.time.LocalTime.parse(slot.trim().toUpperCase(), formatter);
                if (slotTime.isBefore(java.time.LocalTime.now(clinicalZone).plusMinutes(5))) {
                    throw new RuntimeException("This time slot has already passed or is too close to start in your clinical timeline.");
                }
            } catch (Exception e) {
                // If parsing fails, we skip time-specific block but keep the date block
            }
        }

        // 3. Block Online if Disabled
        if (type == Appointment.ConsultationType.ONLINE && (doctor.getOnlineConsultation() == null || !doctor.getOnlineConsultation())) {
            throw new RuntimeException("This doctor is currently not accepting virtual consultations.");
        }

        Appointment appointment = new Appointment();
        appointment.setDoctor(doctor);
        appointment.setPatient(patient);
        appointment.setAppointmentDate(date);
        appointment.setTimeSlot(slot);
        appointment.setConsultationType(type);
        appointment.setAmount(fee);
        appointment.setRazorpayOrderId(orderId);
        appointment.setStatus(AppointmentStatus.PENDING);

        // Auto-generate secure meeting link for Virtual consultations
        if (type == ConsultationType.ONLINE) {
            String deterministicId = "ms-" + java.util.UUID.randomUUID().toString().substring(0, 12);
            appointment.setMeetLink("https://meet.google.com/" + deterministicId);
        }

        Appointment saved = appointmentRepository.save(appointment);
        
        if (isDemoMode) {
            appointment.setRazorpayPaymentId("demo_payment_" + System.currentTimeMillis());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("appointmentId", saved.getId());
        response.put("razorpayOrderId", orderId);
        response.put("amount", fee);
        response.put("razorpayKeyId", razorpayKeyId);
        response.put("isDemo", isDemoMode);
        response.put("preferredPaymentMode", doctor.getPreferredPaymentMode());
        response.put("upiId", doctor.getUpiId());

        return response;
    }

    @Transactional
    public void verifyPayment(String orderId, String paymentId, String signature) throws Exception {
        // Verify signature
        JSONObject attributes = new JSONObject();
        attributes.put("razorpay_order_id", orderId);
        attributes.put("razorpay_payment_id", paymentId);
        attributes.put("razorpay_signature", signature);

        boolean isValid = Utils.verifyPaymentSignature(attributes, razorpayKeySecret);
        if (!isValid) throw new RuntimeException("Invalid payment signature");

        Appointment appointment = appointmentRepository.findByRazorpayOrderId(orderId)
            .orElseThrow(() -> new RuntimeException("Appointment not found for order: " + orderId));

        appointment.setRazorpayPaymentId(paymentId);
        appointment.setStatus(AppointmentStatus.BOOKED);
        appointment.setCreatedAt(LocalDateTime.now()); // Reset timestamp to mark as confirmed
        Appointment booked = appointmentRepository.save(appointment);

        // Notify Doctor
        notificationService.sendNotification(
            booked.getDoctor().getUser().getId(),
            "APPOINTMENT",
            "New Clinical Session Booked",
             booked.getPatient().getName() + " has scheduled an appointment on " + booked.getAppointmentDate() + " at " + booked.getTimeSlot(),
            "/doctor-dashboard/appointments",
            "Open Schedule"
        );

        // Notify Patient
        notificationService.sendNotification(
            booked.getPatient().getUser().getId(),
            "APPOINTMENT",
            "Session Confirmed",
            "Your appointment with Dr. " + booked.getDoctor().getName() + " on " + booked.getAppointmentDate() + " is confirmed.",
            "/dashboard/sessions",
            "View Details"
        );
    }

    @Transactional
    public void verifyUpiPayment(Long appointmentId, String patientUpiId, String transactionId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found: " + appointmentId));

        appointment.setPatientUpiId(patientUpiId);
        appointment.setTransactionId(transactionId);
        appointment.setStatus(AppointmentStatus.AWAITING_VERIFICATION);
        appointment.setCreatedAt(LocalDateTime.now());
        Appointment booked = appointmentRepository.save(appointment);

        Doctor doctor = booked.getDoctor();
        boolean isInstitutional = doctor.isInstitutional() && doctor.getHospitalEntity() != null;

        if (isInstitutional) {
            Hospital hospital = doctor.getHospitalEntity();
            // Notify all admins of this hospital
            for (HospitalAdmin admin : hospital.getAdmins()) {
                notificationService.sendNotification(
                    admin.getUser().getId(),
                    "APPOINTMENT",
                    "New Institutional Session (Direct UPI)",
                    booked.getPatient().getName() + " has initiated a booking with Dr. " + doctor.getName() + " via Direct UPI. Txn ID: " + transactionId + ". Please verify in Hospital Ledger.",
                    "/hospital/appointments",
                    "Verify Payment"
                );
            }
        } else {
            // Notify Doctor directly for independent practice
            notificationService.sendNotification(
                doctor.getUser().getId(),
                "APPOINTMENT",
                "New Clinical Session (Direct UPI)",
                 booked.getPatient().getName() + " has initiated an appointment via Direct UPI on " + booked.getAppointmentDate() + ". Txn ID: " + transactionId + ". Please verify payment receipt.",
                "/doctor-dashboard/appointments",
                "Open Schedule"
            );
        }

        // Notify Patient
        notificationService.sendNotification(
            booked.getPatient().getUser().getId(),
            "APPOINTMENT",
            "Session Pending Verification",
            "Your direct UPI appointment with Dr. " + booked.getDoctor().getName() + " is currently awaiting verification by " + (isInstitutional ? "the Hospital Administration" : "the physician") + ".",
            "/dashboard/sessions",
            "View Details"
        );
    }

    @Transactional
    public void confirmUpiPayment(String authorEmail, Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found: " + appointmentId));
        
        Doctor doctor = appointment.getDoctor();
        boolean isInstitutional = doctor.isInstitutional() && doctor.getHospitalEntity() != null;
        
        boolean authorized = false;
        if (isInstitutional) {
            // Check if author is an admin of the hospital
            Hospital hospital = doctor.getHospitalEntity();
            authorized = hospital.getAdmins().stream()
                .anyMatch(admin -> admin.getUser().getUsername().equalsIgnoreCase(authorEmail));
        } else {
            // Check if author is the doctor
            authorized = doctor.getUser().getUsername().equalsIgnoreCase(authorEmail);
        }

        if (!authorized) {
            throw new RuntimeException("Unauthorized: You do not have permissions to verify this clinical settlement.");
        }

        appointment.setStatus(AppointmentStatus.BOOKED);
        appointment.setCreatedAt(LocalDateTime.now());
        Appointment booked = appointmentRepository.save(appointment);

        // Notify Patient
        notificationService.sendNotification(
            booked.getPatient().getUser().getId(),
            "APPOINTMENT",
            "Payment Verified & Session Booked",
            (isInstitutional ? "The Hospital Administration" : "Dr. " + booked.getDoctor().getName()) + " has verified your UPI payment. Your session is now officially booked.",
            "/dashboard/sessions",
            "View Details"
        );
    }

    public List<Appointment> getPatientAppointments(String email) {
        User user = userRepository.findByUsernameIgnoreCase(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Patient patient = patientRepository.findByUserId(user.getId())
            .orElseThrow(() -> new RuntimeException("Patient profile not found"));
        List<Appointment> appts = appointmentRepository.findByPatientId(patient.getId());
        
        // 🚀 FIX N+1: Sync 'rated' status in a single batch
        if (!appts.isEmpty()) {
            List<Long> apptIds = appts.stream().map(Appointment::getId).collect(Collectors.toList());
            Set<Long> ratedIds = new HashSet<>(ratingRepository.findRatedAppointmentIds(apptIds));
            for (Appointment a : appts) {
                a.setRated(ratedIds.contains(a.getId()));
            }
        }
        return appts;
    }

    public List<Appointment> getDoctorAppointments(String email) {
        User user = userRepository.findByUsernameIgnoreCase(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Doctor doctor = doctorRepository.findByUserId(user.getId())
            .orElseThrow(() -> new RuntimeException("Doctor profile not found"));
        List<Appointment.AppointmentStatus> statuses = Arrays.asList(Appointment.AppointmentStatus.BOOKED, Appointment.AppointmentStatus.AWAITING_VERIFICATION);
        List<Appointment> appts = appointmentRepository.findByDoctorIdAndStatusIn(doctor.getId(), statuses);
        
        // 🚀 FIX N+1: Sync 'rated' status for doctor history in batch
        if (!appts.isEmpty()) {
            List<Long> apptIds = appts.stream().map(Appointment::getId).collect(Collectors.toList());
            Set<Long> ratedIds = new HashSet<>(ratingRepository.findRatedAppointmentIds(apptIds));
            for (Appointment a : appts) {
                a.setRated(ratedIds.contains(a.getId()));
            }
        }
        return appts;
    }

    public List<DoctorDTO> getAllApprovedDoctors() {
        List<Doctor> doctors = doctorRepository.findByApprovedTrue();
        if (doctors.isEmpty()) return Collections.emptyList();

        // 🚀 FIX N+1: Fetch all ratings/counts in one go
        List<Long> ids = doctors.stream().map(Doctor::getId).collect(Collectors.toList());
        List<Object[]> aggregated = ratingRepository.getAggregatedRatings(ids);
        
        Map<Long, Double> avgRatings = new HashMap<>();
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : aggregated) {
            avgRatings.put((Long)row[0], (Double)row[1]);
            counts.put((Long)row[0], (Long)row[2]);
        }

        return doctors.stream()
                .map(d -> {
                    DoctorDTO dto = new DoctorDTO(d);
                    Double avg = avgRatings.getOrDefault(d.getId(), 0.0);
                    dto.setAverageRating(Math.round(avg * 10.0) / 10.0);
                    dto.setRatingCount(counts.getOrDefault(d.getId(), 0L));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void syncApprovedStatus() {
        System.out.println("DEBUG: Starting Marketplace Sync...");
        try {
            List<Doctor> all = doctorRepository.findAll();
            System.out.println("DEBUG: Found " + all.size() + " doctors to sync.");
            for (Doctor d : all) {
                System.out.println("DEBUG: Syncing doctor: " + d.getName() + " (ID: " + d.getId() + ")");
                d.setApproved(true);
                d.setAppointmentsEnabled(true);
                User user = d.getUser();
                if (user != null) {
                    System.out.println("DEBUG: Enabling and Promoting linked user: " + user.getUsername());
                    user.setEnabled(true);
                    if (!"ROLE_DOCTOR".equals(user.getRole())) {
                        user.setRole("ROLE_DOCTOR");
                    }
                    userRepository.save(user);
                }
                doctorRepository.save(d); // Save individually to pinpoint failure
            }
            System.out.println("SUCCESS: Marketplace Sync Completed.");
        } catch (Exception e) {
            System.err.println("FATAL: Marketplace Sync Failed!");
            e.printStackTrace();
            throw e;
        }
    }
}
