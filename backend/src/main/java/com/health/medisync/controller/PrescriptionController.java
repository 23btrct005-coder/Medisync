package com.health.medisync.controller;

import com.health.medisync.model.Prescription;
import com.health.medisync.service.PrescriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }

    // Patient's own view
    @GetMapping("/my")
    public ResponseEntity<List<Prescription>> getMyPrescriptions(Authentication authentication) {
        return ResponseEntity.ok(prescriptionService.getMyPrescriptions(authentication.getName()));
    }

    @PostMapping("/patient/add")
    public ResponseEntity<Prescription> addMedication(@RequestBody Prescription prescription, Authentication authentication) {
        return ResponseEntity.ok(prescriptionService.addPatientMedication(authentication.getName(), prescription));
    }

    // Doctor Actions
    @PostMapping("/doctor/patients/{id}")
    public ResponseEntity<Prescription> createPrescription(@PathVariable Long id, 
                                                           @RequestBody Prescription prescription,
                                                           Authentication authentication) {
        return ResponseEntity.ok(prescriptionService.createPrescription(authentication.getName(), id, prescription));
    }

    @GetMapping("/doctor/patients/{id}")
    public ResponseEntity<List<Prescription>> getPatientPrescriptions(@PathVariable Long id) {
        return ResponseEntity.ok(prescriptionService.getPatientPrescriptions(id));
    }
}
