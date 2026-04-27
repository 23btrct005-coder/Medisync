package com.health.medisync.controller;

import com.health.medisync.model.Doctor;
import com.health.medisync.model.HospitalAdmin;
import com.health.medisync.model.User;
import com.health.medisync.service.HospitalService;
import com.health.medisync.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hospital")
public class HospitalController {

    private final HospitalService hospitalService;
    private final UserRepository userRepository;

    public HospitalController(HospitalService hospitalService, UserRepository userRepository) {
        this.hospitalService = hospitalService;
        this.userRepository = userRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        return ResponseEntity.ok(hospitalService.getHospitalStats(admin.getHospital()));
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<Doctor>> getDoctors(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        return ResponseEntity.ok(hospitalService.getHospitalDoctors(admin.getHospital()));
    }

    @PostMapping("/approve-doctor/{id}")
    public ResponseEntity<?> approveDoctor(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        hospitalService.approveDoctor(id, admin.getHospital());
        return ResponseEntity.ok(Map.of("message", "Physician approved successfully"));
    }
}
