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
        List<Doctor> doctors = hospitalService.getHospitalDoctors(admin.getHospital());
        System.out.println("DEBUG: Fetching doctors for hospital " + admin.getHospital().getName() + " (ID: " + admin.getHospital().getId() + "). Found: " + doctors.size());
        return ResponseEntity.ok(doctors);
    }

    @PostMapping("/approve-doctor/{id}")
    public ResponseEntity<?> approveDoctor(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        hospitalService.approveDoctor(id, admin.getHospital());
        return ResponseEntity.ok(Map.of("message", "Physician approved successfully"));
    }

    @GetMapping("/appointments")
    public ResponseEntity<?> getAppointments(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        return ResponseEntity.ok(hospitalService.getHospitalAppointments(admin.getHospital()));
    }

    @GetMapping("/patients")
    public ResponseEntity<?> getPatients(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        return ResponseEntity.ok(hospitalService.getHospitalPatients(admin.getHospital()));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        return ResponseEntity.ok(admin);
    }

    @PostMapping("/book-appointment")
    public ResponseEntity<?> bookAppointment(@RequestBody Map<String, Object> request, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        
        Long patientId = Long.valueOf(request.get("patientId").toString());
        Long doctorId = Long.valueOf(request.get("doctorId").toString());
        java.time.LocalDate date = java.time.LocalDate.parse(request.get("date").toString());
        String slot = request.get("slot").toString();
        String type = request.get("type").toString();
        
        hospitalService.bookAppointment(patientId, doctorId, date, slot, type, admin.getHospital());
        return ResponseEntity.ok(Map.of("message", "Appointment synchronized successfully"));
    }

    @PostMapping("/update-doctor/{id}")
    public ResponseEntity<?> updateDoctor(@PathVariable Long id, @RequestBody Map<String, Object> updates, @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        HospitalAdmin admin = hospitalService.getAdminByUser(user);
        hospitalService.updateDoctorProfile(id, updates, admin.getHospital());
        return ResponseEntity.ok(Map.of("message", "Physician profile updated successfully"));
    }
}
