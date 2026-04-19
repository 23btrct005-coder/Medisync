package com.health.medisync.controller;

import com.health.medisync.model.Appointment;
import com.health.medisync.model.Appointment.ConsultationType;
import com.health.medisync.service.AppointmentService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<com.health.medisync.model.Doctor>> getAllDoctors() {
        return ResponseEntity.ok(appointmentService.getAllApprovedDoctors());
    }

    @PostMapping("/sync-marketplace")
    public ResponseEntity<?> syncMarketplace() {
        appointmentService.syncApprovedStatus();
        return ResponseEntity.ok(Map.of("message", "Marketplace synchronized successfully"));
    }

    @GetMapping("/slots")
    public ResponseEntity<?> getAvailableSlots(
            @RequestParam Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            return ResponseEntity.ok(appointmentService.getAvailableSlots(doctorId, date));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/book")
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

            if (doctorIdObj == null || dateObj == null || slotObj == null || typeObj == null) {
                throw new RuntimeException("Missing required fields: doctorId, date, slot, or type");
            }

            Long doctorId = Long.valueOf(doctorIdObj.toString());
            LocalDate date = LocalDate.parse(dateObj.toString());
            String slot = slotObj.toString();
            ConsultationType type = ConsultationType.valueOf(typeObj.toString());

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

    @PostMapping("/verify")
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

    @GetMapping("/my-appointments")
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
