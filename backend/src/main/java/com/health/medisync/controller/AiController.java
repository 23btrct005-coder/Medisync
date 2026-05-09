package com.health.medisync.controller;

import com.health.medisync.service.AiService;
import com.health.medisync.repository.AiQueryLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {

    private final AiService aiService;
    private final AiQueryLogRepository aiQueryLogRepository;
    private final com.health.medisync.repository.HospitalAdminRepository hospitalAdminRepository;

    public AiController(AiService aiService, AiQueryLogRepository aiQueryLogRepository, com.health.medisync.repository.HospitalAdminRepository hospitalAdminRepository) {
        this.aiService = aiService;
        this.aiQueryLogRepository = aiQueryLogRepository;
        this.hospitalAdminRepository = hospitalAdminRepository;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> request) {
        try {
            String userMessage = (String) request.get("message");
            String location = (String) request.get("location");
            java.util.List<Map<String, String>> history = (java.util.List<Map<String, String>>) request.get("history");

            if (userMessage == null || userMessage.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty"));
            }

            String patientEmail = null;
            java.util.List<String> roles = new java.util.ArrayList<>();
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                patientEmail = auth.getName();
                auth.getAuthorities().forEach(a -> roles.add(a.getAuthority()));
            }

            String imageData = (String) request.get("imageData");
            String response = aiService.generateResponse(userMessage, history, patientEmail, roles, location, imageData);
            return ResponseEntity.ok(Map.of("response", response));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Clinical Engine Error: " + e.getMessage()));
        }
    }

    @GetMapping("/analytics/{hospitalId}")
    @PreAuthorize("hasRole('HOSPITAL_ADMIN')")
    public ResponseEntity<?> getAnalytics(@PathVariable String hospitalId) {
        try {
            Long id;
            if ("current".equalsIgnoreCase(hospitalId)) {
                var auth = SecurityContextHolder.getContext().getAuthentication();
                String email = auth.getName();
                var admin = hospitalAdminRepository.findByUserUsernameIgnoreCase(email)
                        .orElseThrow(() -> new RuntimeException("Institutional node not found for administrator"));
                id = admin.getHospital().getId();
            } else {
                id = Long.valueOf(hospitalId);
            }
            return ResponseEntity.ok(aiQueryLogRepository.findByHospitalIdOrderByCreatedAtDesc(id));
        } catch (Exception e) {
            e.printStackTrace(); // Log for 500 debugging
            return ResponseEntity.status(500).body(Map.of("error", "Analytics Retrieval Error: " + e.getMessage()));
        }
    }
}
