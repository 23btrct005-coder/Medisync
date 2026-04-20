package com.health.medisync.controller;

import com.health.medisync.model.Doctor;
import com.health.medisync.model.Patient;
import com.health.medisync.model.MedicalRecord;
import com.health.medisync.model.MedicalRecordRequest;
import com.health.medisync.model.Report;
import com.health.medisync.model.AccessRequest;
import com.health.medisync.service.DoctorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/doctor")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping("/profile")
    public ResponseEntity<Doctor> getProfile(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(doctorService.getDoctorProfile(username));
    }

    @GetMapping("/patients")
    public ResponseEntity<List<Patient>> getAllPatients(Authentication authentication) {
        return ResponseEntity.ok(doctorService.getLinkedPatients(authentication.getName()));
    }

    @GetMapping("/patients/{id}")
    public ResponseEntity<Patient> getPatientById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(doctorService.getPatientById(authentication.getName(), id));
    }

    @GetMapping("/patients/{id}/records")
    public ResponseEntity<List<MedicalRecord>> getPatientRecords(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(doctorService.getPatientRecords(authentication.getName(), id));
    }

    @GetMapping("/patients/{id}/reports")
    public ResponseEntity<List<Report>> getPatientReports(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(doctorService.getPatientReports(authentication.getName(), id));
    }

    @PostMapping("/patients/{id}/records")
    public ResponseEntity<MedicalRecord> addRecord(@PathVariable Long id, 
                                                   @RequestBody MedicalRecordRequest request,
                                                   Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(doctorService.addMedicalRecord(username, id, request));
    }

    @GetMapping("/requests")
    public ResponseEntity<List<AccessRequest>> getMyRequests(Authentication authentication) {
        return ResponseEntity.ok(doctorService.getDoctorRequests(authentication.getName()));
    }

    @PostMapping("/request-access")
    public ResponseEntity<?> requestAccess(@RequestBody Map<String, Object> request, Authentication authentication) {
        try {
            if (request.containsKey("patientId")) {
                Object pIdObj = request.get("patientId");
                Long patientId;
                if (pIdObj instanceof Number) {
                    patientId = ((Number) pIdObj).longValue();
                } else {
                    patientId = Long.valueOf(pIdObj.toString().split("\\.")[0]);
                }
                doctorService.requestAccess(authentication.getName(), patientId);
            } else {
                String patientEmail = (String) request.get("patientEmail");
                doctorService.requestAccess(authentication.getName(), patientEmail);
            }
            return ResponseEntity.ok(Map.of("message", "Request sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/profile/sync")
    public ResponseEntity<Doctor> syncProfile(@RequestBody Map<String, Object> updates, Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(doctorService.updateProfile(username, updates));
    }

    @PostMapping("/profile/photo")
    @Transactional
    public ResponseEntity<?> uploadPhoto(@RequestPart("photo") MultipartFile photo, Authentication authentication) {
        try {
            doctorService.updateProfilePhoto(authentication.getName(), photo);
            return ResponseEntity.ok(Map.of("message", "Photo updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to upload photo: " + e.getMessage()));
        }
    }
}
