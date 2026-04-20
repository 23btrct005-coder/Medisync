package com.health.medisync.controller;

import com.health.medisync.model.Doctor;
import com.health.medisync.model.User;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.health.medisync.model.DoctorDTO;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    public AdminController(DoctorRepository doctorRepository, UserRepository userRepository) {
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/doctors/pending")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getPendingDoctors() {
        List<Doctor> pending = doctorRepository.findPendingHardened();
        List<DoctorDTO> dtos = pending.stream()
            .map(DoctorDTO::new)
            .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/doctors/{id}/approve")
    public ResponseEntity<?> approveDoctor(@PathVariable Long id) {
        return doctorRepository.findById(id).map(doctor -> {
            doctor.setApproved(true);
            User user = doctor.getUser();
            if (user != null) {
                user.setEnabled(true);
                userRepository.save(user);
            }
            doctorRepository.save(doctor);
            return ResponseEntity.ok(Map.of("message", "Doctor approved successfully!"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/doctors/{id}/reject")
    public ResponseEntity<?> rejectDoctor(@PathVariable Long id) {
        return doctorRepository.findById(id).map(doctor -> {
            User user = doctor.getUser();
            doctorRepository.delete(doctor);
            if (user != null) {
                userRepository.delete(user);
            }
            return ResponseEntity.ok(Map.of("message", "Doctor application rejected and record removed."));
        }).orElse(ResponseEntity.notFound().build());
    }
}
