package com.health.medisync.controller;

import com.health.medisync.model.Patient;
import com.health.medisync.model.Doctor;
import com.health.medisync.model.AccessRequest;
import com.health.medisync.service.PatientService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/patient", "/patient"})
@CrossOrigin(origins = "*", maxAge = 3600)
public class PatientController {

    private final PatientService patientService;
    private final com.health.medisync.service.AuditLogService auditLogService;
    private final com.health.medisync.service.TelemetryService telemetryService;
    private final com.health.medisync.service.PrescriptionService prescriptionService;

    public PatientController(PatientService patientService, 
                             com.health.medisync.service.AuditLogService auditLogService,
                             com.health.medisync.service.TelemetryService telemetryService,
                             com.health.medisync.service.PrescriptionService prescriptionService) {
        this.patientService = patientService;
        this.auditLogService = auditLogService;
        this.telemetryService = telemetryService;
        this.prescriptionService = prescriptionService;
    }

    @GetMapping("/profile")
    public ResponseEntity<Patient> getProfile(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(patientService.getPatientProfile(username));
    }
    
    @PostMapping("/profile/sync")
    public ResponseEntity<Patient> syncProfile(@RequestBody java.util.Map<String, Object> profileData, Authentication authentication) {
        String authUsername = (authentication != null) ? authentication.getName() : null;
        String bodyEmail = (String) profileData.get("email");
        return ResponseEntity.ok(patientService.updateProfile(bodyEmail != null ? bodyEmail : authUsername, profileData));
    }

    @PostMapping("/link-doctor")
    public ResponseEntity<?> linkDoctor(@RequestBody Map<String, String> request, Authentication authentication) {
        try {
            String doctorEmail = request.get("doctorEmail");
            if (doctorEmail == null || doctorEmail.trim().isEmpty()) {
                // Support legacy requests hitting doctorUsername temporarily
                doctorEmail = request.get("doctorUsername");
                if(doctorEmail == null || doctorEmail.trim().isEmpty()) {
                     return ResponseEntity.badRequest().body(Map.of("message", "Doctor email is required"));
                }
            }
            patientService.linkDoctor(authentication.getName(), doctorEmail);
            return ResponseEntity.ok(Map.of("message", "Doctor linked successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/requests")
    public ResponseEntity<List<AccessRequest>> getPendingRequests(Authentication authentication) {
        return ResponseEntity.ok(patientService.getPendingRequests(authentication.getName()));
    }

    @PostMapping("/requests/{id}/accept")
    public ResponseEntity<?> acceptRequest(@PathVariable Long id, Authentication authentication) {
        try {
            patientService.acceptRequest(authentication.getName(), id);
            return ResponseEntity.ok(Map.of("message", "Request accepted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/requests/{id}/reject")
    public ResponseEntity<?> rejectRequest(@PathVariable Long id, Authentication authentication) {
        try {
            patientService.rejectRequest(authentication.getName(), id);
            return ResponseEntity.ok(Map.of("message", "Request rejected"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/profile/photo")
    public ResponseEntity<?> uploadPhoto(@RequestPart("photo") MultipartFile photo, Authentication authentication) {
        try {
            patientService.updateProfilePhoto(authentication.getName(), photo);
            return ResponseEntity.ok(Map.of("message", "Photo updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to upload photo: " + e.getMessage()));
        }
    }
    @GetMapping("/doctors")
    public ResponseEntity<List<com.health.medisync.model.Doctor>> getLinkedDoctors(Authentication authentication) {
        return ResponseEntity.ok(patientService.getLinkedDoctors(authentication.getName()));
    }

    @DeleteMapping("/doctors/{id}")
    public ResponseEntity<?> revokeDoctorAccess(@PathVariable Long id, Authentication authentication) {
        try {
            patientService.revokeDoctorAccess(authentication.getName(), id);
            return ResponseEntity.ok(Map.of("message", "Doctor access revoked"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/invite-doctor")
    public ResponseEntity<?> inviteDoctor(@RequestBody Map<String, String> request, Authentication authentication) {
        try {
            String doctorEmail = request.get("doctorEmail");
            if (doctorEmail == null || doctorEmail.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Doctor email is required"));
            }
            patientService.inviteDoctor(authentication.getName(), doctorEmail);
            return ResponseEntity.ok(Map.of("message", "Invitation sent successfully to " + doctorEmail));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<com.health.medisync.model.AuditLog>> getMyAuditLogs(Authentication authentication) {
        com.health.medisync.model.Patient patient = patientService.getPatientProfile(authentication.getName());
        return ResponseEntity.ok(auditLogService.getPatientAuditLogs(patient.getId()));
    }

    @GetMapping("/vitals")
    public ResponseEntity<List<com.health.medisync.model.Telemetry>> getMyVitals(Authentication authentication) {
        com.health.medisync.model.Patient patient = patientService.getPatientProfile(authentication.getName());
        if (patient == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(telemetryService.getPatientTelemetry(patient.getId()));
    }

    @PostMapping("/vitals/pulse")
    public ResponseEntity<?> sendTestPulse(@RequestBody com.health.medisync.model.Telemetry pulse, Authentication authentication) {
        telemetryService.broadcastVitalUpdate(authentication.getName(), pulse);
        return ResponseEntity.ok(Map.of("message", "Pulse broadcasted live"));
    }

    @PostMapping("/vitals/log")
    public ResponseEntity<com.health.medisync.model.Telemetry> logVitals(@RequestBody com.health.medisync.model.Telemetry vitals, Authentication authentication) {
        com.health.medisync.model.Patient patient = patientService.getPatientProfile(authentication.getName());
        vitals.setPatient(patient);
        com.health.medisync.model.Telemetry saved = telemetryService.saveTelemetry(authentication.getName(), vitals);
        // Also broadcast it for real-time UI updates if any
        telemetryService.broadcastVitalUpdate(authentication.getName(), saved);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/medications")
    public ResponseEntity<List<com.health.medisync.model.Prescription>> getMyMedications(Authentication authentication) {
        return ResponseEntity.ok(prescriptionService.getMyPrescriptions(authentication.getName()));
    }
}
