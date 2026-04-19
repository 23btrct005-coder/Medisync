package com.health.medisync.controller;

import com.health.medisync.model.AuthRequest;
import com.health.medisync.model.AuthResponse;
import com.health.medisync.security.JwtUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.health.medisync.model.Patient;
import com.health.medisync.repository.PatientRepository;
import com.health.medisync.model.User;
import com.health.medisync.model.Doctor;
import com.health.medisync.repository.UserRepository;
import com.health.medisync.repository.DoctorRepository;

import com.health.medisync.service.AuthService;
import com.health.medisync.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import java.util.Map;
import java.io.IOException;

@RestController
@RequestMapping({"/api/auth", "/auth"})
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final FirebaseStorageService firebaseStorageService;

    public AuthController(AuthenticationManager authenticationManager, JwtUtils jwtUtils,
                          UserRepository userRepository, DoctorRepository doctorRepository,
                          PatientRepository patientRepository,
                          PasswordEncoder passwordEncoder, AuthService authService,
                          FirebaseStorageService firebaseStorageService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.firebaseStorageService = firebaseStorageService;
    }
    
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("OK - Auth Controller is reachable");
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody AuthRequest loginRequest) {
        String normalizedUsername = loginRequest.getUsername() != null ? loginRequest.getUsername().toLowerCase() : null;
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedUsername, loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Error: User not found."));
                
        String jwt = jwtUtils.generateToken(user.getId(), user.getUsername(), user.getRole());
        String role = user.getRole();
        
        return ResponseEntity.ok(new AuthResponse(jwt, role));
    }

    @PostMapping(value = "/register/doctor", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<?> registerDoctor(
            @RequestPart("userData") String userDataJson,
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        Map<String, String> request = mapper.readValue(userDataJson, Map.class);

        String username = request.get("username") != null ? request.get("username").toLowerCase() : null;
        String email = request.get("email") != null ? request.get("email").toLowerCase() : null;
        
        // Use email as username if none provided
        final String finalUsername = (username == null || username.isEmpty()) ? email : username;

        userRepository.findByUsername(finalUsername).ifPresent(existing -> {
            boolean hasProfile = doctorRepository.findByUserId(existing.getId()).isPresent();
            if (existing.isEnabled() && hasProfile) {
                throw new RuntimeException("Error: This account is already registered and verified. Please log in.");
            }
            // Delete incomplete/unverified user so registration can proceed
            doctorRepository.findByUserId(existing.getId()).ifPresent(doctorRepository::delete);
            userRepository.delete(existing);
        });

        User user = new User();
        user.setUsername(finalUsername);
        user.setPassword(passwordEncoder.encode(request.get("password")));
        user.setRole("ROLE_DOCTOR");
        
        // In the new flow, email is pre-verified via /verify-otp before registration
        boolean verified = true; // Default to enabled since email was pre-verified
        if (request.containsKey("otp")) {
            try {
                authService.verifyOtpStandalone(request.get("email"), request.get("otp"));
                verified = true;
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired verification code."));
            }
        }
        
        // Manual verification flow: Doctor counts as 'email verified' but not 'admin approved'
        // We set enabled to false so they cannot login until the admin approves them
        user.setEnabled(false); 
        userRepository.save(user);

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        doctor.setApproved(false); // Must be approved by admin
        doctor.setName(request.get("name"));
        doctor.setEmail(email);
        doctor.setGender(request.get("gender"));
        doctor.setDateOfBirth(request.get("dateOfBirth"));
        doctor.setPhone(request.get("phone"));
        doctor.setAlternatePhone(request.get("alternatePhone"));
        doctor.setSpecialization(request.get("specialization"));
        doctor.setMedicalDegree(request.get("medicalDegree"));
        doctor.setAdditionalCertifications(request.get("additionalCertifications"));
        doctor.setCollege(request.get("college"));
        doctor.setMedicalLicenseNumber(request.get("medicalLicenseNumber"));
        doctor.setHospital(request.get("hospital"));
        doctor.setConsultationFee(request.get("consultationFee"));
        doctor.setWorkingDays(request.get("workingDays"));
        doctor.setConsultationTimings(request.get("consultationTimings"));
        if (request.get("yearsOfExperience") != null && !request.get("yearsOfExperience").isEmpty()) {
            try { doctor.setYearsOfExperience(Integer.parseInt(request.get("yearsOfExperience"))); }
            catch (NumberFormatException ignored) {}
        }
        if (request.get("onlineConsultation") != null) {
            doctor.setOnlineConsultation(Boolean.parseBoolean(request.get("onlineConsultation")));
        }
        if (request.get("age") != null && !request.get("age").isEmpty()) {
            try { doctor.setAge(Integer.parseInt(request.get("age"))); }
            catch (NumberFormatException ignored) {}
        }

        if (profilePicture != null && !profilePicture.isEmpty()) {
            doctor.setProfilePicture(profilePicture.getBytes());
            try {
                String photoUrl = firebaseStorageService.uploadFile(profilePicture, "doctors");
                if (photoUrl != null) doctor.setProfilePictureUrl(photoUrl);
            } catch (Exception e) {
                System.err.println("WARNING: Firebase upload failed during doctor registration: " + e.getMessage());
            }
        }

        doctorRepository.save(doctor);

        return ResponseEntity.ok(Map.of("message", "Doctor registered and verified successfully!"));
    }

    @PostMapping(value = "/register/patient", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<?> registerPatient(
            @RequestPart("userData") String userDataJson,
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture) throws IOException {

        ObjectMapper mapper = new ObjectMapper();
        Map<String, String> request = mapper.readValue(userDataJson, Map.class);

        String username = request.get("username") != null ? request.get("username").toLowerCase() : null;
        String email = request.get("email") != null ? request.get("email").toLowerCase() : null;
        
        // Use email as username if none provided
        final String finalUsername = (username == null || username.isEmpty()) ? email : username;
        
        try {
            userRepository.findByUsername(finalUsername).ifPresent(existing -> {
                if (existing.isEnabled()) {
                    throw new RuntimeException("Error: This account is already registered and verified. Please log in.");
                }
                // Delete ghost/unverified user so registration can proceed
                patientRepository.findByUserId(existing.getId()).ifPresent(patientRepository::delete);
                userRepository.delete(existing);
            });
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }

        User user = new User();
        user.setUsername(finalUsername);
        user.setPassword(passwordEncoder.encode(request.get("password")));
        user.setRole("ROLE_PATIENT");
        
        // Check if OTP is provided for inline verification (legacy flow)
        // In the new flow, email is pre-verified via /verify-otp before registration
        boolean verified = true; // Default to enabled since email was pre-verified
        if (request.containsKey("otp")) {
            try {
                authService.verifyOtpStandalone(request.get("email"), request.get("otp"));
                verified = true;
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired verification code."));
            }
        }
        
        user.setEnabled(verified);
        userRepository.save(user);

        Patient patient = new Patient();
        patient.setUser(user);
        patient.setName(request.get("name"));
        patient.setEmail(email);
        patient.setGender(request.get("gender"));
        patient.setDateOfBirth(request.get("dateOfBirth"));
        patient.setPhone(request.get("phone"));
        patient.setAlternatePhone(request.get("alternatePhone"));
        patient.setStreet(request.get("street"));
        patient.setCity(request.get("city"));
        patient.setState(request.get("state"));
        patient.setPinCode(request.get("pinCode"));
        patient.setEmergencyContactName(request.get("emergencyContactName"));
        patient.setEmergencyContactRelationship(request.get("emergencyContactRelationship"));
        patient.setEmergencyContactPhone(request.get("emergencyContactPhone"));
        patient.setBloodGroup(request.get("bloodGroup"));
        patient.setAllergies(request.get("allergies"));
        patient.setExistingDiseases(request.get("existingDiseases"));
        patient.setCurrentMedications(request.get("currentMedications"));
        patient.setPastSurgeries(request.get("pastSurgeries"));
        
        // New Antigravity Pro Fields
        patient.setNationalId(request.get("nationalId"));
        patient.setMaritalStatus(request.get("maritalStatus"));
        patient.setOccupation(request.get("occupation"));
        patient.setAltEmergencyPhone(request.get("altEmergencyPhone"));
        patient.setHeight(request.get("height"));
        patient.setWeight(request.get("weight"));
        if (request.containsKey("hasDisability")) {
            patient.setHasDisability(Boolean.parseBoolean(request.get("hasDisability")));
        }
        patient.setDisabilityDetails(request.get("disabilityDetails"));

        // Auto-calculate age from DOB if age not directly provided
        if (request.containsKey("age") && request.get("age") != null && !request.get("age").isEmpty()) {
            try {
                patient.setAge(Integer.parseInt(request.get("age")));
            } catch (NumberFormatException e) {
                System.err.println("Invalid age format: " + request.get("age"));
            }
        }

        if (profilePicture != null && !profilePicture.isEmpty()) {
            patient.setProfilePicture(profilePicture.getBytes());
            try {
                String photoUrl = firebaseStorageService.uploadFile(profilePicture, "patients");
                if (photoUrl != null) patient.setProfilePictureUrl(photoUrl);
            } catch (Exception e) {
                System.err.println("WARNING: Firebase upload failed during patient registration: " + e.getMessage());
            }
        }

        patientRepository.save(patient);

        return ResponseEntity.ok(Map.of("message", "Patient registered and verified successfully!"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email") != null ? request.get("email").toLowerCase() : null;
            String otp = request.get("otp");
            authService.verifyOtp(email, otp);
            return ResponseEntity.ok(Map.of("message", "Email verified successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email") != null ? request.get("email").toLowerCase() : null;

            // Only block if user already exists AND is fully enabled (active account)
            userRepository.findByUsername(email).ifPresent(existingUser -> {
                if (existingUser.isEnabled()) {
                    throw new RuntimeException("This email is already registered. Please log in instead.");
                } else {
                    // Ghost/unverified account — clean it up so a fresh registration can proceed
                    System.out.println("INFO: Cleaning up unverified ghost account for: " + email);
                }
            });

            authService.generateAndSendOtp(email);
            return ResponseEntity.ok(Map.of("message", "Verification code sent to " + email));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username") != null ? request.get("username").toLowerCase() : null;
            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
            }
            String token = authService.initiatePasswordReset(username);
            return ResponseEntity.ok(Map.of(
                "message", "Password reset link has been simulated. Check backend logs.",
                "token", token // Returning token for easy testing/simulation
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            authService.resetPassword(request.get("token"), request.get("password"));
            return ResponseEntity.ok(Map.of("message", "Password has been reset successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/test-email")
    public ResponseEntity<String> testEmail(@RequestParam String to) {
        // This endpoint bypasses the auth flow to test the Brevo integration directly
        EmailService emailService = authService.getEmailService();
        String result = emailService.testEmail(to);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/admin/cleanup")
    public ResponseEntity<?> cleanupDatabase() {
        try {
            authService.clearAllData();
            return ResponseEntity.ok(Map.of("message", "All registered data has been removed successfully."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Cleanup failed: " + e.getMessage()));
        }
    }

    // ── PUBLIC Emergency Info Endpoint (no auth required — for QR scanning) ──
    @GetMapping("/emergency/{patientId}")
    public ResponseEntity<?> getEmergencyInfo(@PathVariable Long patientId) {
        return patientRepository.findById(patientId)
            .map(patient -> {
                Map<String, Object> info = new java.util.LinkedHashMap<>();
                info.put("id", patient.getId());
                info.put("name", patient.getName());
                info.put("age", patient.getAge());
                info.put("gender", patient.getGender());
                info.put("bloodGroup", patient.getBloodGroup());
                info.put("dateOfBirth", patient.getDateOfBirth());
                info.put("emergencyContactName", patient.getEmergencyContactName());
                info.put("emergencyContactRelationship", patient.getEmergencyContactRelationship());
                info.put("emergencyContactPhone", patient.getEmergencyContactPhone());
                info.put("allergies", patient.getAllergies());
                info.put("existingDiseases", patient.getExistingDiseases());
                info.put("currentMedications", patient.getCurrentMedications());
                info.put("pastSurgeries", patient.getPastSurgeries());
                info.put("medicalInfo", patient.getMedicalInfo());
                return ResponseEntity.ok(info);
            })
            .orElse(ResponseEntity.notFound().build());
    }

    // ── Profile Photo Serving Endpoints ──

    @GetMapping(value = "/doctor/photo/{id}", produces = {MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE})
    public ResponseEntity<byte[]> getDoctorPhoto(@PathVariable Long id) {
        return doctorRepository.findById(id)
            .map(doctor -> {
                if (doctor.getProfilePicture() == null) return ResponseEntity.notFound().<byte[]>build();
                return ResponseEntity.ok().body(doctor.getProfilePicture());
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping(value = "/patient/photo/{id}", produces = {MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE})
    public ResponseEntity<byte[]> getPatientPhoto(@PathVariable Long id) {
        return patientRepository.findById(id)
            .map(patient -> {
                if (patient.getProfilePicture() == null) return ResponseEntity.notFound().<byte[]>build();
                return ResponseEntity.ok().body(patient.getProfilePicture());
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
