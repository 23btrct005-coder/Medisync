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

    @GetMapping("/slots")
    public ResponseEntity<List<String>> getAvailableSlots(
            @RequestParam Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(appointmentService.getAvailableSlots(doctorId, date));
    }

    @PostMapping("/book")
    public ResponseEntity<?> initiateBooking(
            Authentication authentication,
            @RequestBody Map<String, Object> request) {
        try {
            Long doctorId = Long.valueOf(request.get("doctorId").toString());
            LocalDate date = LocalDate.parse(request.get("date").toString());
            String slot = request.get("slot").toString();
            ConsultationType type = ConsultationType.valueOf(request.get("type").toString());

            Appointment appt = appointmentService.initiateBooking(authentication.getName(), doctorId, date, slot, type);
            return ResponseEntity.ok(appt);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
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
        return ResponseEntity.ok(appointmentService.getPatientAppointments(authentication.getName()));
    }
}
