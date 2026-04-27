package com.health.medisync.controller;

import com.health.medisync.model.Doctor;
import com.health.medisync.service.HospitalService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hospital")
@CrossOrigin(origins = "*", maxAge = 3600)
public class HospitalController {
    
    private final HospitalService hospitalService;

    public HospitalController(HospitalService hospitalService) {
        this.hospitalService = hospitalService;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(Authentication authentication) {
        return ResponseEntity.ok(hospitalService.getHospitalStats(authentication.getName()));
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<Doctor>> getDoctors(Authentication authentication) {
        return ResponseEntity.ok(hospitalService.getHospitalDoctors(authentication.getName()));
    }

    @PostMapping("/approve-doctor/{id}")
    public ResponseEntity<?> approveDoctor(@PathVariable Long id, Authentication authentication) {
        try {
            hospitalService.approveDoctor(authentication.getName(), id);
            return ResponseEntity.ok(Map.of("message", "Staff physician approved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
