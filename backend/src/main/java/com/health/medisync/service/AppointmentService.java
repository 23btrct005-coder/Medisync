package com.health.medisync.service;

import com.health.medisync.model.Appointment;
import com.health.medisync.model.Appointment.AppointmentStatus;
import com.health.medisync.model.Appointment.ConsultationType;
import com.health.medisync.model.Doctor;
import com.health.medisync.model.Patient;
import com.health.medisync.model.User;
import com.health.medisync.repository.AppointmentRepository;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.PatientRepository;
import com.health.medisync.repository.UserRepository;
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
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;

    public AppointmentService(AppointmentRepository appointmentRepository, 
                              DoctorRepository doctorRepository, 
                              PatientRepository patientRepository,
                              UserRepository userRepository) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
    }

    public List<String> getAvailableSlots(Long doctorId, LocalDate date) {
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (!doctor.getAppointmentsEnabled()) {
            return Collections.emptyList();
        }

        // 1. Generate all possible slots from consultationTimings (e.g., "10:00 AM - 05:00 PM")
        List<String> allSlots = parseSlots(doctor.getConsultationTimings());

        // 2. Filter out booked or pending (not expired) slots
        LocalDateTime expiryTime = LocalDateTime.now().minusMinutes(10);
        List<Appointment> existing = appointmentRepository.findByDoctorIdAndAppointmentDate(doctorId, date);
        
        Set<String> takenSlots = existing.stream()
            .filter(a -> a.getStatus() == AppointmentStatus.BOOKED || 
                        (a.getStatus() == AppointmentStatus.PENDING && a.getCreatedAt().isAfter(expiryTime)))
            .map(a -> a.getTimeSlot())
            .collect(Collectors.toSet());

        return allSlots.stream()
            .filter(slot -> !takenSlots.contains(slot))
            .collect(Collectors.toList());
    }

    private List<String> parseSlots(String timings) {
        // Logic to parse "10:00 AM - 05:00 PM" into 30 min intervals
        try {
            String[] parts = timings.split(" - ");
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);
            java.time.LocalTime start = java.time.LocalTime.parse(parts[0].trim(), formatter);
            java.time.LocalTime end = java.time.LocalTime.parse(parts[1].trim(), formatter);

            List<String> slots = new ArrayList<>();
            while (start.isBefore(end)) {
                slots.add(start.format(formatter));
                start = start.plusMinutes(30);
            }
            return slots;
        } catch (Exception e) {
            return Arrays.asList("09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM");
        }
    }

    @Transactional
    public Map<String, Object> initiateBooking(String patientEmail, Long doctorId, LocalDate date, String slot, ConsultationType type) throws Exception {
        Patient patient = patientRepository.findByEmail(patientEmail)
            .orElseThrow(() -> new RuntimeException("Patient not found"));
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (!doctor.getAppointmentsEnabled()) {
            throw new RuntimeException("This doctor is not accepting appointments at the moment.");
        }

        // Concurrency check
        LocalDateTime expiryTime = LocalDateTime.now().minusMinutes(10);
        List<Appointment> conflicts = appointmentRepository.findConflictingAppointments(doctor, date, slot, expiryTime);
        if (!conflicts.isEmpty()) {
            throw new RuntimeException("This slot was just taken. Please choose another time.");
        }

        Double fee = (type == ConsultationType.ONLINE) ? doctor.getOnlineConsultationFee() : doctor.getOfflineConsultationFee();
        if (fee == null) {
            String feeStr = doctor.getConsultationFee();
            if (feeStr != null && !feeStr.isEmpty()) {
                String numericFee = feeStr.replaceAll("[^0-9]", "");
                if (!numericFee.isEmpty()) {
                    fee = Double.valueOf(numericFee);
                }
            }
        }
        
        // Final fallback if all else fails
        if (fee == null || fee <= 0) fee = 500.0; 

        if (razorpayKeyId == null || razorpayKeyId.isEmpty()) {
            throw new RuntimeException("Payment system is not configured. Please contact admin.");
        }

        // Create Razorpay Order
        RazorpayClient client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", (int)(fee * 100)); // amount in paise
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "appt_" + System.currentTimeMillis());

        // Razorpay Route - Transfer directly to doctor
        if (doctor.getRazorpayAccountId() != null && !doctor.getRazorpayAccountId().isEmpty()) {
            JSONArray transfers = new JSONArray();
            JSONObject transfer = new JSONObject();
            transfer.put("account", doctor.getRazorpayAccountId());
            transfer.put("amount", (int)(fee * 100)); // Send 100% to doctor
            transfer.put("currency", "INR");
            transfers.put(transfer);
            orderRequest.put("transfers", transfers);
        }

        Order order = client.orders.create(orderRequest);

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(date);
        appointment.setTimeSlot(slot);
        appointment.setConsultationType(type);
        appointment.setAmount(fee);
        appointment.setRazorpayOrderId(order.get("id"));
        appointment.setStatus(AppointmentStatus.PENDING);

        Appointment saved = appointmentRepository.save(appointment);

        Map<String, Object> response = new HashMap<>();
        response.put("appointmentId", saved.getId());
        response.put("razorpayOrderId", order.get("id"));
        response.put("amount", fee);
        response.put("razorpayKeyId", razorpayKeyId);

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
        appointmentRepository.save(appointment);
    }

    public List<Appointment> getPatientAppointments(String email) {
        User user = userRepository.findByUsernameIgnoreCase(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Patient patient = patientRepository.findByUserId(user.getId())
            .orElseThrow(() -> new RuntimeException("Patient profile not found"));
        return appointmentRepository.findByPatientId(patient.getId());
    }

    public List<Appointment> getDoctorAppointments(String email) {
        User user = userRepository.findByUsernameIgnoreCase(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        Doctor doctor = doctorRepository.findByUserId(user.getId())
            .orElseThrow(() -> new RuntimeException("Doctor profile not found"));
        return appointmentRepository.findByDoctorId(doctor.getId());
    }

    public List<Doctor> getAllApprovedDoctors() {
        return doctorRepository.findByApprovedTrue();
    }

    @Transactional
    public void syncApprovedStatus() {
        List<Doctor> all = doctorRepository.findAll();
        for (Doctor d : all) {
            d.setApproved(true);
            d.setAppointmentsEnabled(true);
            User user = d.getUser();
            if (user != null) {
                user.setEnabled(true);
                userRepository.save(user); // Also enable user login
            }
        }
        doctorRepository.saveAll(all);
    }
}
