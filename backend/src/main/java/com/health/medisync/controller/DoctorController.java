package com.health.medisync.controller;

import com.health.medisync.model.Doctor;
import com.health.medisync.model.Patient;
import com.health.medisync.model.MedicalRecord;
import com.health.medisync.model.MedicalRecordRequest;
import com.health.medisync.model.Report;
import com.health.medisync.service.DoctorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
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
    public ResponseEntity<Patient> getPatientById(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getPatientById(id));
    }

    @GetMapping("/patients/{id}/records")
    public ResponseEntity<List<MedicalRecord>> getPatientRecords(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getPatientRecords(id));
    }

    @GetMapping("/patients/{id}/reports")
    public ResponseEntity<List<Report>> getPatientReports(@PathVariable Long id) {
        return ResponseEntity.ok(doctorService.getPatientReports(id));
    }

    @PostMapping("/patients/{id}/records")
    public ResponseEntity<MedicalRecord> addRecord(@PathVariable Long id, 
                                                   @RequestBody MedicalRecordRequest request,
                                                   Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(doctorService.addMedicalRecord(username, id, request));
    }

    @PostMapping("/request-access")
    public ResponseEntity<?> requestAccess(@RequestBody Map<String, String> request, Authentication authentication) {
        try {
            String patientEmail = request.get("patientEmail");
            doctorService.requestAccess(authentication.getName(), patientEmail);
            return ResponseEntity.ok(Map.of("message", "Request sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
