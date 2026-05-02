package com.health.medisync.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final com.health.medisync.repository.UserRepository userRepository;
    private final com.health.medisync.repository.DoctorRepository doctorRepository;

    public HealthController(com.health.medisync.repository.UserRepository userRepository, 
                            com.health.medisync.repository.DoctorRepository doctorRepository) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
    }

    @GetMapping
    public Map<String, Object> checkHealth() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "UP");
        status.put("platform", "Antigravity Pro");
        status.put("node", "Unified Healthcare OS");
        status.put("timestamp", System.currentTimeMillis());
        return status;
    }

    @GetMapping("/diagnose")
    public Map<String, Object> diagnoseUser(@org.springframework.web.bind.annotation.RequestParam String email) {
        Map<String, Object> result = new HashMap<>();
        String normalizedEmail = email.trim().toLowerCase();
        
        userRepository.findByUsernameIgnoreCase(normalizedEmail).ifPresentOrElse(
            u -> {
                result.put("user_found", true);
                result.put("user_role", u.getRole());
                result.put("user_enabled", u.isEnabled());
                result.put("email_verified", u.isEmailVerified());
            },
            () -> result.put("user_found", false)
        );

        doctorRepository.findFirstByEmail(normalizedEmail).ifPresentOrElse(
            d -> {
                result.put("doctor_found", true);
                result.put("doctor_approved", d.isApproved());
                result.put("doctor_hospital", d.getHospitalEntity() != null ? d.getHospitalEntity().getName() : d.getHospital());
                result.put("doctor_hospital_id", d.getHospitalEntity() != null ? d.getHospitalEntity().getId() : null);
            },
            () -> result.put("doctor_found", false)
        );

        return result;
    }
}
