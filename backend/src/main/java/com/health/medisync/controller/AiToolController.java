package com.health.medisync.controller;

import com.health.medisync.service.AppointmentService;
import com.health.medisync.model.Appointment.ConsultationType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/ai/execute")
@CrossOrigin(origins = "*")
public class AiToolController {

    private final AppointmentService appointmentService;

    public AiToolController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping("/action")
    public ResponseEntity<?> executeAction(Authentication authentication, @RequestBody Map<String, Object> request) {
        try {
            String action = (String) request.get("action");
            Map<String, Object> params = (Map<String, Object>) request.get("params");

            if ("book_appointment".equals(action)) {
                Long doctorId = Long.valueOf(params.get("doctorId").toString());
                LocalDate date = LocalDate.parse(params.get("date").toString());
                String slot = (String) params.get("slot");
                ConsultationType type = ConsultationType.valueOf((String) params.get("type"));
                String modality = params.containsKey("consultationModality") ? (String) params.get("consultationModality") : "General Consultation";

                Map<String, Object> response = appointmentService.initiateBooking(authentication.getName(), doctorId, date, slot, type, modality);
                return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", response));
            }

            if ("book_service".equals(action)) {
                String facilityId = (String) params.get("facilityId");
                String serviceName = (String) params.get("serviceName");
                LocalDate date = LocalDate.parse(params.get("date").toString());
                String slot = (String) params.get("slot");
                Double latitude = params.get("latitude") != null ? Double.valueOf(params.get("latitude").toString()) : null;
                Double longitude = params.get("longitude") != null ? Double.valueOf(params.get("longitude").toString()) : null;

                Map<String, Object> response = appointmentService.initiateServiceBooking(authentication.getName(), facilityId, serviceName, date, slot, latitude, longitude);
                return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", response));
            }

            return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", "Unknown action: " + action));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("status", "ERROR", "message", e.getMessage()));
        }
    }
}
