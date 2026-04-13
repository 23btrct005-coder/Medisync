package com.health.medisync.controller;

import com.health.medisync.model.Patient;
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

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
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
            patientService.updateProfilePhoto(authentication.getName(), photo.getBytes());
            return ResponseEntity.ok(Map.of("message", "Photo updated successfully"));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to upload photo"));
        }
    }
}
