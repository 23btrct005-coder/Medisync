package com.health.medisync.service;

import com.health.medisync.model.*;
import com.health.medisync.model.Appointment.AppointmentStatus;
import com.health.medisync.model.Appointment.ConsultationType;
import com.health.medisync.repository.*;
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
    private final HospitalRepository hospitalRepository;
    private final HospitalAdminRepository hospitalAdminRepository;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;

    private static final List<String> SERVICES_24_7 = Arrays.asList(
        "Emergency & Trauma Care", "Ambulance Services", "ICU (Intensive Care Unit)", 
        "NICU (Neonatal ICU)", "Operation Theatre (Emergency)", "Casualty Department", 
        "24/7 Pharmacy", "Blood Bank", "Emergency CT Scan", "Emergency Lab Tests",
        "Oxygen & Ventilator Support", "Emergency Dialysis",
        "Emergency Room", "ICU Admission", "Trauma Care", "Ambulance Response"
    );

    public AppointmentService(AppointmentRepository appointmentRepository, 
                              DoctorRepository doctorRepository, 
                              PatientRepository patientRepository,
                              UserRepository userRepository,
                              NotificationService notificationService,
                              RatingRepository ratingRepository,
                              HospitalRepository hospitalRepository,
                              HospitalAdminRepository hospitalAdminRepository,
                              org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.ratingRepository = ratingRepository;
        this.hospitalRepository = hospitalRepository;
        this.hospitalAdminRepository = hospitalAdminRepository;
        this.messagingTemplate = messagingTemplate;
    }

    private void broadcastAppointmentUpdate(Appointment appointment) {
        try {
            // 1. Notify Doctor (WebSocket Sync)
            if (appointment.getDoctor() != null && appointment.getDoctor().getUser() != null) {
                messagingTemplate.convertAndSendToUser(
                    appointment.getDoctor().getUser().getUsername(),
                    "/queue/appointments",
                    appointment
                );
            }
            
            // 2. Notify Patient (WebSocket Sync)
            if (appointment.getPatient() != null && appointment.getPatient().getUser() != null) {
                messagingTemplate.convertAndSendToUser(
                    appointment.getPatient().getUser().getUsername(),
                    "/queue/appointments",
                    appointment
                );
            }

            // 3. Notify Hospital Admins (WebSocket + DB Persistence)
            if (appointment.getDoctor() != null && appointment.getDoctor().isInstitutional() && appointment.getDoctor().getHospitalEntity() != null) {
                Long hospitalId = appointment.getDoctor().getHospitalEntity().getId();
                List<HospitalAdmin> admins = hospitalAdminRepository.findByHospitalIdAndApprovedTrue(hospitalId);
                
                boolean isEmergency = appointment.getServiceName() != null && SERVICES_24_7.contains(appointment.getServiceName());
                String title = isEmergency ? "🚨 EMERGENCY SERVICE TRIGGERED" : "New Institutional Booking";
                String type = isEmergency ? "EMERGENCY" : "APPOINTMENT";

                for (HospitalAdmin admin : admins) {
                    try {
                        // Direct WebSocket Sync
                        messagingTemplate.convertAndSendToUser(
                            admin.getUser().getUsername(),
                            "/queue/appointments",
                            appointment
                        );
                        
                        // Persistent Notification
                        notificationService.sendNotification(
                            admin.getUser().getId(),
                            type,
                            title,
                            "Request for " + appointment.getServiceName() + " from " + (appointment.getPatient() != null ? appointment.getPatient().getName() : "Patient"),
                            "/hospital-dashboard/appointments",
                            "View Details"
                        );
                    } catch (Exception adminErr) {
                        System.err.println("WARN: Admin notification skipped: " + adminErr.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("CRITICAL: Clinical broadcast synchronization failure: " + e.getMessage());
        }
    }

    public boolean hasBookedAppointment(Long doctorId, Long patientId) {
        return appointmentRepository.existsByDoctorIdAndPatientIdAndStatus(
            doctorId, patientId, AppointmentStatus.BOOKED);
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

        // Concurrency & Resource Capacity Shield
        LocalDateTime expiryTime = LocalDateTime.now().minusMinutes(10);
        List<Appointment> conflicts = appointmentRepository.findConflictingClinicServiceAppointments(doctor.getId(), null, date, slot, expiryTime);
        
        int capacity = 1;
        String capacityJson = doctor.getServiceCapacity();
        if (capacityJson != null) {
            try {
                org.json.JSONObject capacities = new org.json.JSONObject(capacityJson);
                if (capacities.has("General Consultation")) {
                    capacity = capacities.getInt("General Consultation");
                } else if (capacities.has("Consultation")) {
                    capacity = capacities.getInt("Consultation");
                }
            } catch (Exception e) {}
        }
        
        if (conflicts.size() >= capacity) {
            throw new RuntimeException("This clinical slot is now fully booked or under authorization. Please select another cloud window.");
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

        // Check for Doctor Absence
        if (doctor.getAbsenceDates() != null && doctor.getAbsenceDates().contains(date.toString())) {
            throw new RuntimeException("Dr. " + doctor.getName() + " is scheduled to be absent on this date. Please select another clinical window.");
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
            String roomName = "MediSync-Session-" + java.util.UUID.randomUUID().toString().substring(0, 8);
            appointment.setMeetLink("https://meet.jit.si/" + roomName);
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
    public Map<String, Object> initiateServiceBooking(String rawEmail, String facilityId, String serviceName, LocalDate date, String slot) throws Exception {
        final String patientEmail = (rawEmail != null) ? rawEmail.trim().toLowerCase() : null;
        Patient patient = patientRepository.findByUserUsernameIgnoreCase(patientEmail)
            .orElseThrow(() -> new RuntimeException("Patient profile not found for: " + patientEmail));
        
        Hospital hospital = null;
        Doctor doctor = null;
        List<Appointment> conflicts;
        LocalDateTime expiryTime = LocalDateTime.now().minusMinutes(10);
        
        String upiId = null;
        String preferredPaymentMode = "UPI";

        if (facilityId.startsWith("hosp_")) {
            Long hId = Long.valueOf(facilityId.substring(5));
            hospital = hospitalRepository.findById(hId)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));
            preferredPaymentMode = hospital.getPreferredPaymentMode() != null ? hospital.getPreferredPaymentMode() : "UPI";
            upiId = hospital.getUpiId();
            
            boolean is247 = serviceName != null && SERVICES_24_7.contains(serviceName);
            if (is247 && "IMMEDIATE".equals(slot)) {
                System.out.println("DEBUG: Emergency Service 'IMMEDIATE' detected. Skipping institutional conflict checks.");
                conflicts = new ArrayList<>(); // Emergency bypass
            } else {
                conflicts = appointmentRepository.findConflictingServiceAppointments(hId, serviceName, date, slot, expiryTime);
            }
            
            // Safety Fallback: Assign the first available doctor from the hospital to satisfy NOT NULL constraints
            if (!hospital.getDoctors().isEmpty()) {
                doctor = hospital.getDoctors().get(0);
            }
        } else if (facilityId.startsWith("doc_")) {
            Long dId = Long.valueOf(facilityId.substring(4));
            doctor = doctorRepository.findById(dId)
                .orElseThrow(() -> new RuntimeException("Clinic not found"));
            conflicts = appointmentRepository.findConflictingClinicServiceAppointments(dId, serviceName, date, slot, expiryTime);
            upiId = doctor.getUpiId();
            preferredPaymentMode = doctor.getPreferredPaymentMode() != null ? doctor.getPreferredPaymentMode() : "UPI";
            
            boolean is247 = serviceName != null && SERVICES_24_7.contains(serviceName);
            if (is247 && "IMMEDIATE".equals(slot)) {
                System.out.println("DEBUG: Emergency Service 'IMMEDIATE' detected for Clinic. Skipping conflict checks.");
                conflicts = new ArrayList<>(); // Emergency bypass
            }
        } else {
            Long hId = Long.valueOf(facilityId);
            hospital = hospitalRepository.findById(hId)
                .orElseThrow(() -> new RuntimeException("Facility ID resolution failure"));
            conflicts = appointmentRepository.findConflictingServiceAppointments(hId, serviceName, date, slot, expiryTime);
            upiId = hospital.getUpiId();
            preferredPaymentMode = hospital.getPreferredPaymentMode() != null ? hospital.getPreferredPaymentMode() : "UPI";
            
            if (!hospital.getDoctors().isEmpty()) {
                doctor = hospital.getDoctors().get(0);
            }
        }

        // Resource Capacity Logic
        int capacity = 1;
        String capacityJson = null;
        if (hospital != null) capacityJson = hospital.getServiceCapacity();
        else if (doctor != null) capacityJson = doctor.getServiceCapacity();

        if (serviceName != null && capacityJson != null) {
            try {
                org.json.JSONObject capacities = new org.json.JSONObject(capacityJson);
                if (capacities.has(serviceName)) {
                    capacity = capacities.getInt(serviceName);
                }
            } catch (Exception e) {}
        }
        if (capacity < 1) capacity = 1;

        if (conflicts.size() >= capacity) {
            throw new RuntimeException("All " + capacity + " systems for " + serviceName + " are currently occupied at this time. Please select a different window.");
        }

        // Diagnostic Service Fee Calculation
        Double fee = 500.0;
        try {
            if (hospital != null && hospital.getServiceFees() != null && !hospital.getServiceFees().isEmpty()) {
                org.json.JSONObject feesJson = new org.json.JSONObject(hospital.getServiceFees());
                if (feesJson.has(serviceName)) {
                    fee = feesJson.getDouble(serviceName);
                } else if (serviceName.toUpperCase().contains("MRI") || serviceName.toUpperCase().contains("CT")) {
                    fee = 2500.0;
                }
            } else {
                if (serviceName.toUpperCase().contains("MRI") || serviceName.toUpperCase().contains("CT")) fee = 2500.0;
                if (serviceName.toUpperCase().contains("BLOOD") || serviceName.toUpperCase().contains("LAB")) fee = 300.0;
            }
        } catch (Exception e) {
            System.err.println("FEE_CALCULATION_ERROR: " + e.getMessage());
        }

        boolean isDemoMode = (razorpayKeyId == null || razorpayKeyId.isEmpty());
        String orderId = isDemoMode ? "demo_service_" + System.currentTimeMillis() : null;

        if (!isDemoMode) {
            try {
                RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
                JSONObject orderRequest = new JSONObject();
                int amountInPaise = (int)(fee * 100);
                orderRequest.put("amount", amountInPaise);
                orderRequest.put("currency", "INR");
                orderRequest.put("receipt", "service_" + System.currentTimeMillis());

                String rzpAccountId = null;
                if (hospital != null) rzpAccountId = hospital.getRazorpayAccountId();
                else if (doctor != null) rzpAccountId = doctor.getRazorpayAccountId();

                // Razorpay Route validation: account ID must be exactly 18 characters (e.g., acc_XXXXXXXXXXXXXXXX)
                if (rzpAccountId != null && rzpAccountId.length() == 18) {
                    JSONArray transfers = new JSONArray();
                    JSONObject transfer = new JSONObject();
                    transfer.put("account", rzpAccountId);
                    transfer.put("amount", amountInPaise);
                    transfer.put("currency", "INR");
                    transfers.put(transfer);
                    orderRequest.put("transfers", transfers);
                } else if (rzpAccountId != null && !rzpAccountId.isEmpty()) {
                    System.err.println("GATEWAY_ID_MISMATCH: Provided Razorpay Account ID [" + rzpAccountId + "] is invalid. Length must be exactly 18.");
                }

                Order order = client.orders.create(orderRequest);
                orderId = order.get("id");
            } catch (Exception e) {
                System.err.println("FATAL: Service Razorpay failure: " + e.getMessage());
                throw new RuntimeException("Payment gateway error: " + e.getMessage());
            }
        }

        Appointment appointment = new Appointment();
        appointment.setHospital(hospital);
        appointment.setDoctor(doctor);
        appointment.setPatient(patient);
        appointment.setServiceName(serviceName);
        appointment.setAppointmentDate(date);
        appointment.setTimeSlot(slot);
        appointment.setConsultationType(ConsultationType.OFFLINE);
        appointment.setAmount(fee);
        appointment.setRazorpayOrderId(orderId);
        if (isDemoMode) {
            appointment.setStatus(AppointmentStatus.BOOKED);
            appointment.setRazorpayPaymentId("demo_service_" + System.currentTimeMillis());
        } else {
            appointment.setStatus(AppointmentStatus.PENDING);
        }
        
        // Capture patient location for emergency/ambulance services
        if (patient.getLatitude() != null && patient.getLongitude() != null) {
            appointment.setLatitude(patient.getLatitude());
            appointment.setLongitude(patient.getLongitude());
        }

        Appointment saved = appointmentRepository.save(appointment);

        Map<String, Object> response = new HashMap<>();
        response.put("appointmentId", saved.getId());
        response.put("razorpayOrderId", orderId);
        response.put("amount", fee);
        response.put("razorpayKeyId", razorpayKeyId);
        response.put("isDemo", isDemoMode);
        response.put("preferredPaymentMode", preferredPaymentMode);
        response.put("upiId", upiId);

        return response;
    }

    @Transactional
    public void verifyPayment(String orderId, String paymentId, String signature) throws Exception {
        // 1. Verify Signature
        JSONObject attributes = new JSONObject();
        attributes.put("razorpay_order_id", orderId);
        attributes.put("razorpay_payment_id", paymentId);
        attributes.put("razorpay_signature", signature);

        boolean isValid = Utils.verifyPaymentSignature(attributes, razorpayKeySecret);
        if (!isValid) throw new RuntimeException("Invalid payment signature");

        // 2. Persist Status
        Appointment appointment = appointmentRepository.findByRazorpayOrderId(orderId)
            .orElseThrow(() -> new RuntimeException("Appointment not found for order: " + orderId));

        appointment.setRazorpayPaymentId(paymentId);
        appointment.setStatus(AppointmentStatus.BOOKED);
        appointment.setCreatedAt(LocalDateTime.now());
        Appointment booked = appointmentRepository.save(appointment);

        // 3. Broadcast Synchronization (Unified Stakeholder Notification)
        broadcastAppointmentUpdate(booked);
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
        broadcastAppointmentUpdate(booked);

        Doctor doctor = booked.getDoctor();
        boolean isInstitutional = doctor.isInstitutional() && doctor.getHospitalEntity() != null;
        boolean isEmergency = booked.getServiceName() != null && SERVICES_24_7.contains(booked.getServiceName());
        String notificationType = isEmergency ? "EMERGENCY" : "APPOINTMENT";
        String notificationTitle = isEmergency ? "🚨 EMERGENCY REQUEST (UPI)" : "New Session (Direct UPI)";
        String description = isEmergency 
            ? "URGENT: " + booked.getPatient().getName() + " initiated " + booked.getServiceName() + " via UPI. Txn ID: " + transactionId + ". Deploy resources immediately."
            : booked.getPatient().getName() + " initiated a booking with Dr. " + doctor.getName() + " via Direct UPI. Txn ID: " + transactionId + ".";

        if (isInstitutional) {
            Hospital hospital = doctor.getHospitalEntity();
            // Notify all admins of this hospital
            for (HospitalAdmin admin : hospital.getAdmins()) {
                if (admin.isApproved()) {
                    notificationService.sendNotification(
                        admin.getUser().getId(),
                        notificationType,
                        notificationTitle,
                        description,
                        "/hospital/appointments",
                        "Verify & Deploy"
                    );
                }
            }
        }
        
        // Notify Doctor
        notificationService.sendNotification(
            doctor.getUser().getId(),
            notificationType,
            notificationTitle,
            description,
            "/doctor-dashboard/appointments",
            "Review Emergency"
        );

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
        broadcastAppointmentUpdate(booked);

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

    public List<String> getAvailableSlots(String facilityId, String serviceName, LocalDate date) {
        String timings;
        int duration = 15;
        int buffer = 0;
        Long entityId;
        boolean isHospital = false;

        if (facilityId.startsWith("hosp_")) {
            entityId = Long.valueOf(facilityId.substring(5).split("\\.")[0]);
            Hospital hospital = hospitalRepository.findById(entityId)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));
            timings = hospital.getConsultationTimings();
            
            if (serviceName != null && hospital.getServiceDurations() != null) {
                try {
                    JSONObject durations = new JSONObject(hospital.getServiceDurations());
                    if (durations.has(serviceName)) {
                        duration = durations.getInt(serviceName);
                    }
                } catch (Exception e) {}
            }
            isHospital = true;
        } else {
            String dIdStr = facilityId;
            if (dIdStr.startsWith("doc_")) dIdStr = dIdStr.substring(4);
            entityId = Long.valueOf(dIdStr.split("\\.")[0]);
            Doctor doctor = doctorRepository.findById(entityId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
            
            // Clinical Absence Shield
            if (doctor.getAbsenceDates() != null && doctor.getAbsenceDates().contains(date.toString())) {
                System.out.println("INFO: Absence detected for Dr. " + doctor.getName() + " on " + date + ". Collapsing all clinical windows.");
                return Collections.emptyList();
            }

            timings = doctor.getConsultationTimings();
            duration = (doctor.getSlotDuration() != null && doctor.getSlotDuration() > 0) ? doctor.getSlotDuration() : 15;
            buffer = (doctor.getSlotBuffer() != null) ? doctor.getSlotBuffer() : 0;

            if (serviceName != null && doctor.getServiceDurations() != null) {
                try {
                    JSONObject durations = new JSONObject(doctor.getServiceDurations());
                    if (durations.has(serviceName)) {
                        duration = durations.getInt(serviceName);
                    }
                } catch (Exception e) {}
            }
        }

        boolean is247 = serviceName != null && SERVICES_24_7.contains(serviceName);
        if (is247) {
            System.out.println("DEBUG: 24/7 Service Detected: " + serviceName + ". Overriding clinical window to 24 hours.");
            timings = "00:00 - 23:59";
            if (duration < 15) duration = 15; // Minimum 15m slots for emergency to prevent bloat
        }

        if (timings == null || timings.trim().isEmpty() || !timings.contains("-")) {
            return Collections.emptyList();
        }

        List<String> allSlots = new ArrayList<>();
        try {
            String[] parts = timings.split("-");
            java.time.LocalTime startTime = parseRobustTime(parts[0].trim());
            java.time.LocalTime endTime = parseRobustTime(parts[1].trim());

            if (startTime != null && endTime != null) {
                DateTimeFormatter displayFormatter = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);
                java.time.LocalTime current = startTime;
                while (current.isBefore(endTime)) {
                    allSlots.add(current.format(displayFormatter));
                    current = current.plusMinutes(duration + buffer);
                }
            }
        } catch (Exception e) {
            return Collections.emptyList();
        }

        LocalDateTime expiryTime = LocalDateTime.now().minusMinutes(10);
        List<Appointment> existing;
        if (isHospital) {
            existing = appointmentRepository.findByHospitalIdAndAppointmentDate(entityId, date);
        } else {
            existing = appointmentRepository.findByDoctorIdAndAppointmentDate(entityId, date);
        }

        // Get Capacity for this service
        int capacity = 1;
        String capacityJson = null;
        if (isHospital) {
            Hospital hospital = hospitalRepository.findById(entityId).orElse(null);
            if (hospital != null) capacityJson = hospital.getServiceCapacity();
        } else {
            Doctor doctor = doctorRepository.findById(entityId).orElse(null);
            if (doctor != null) capacityJson = doctor.getServiceCapacity();
        }

        if (serviceName != null && capacityJson != null) {
            try {
                JSONObject capacities = new JSONObject(capacityJson);
                if (capacities.has(serviceName)) {
                    capacity = capacities.getInt(serviceName);
                }
            } catch (Exception e) {}
        }
        if (capacity < 1) capacity = 1;

        Map<String, Long> slotCounts = existing.stream()
            .filter(a -> a.getStatus() == Appointment.AppointmentStatus.BOOKED || 
                        a.getStatus() == Appointment.AppointmentStatus.AWAITING_VERIFICATION ||
                        (a.getStatus() == Appointment.AppointmentStatus.PENDING && a.getCreatedAt() != null && a.getCreatedAt().isAfter(expiryTime)))
            .map(a -> a.getTimeSlot())
            .filter(Objects::nonNull)
            .collect(Collectors.groupingBy(slot -> slot, Collectors.counting()));

        final int finalCapacity = capacity;
        return allSlots.stream()
            .filter(slot -> slotCounts.getOrDefault(slot, 0L) < finalCapacity)
            .collect(Collectors.toList());
    }

    private java.time.LocalTime parseRobustTime(String timeStr) {
        String[] formats = {"hh:mm a", "h:mm a", "HH:mm", "H:mm", "hh:mma", "h:mma"};
        for (String format : formats) {
            try {
                return java.time.LocalTime.parse(timeStr.toUpperCase(), DateTimeFormatter.ofPattern(format, Locale.ENGLISH));
            } catch (Exception e) {}
        }
        return null;
    }
}
