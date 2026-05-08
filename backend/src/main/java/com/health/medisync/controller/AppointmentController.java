package com.health.medisync.controller;

import com.health.medisync.model.Appointment;
import com.health.medisync.model.Appointment.ConsultationType;
import com.health.medisync.service.AppointmentService;
import com.health.medisync.service.DoctorService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.health.medisync.model.Appointment.AppointmentStatus;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final DoctorService doctorService;
    private final com.health.medisync.repository.HospitalRepository hospitalRepository;

    public AppointmentController(AppointmentService appointmentService, DoctorService doctorService, com.health.medisync.repository.HospitalRepository hospitalRepository) {
        this.appointmentService = appointmentService;
        this.doctorService = doctorService;
        this.hospitalRepository = hospitalRepository;
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<com.health.medisync.model.DoctorDTO>> getAllDoctors() {
        return ResponseEntity.ok(appointmentService.getAllApprovedDoctors());
    }

    @PostMapping("/sync-marketplace")
    public ResponseEntity<?> syncMarketplace() {
        appointmentService.syncApprovedStatus();
        return ResponseEntity.ok(Map.of("message", "Marketplace synchronized successfully"));
    }

    @GetMapping("/slots")
    public ResponseEntity<?> getAvailableSlots(
            @RequestParam(required = false) String doctorId,
            @RequestParam(required = false) String serviceName,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            if (doctorId == null || doctorId.trim().isEmpty() || doctorId.equalsIgnoreCase("undefined") || doctorId.equalsIgnoreCase("null")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid or missing doctorId parameter"));
            }
            return ResponseEntity.ok(appointmentService.getAvailableSlots(doctorId, serviceName, date));
        } catch (Exception e) {
            String errorMsg = e.getClass().getSimpleName() + ": " + e.getMessage();
            System.err.println("ERROR: Slot retrieval failed for doc " + doctorId + " on " + date + ": " + errorMsg);
            return ResponseEntity.badRequest().body(Map.of("message", errorMsg));
        }
    }

    @PostMapping("/book")
    @Transactional
    public ResponseEntity<?> initiateBooking(
            Authentication authentication,
            @RequestBody Map<String, Object> request) {
        System.out.println("DEBUG: Incoming Booking Request: " + request);
        try {
            if (authentication == null) throw new RuntimeException("Security context missing (authentication is null)");
            
            Object doctorIdObj = request.get("doctorId");
            Object dateObj = request.get("date");
            Object slotObj = request.get("slot");
            Object typeObj = request.get("type");

            Long doctorId;
            try {
                String dIdStr = doctorIdObj.toString().trim();
                if (dIdStr.isEmpty()) throw new Exception("FIELD_EMPTY: doctorId");
                doctorId = Long.valueOf(dIdStr.split("\\.")[0]);
            } catch (Exception e) {
                throw new RuntimeException("PARSE_ERROR: invalid doctorId [" + doctorIdObj + "]: " + e.getMessage());
            }

            LocalDate date;
            try {
                String dStr = dateObj.toString().trim();
                if (dStr.isEmpty()) throw new Exception("FIELD_EMPTY: date");
                date = LocalDate.parse(dStr);
            } catch (Exception e) {
                throw new RuntimeException("PARSE_ERROR: invalid date [" + dateObj + "]: " + e.getMessage());
            }

            ConsultationType type;
            try {
                String tStr = typeObj.toString().trim();
                if (tStr.isEmpty()) throw new Exception("FIELD_EMPTY: type");
                type = ConsultationType.valueOf(tStr);
            } catch (Exception e) {
                throw new RuntimeException("PARSE_ERROR: invalid type [" + typeObj + "]: " + e.getMessage());
            }

            String slot = slotObj.toString();
            if (slot.trim().isEmpty()) throw new RuntimeException("FIELD_EMPTY: slot");

            Map<String, Object> response = appointmentService.initiateBooking(authentication.getName(), doctorId, date, slot, type);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            String errorMessage = (e.getMessage() != null) ? e.getMessage() : e.toString();
            System.err.println("CRITICAL: Booking Initiation Failed: " + errorMessage);
            e.printStackTrace();
            // Return actual error message so frontend toast is helpful
            return ResponseEntity.badRequest().body(Map.of(
                "message", errorMessage,
                "errorType", e.getClass().getSimpleName()
            ));
        }
    }

    @GetMapping("/hospitals-by-service")
    public ResponseEntity<?> getHospitalsByService(
            @RequestParam String service,
            @RequestParam(required = false) String bloodGroup) {
        List<Map<String, Object>> facilities = new java.util.ArrayList<>();
        ObjectMapper mapper = new ObjectMapper();
        
        // Hospitals
        hospitalRepository.findAll().stream()
            .filter(h -> h.getServices() != null && h.getServices().toLowerCase().contains(service.toLowerCase()))
            .filter(h -> {
                // Blood Bank logic
                if (service.equalsIgnoreCase("Blood Bank")) {
                    if (bloodGroup == null || bloodGroup.isEmpty()) return true;
                    if (h.getBloodStock() == null) return false;
                    try {
                        Map<String, Integer> stock = mapper.readValue(h.getBloodStock(), Map.class);
                        return stock.getOrDefault(bloodGroup, 0) > 0;
                    } catch (Exception e) { return false; }
                }
                // Price enforcement: must have a non-zero price for the service
                if (h.getServiceFees() == null || h.getServiceFees().isEmpty()) return false;
                try {
                    Map<String, Object> fees = mapper.readValue(h.getServiceFees(), Map.class);
                    Object price = fees.get(service);
                    if (price == null) return false;
                    double fee = Double.parseDouble(price.toString());
                    return fee > 0;
                } catch (Exception e) { return false; }
            })
            .forEach(h -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", "hosp_" + h.getId());
                map.put("name", h.getName());
                map.put("logoUrl", h.getLogoUrl());
                map.put("hospitalType", h.getHospitalType() != null ? h.getHospitalType() : "Medical Center");
                map.put("city", h.getCity());
                map.put("state", h.getState());
                map.put("serviceFees", h.getServiceFees());
                map.put("latitude", h.getLatitude());
                map.put("longitude", h.getLongitude());
                facilities.add(map);
            });

        // Doctors/Clinics
        appointmentService.getAllApprovedDoctors().stream()
            .filter(d -> d.getServices() != null && d.getServices().toLowerCase().contains(service.toLowerCase()))
            .filter(d -> {
                // Price enforcement for clinics
                if (d.getServiceFees() == null || d.getServiceFees().isEmpty()) return false;
                try {
                    Map<String, Object> fees = mapper.readValue(d.getServiceFees(), Map.class);
                    Object price = fees.get(service);
                    if (price == null) return false;
                    double fee = Double.parseDouble(price.toString());
                    return fee > 0;
                } catch (Exception e) { return false; }
            })
            .forEach(d -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", "doc_" + d.getId());
                map.put("name", d.getName() + (d.getName().toLowerCase().contains("clinic") ? "" : "'s clinic"));
                map.put("logoUrl", d.getProfilePictureUrl());
                map.put("hospitalType", "Independent Clinic");
                map.put("city", d.getClinicCity());
                map.put("state", d.getClinicState());
                map.put("serviceFees", d.getServiceFees());
                map.put("latitude", d.getLatitude());
                map.put("longitude", d.getLongitude());
                facilities.add(map);
            });

        return ResponseEntity.ok(facilities);
    }

    @PostMapping("/book-service")
    @Transactional
    public ResponseEntity<?> initiateServiceBooking(
            Authentication authentication,
            @RequestBody Map<String, Object> request) {
        try {
            if (authentication == null) throw new RuntimeException("Authentication required");
            
            String facilityId = request.get("hospitalId").toString();
            String serviceName = (String) request.get("serviceName");
            LocalDate date = LocalDate.parse(request.get("date").toString());
            String slot = (String) request.get("slot");

            Map<String, Object> response = appointmentService.initiateServiceBooking(authentication.getName(), facilityId, serviceName, date, slot);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/verify")
    @Transactional
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> request) {
        try {
            appointmentService.verifyPayment(
                request.get("razorpay_order_id"),
                request.get("razorpay_payment_id"),
                request.get("razorpay_signature")
            );
            return ResponseEntity.ok(Map.of("message", "Appointment booked successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/verify-upi")
    @Transactional
    public ResponseEntity<?> verifyUpiPayment(@RequestBody Map<String, Object> request) {
        try {
            if (request.get("appointmentId") == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Missing appointmentId"));
            }
            Long appointmentId = Long.valueOf(request.get("appointmentId").toString());
            String patientUpiId = (String) request.get("patientUpiId");
            String transactionId = (String) request.get("transactionId");
            
            appointmentService.verifyUpiPayment(appointmentId, patientUpiId, transactionId);
            return ResponseEntity.ok(Map.of("message", "Appointment initiated. Awaiting administrative verification."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/confirm-upi")
    @Transactional
    public ResponseEntity<?> confirmUpiPayment(Authentication authentication, @RequestBody Map<String, Object> request) {
        try {
            if (request.get("appointmentId") == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Missing appointmentId"));
            }
            Long appointmentId = Long.valueOf(request.get("appointmentId").toString());
            appointmentService.confirmUpiPayment(authentication.getName(), appointmentId);
            return ResponseEntity.ok(Map.of("message", "Payment verified and appointment booked."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping({"/my-appointments", "/patient"})
    @Transactional(readOnly = true)
    public ResponseEntity<List<Appointment>> myAppointments(Authentication authentication) {
        try {
            String email = authentication.getName();
            boolean isDoctor = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_DOCTOR"));

            if (isDoctor) {
                return ResponseEntity.ok(appointmentService.getDoctorAppointments(email));
            } else {
                return ResponseEntity.ok(appointmentService.getPatientAppointments(email));
            }
        } catch (Exception e) {
            System.err.println("CRITICAL: Fetching Appointments Failed: " + e.getMessage());
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }
}
