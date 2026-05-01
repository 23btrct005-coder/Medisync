package com.health.medisync.controller;

import com.health.medisync.model.Patient;
import com.health.medisync.service.PatientService;
import com.health.medisync.service.PredictiveHealthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/predictive")
public class PredictiveController {

    private final PredictiveHealthService predictiveHealthService;
    private final PatientService patientService;

    public PredictiveController(PredictiveHealthService predictiveHealthService, PatientService patientService) {
        this.predictiveHealthService = predictiveHealthService;
        this.patientService = patientService;
    }

    @GetMapping("/risk-profile/{patientId}")
    public ResponseEntity<?> getRiskProfile(@PathVariable Long patientId) {
        try {
            Patient patient = patientService.getPatientById(patientId);
            String predictionJson = predictiveHealthService.generateHealthRiskPrediction(patient);
            return ResponseEntity.ok(predictionJson);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
