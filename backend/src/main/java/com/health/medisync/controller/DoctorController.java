package com.health.medisync.controller;

import com.health.medisync.model.Doctor;
import com.health.medisync.model.Patient;
import com.health.medisync.model.MedicalRecord;
import com.health.medisync.model.MedicalRecordRequest;
import com.health.medisync.model.Report;
import com.health.medisync.model.AccessRequest;
import com.health.medisync.service.DoctorService;
import com.health.medisync.service.HospitalService;
import com.health.medisync.service.AppointmentService;
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
    private final HospitalService hospitalService;
    private final AppointmentService appointmentService;

    public DoctorController(DoctorService doctorService, HospitalService hospitalService, AppointmentService appointmentService) {
        this.doctorService = doctorService;
        this.hospitalService = hospitalService;
        this.appointmentService = appointmentService;
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
    public ResponseEntity<?> getPatientById(@PathVariable Long id, Authentication authentication) {
        try {
            return ResponseEntity.ok(doctorService.getPatientById(authentication.getName(), id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/patients/{id}/records")
    public ResponseEntity<?> getPatientRecords(@PathVariable Long id, Authentication authentication) {
        try {
            return ResponseEntity.ok(doctorService.getPatientRecords(authentication.getName(), id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/patients/{id}/reports")
    public ResponseEntity<?> getPatientReports(@PathVariable Long id, Authentication authentication) {
        try {
            return ResponseEntity.ok(doctorService.getPatientReports(authentication.getName(), id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
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

    @GetMapping("/patient-by-code/{code}")
    public ResponseEntity<?> getPatientByCode(@PathVariable String code, Authentication authentication) {
        try {
            java.util.Optional<java.util.Map<String, Object>> details = 
                doctorService.getPatientDetailsForDoctor(authentication.getName(), code);
            
            if (details.isEmpty()) {
                return ResponseEntity.status(404).body(java.util.Map.of("message", "Patient with ID " + code + " not found."));
            }
            
            return ResponseEntity.ok(details.get());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(java.util.Map.of("message", "Clinical lookup exception: " + e.getMessage()));
        }
    }

    @GetMapping("/list")
    public ResponseEntity<List<com.health.medisync.model.Doctor>> getDoctorList(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(doctorService.searchDoctors(search));
    }

    @PostMapping("/unlock-history")
    public ResponseEntity<?> unlockHistory(@RequestBody Map<String, String> request, Authentication authentication) {
        try {
            String patientId = request.get("patientId");
            String passcode = request.get("passcode");
            doctorService.unlockHistoryWithPasscode(authentication.getName(), patientId, passcode);
            return ResponseEntity.ok(Map.of("message", "Patient history unlocked successfully. Direct access granted."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/analytics/revenue")
    public ResponseEntity<?> getRevenueAnalytics(Authentication authentication) {
        try {
            return ResponseEntity.ok(doctorService.getRevenueAnalytics(authentication.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/institutional-stats")
    public ResponseEntity<?> getInstitutionalStats(Authentication authentication) {
        try {
            Doctor doctor = doctorService.getDoctorProfile(authentication.getName());
            if (doctor.getHospitalEntity() == null) {
                return ResponseEntity.ok(Map.of("isInstitutional", false));
            }
            Map<String, Object> stats = hospitalService.getHospitalStats(doctor.getHospitalEntity());
            stats.put("isInstitutional", true);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/institutional-contacts")
    public ResponseEntity<?> getInstitutionalContacts(Authentication authentication) {
        try {
            Doctor doctor = doctorService.getDoctorProfile(authentication.getName());
            if (doctor.getHospitalEntity() == null) {
                return ResponseEntity.ok(List.of());
            }
            
            java.util.List<java.util.Map<String, Object>> contacts = new java.util.ArrayList<>();
            
            // 1. Add Hospital Admin
            hospitalService.getAdminByHospital(doctor.getHospitalEntity()).ifPresent(admin -> {
                java.util.Map<String, Object> m = new java.util.HashMap<>();
                m.put("id", admin.getId());
                m.put("userId", admin.getUser().getId());
                m.put("name", admin.getName() + " (Institutional Admin)");
                m.put("role", "HOSPITAL_ADMIN");
                m.put("profilePictureUrl", admin.getProfilePictureUrl());
                m.put("position", admin.getPosition());
                contacts.add(m);
            });
            
            // 2. Add Other Doctors
            List<Doctor> colleagues = hospitalService.getHospitalDoctors(doctor.getHospitalEntity());
            for (Doctor d : colleagues) {
                if (!d.getId().equals(doctor.getId())) {
                    java.util.Map<String, Object> m = new java.util.HashMap<>();
                    m.put("id", d.getId());
                    m.put("userId", d.getUser().getId());
                    m.put("name", d.getName());
                    m.put("role", "DOCTOR");
                    m.put("profilePictureUrl", d.getProfilePictureUrl());
                    m.put("specialization", d.getSpecialization());
                    contacts.add(m);
                }
            }
            
            return ResponseEntity.ok(contacts);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
