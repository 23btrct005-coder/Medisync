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

    public AiController(AiService aiService, AiQueryLogRepository aiQueryLogRepository) {
        this.aiService = aiService;
        this.aiQueryLogRepository = aiQueryLogRepository;
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, String> request) {
        try {
            String userMessage = request.get("message");
            String location = request.get("location");
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

            String response = aiService.generateResponse(userMessage, patientEmail, roles, location);
            return ResponseEntity.ok(Map.of("response", response));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Clinical Engine Error: " + e.getMessage()));
        }
    }

    @GetMapping("/analytics/{hospitalId}")
    @PreAuthorize("hasRole('HOSPITAL_ADMIN')")
    public ResponseEntity<?> getAnalytics(@PathVariable Long hospitalId) {
        return ResponseEntity.ok(aiQueryLogRepository.findAll());
    }
}
