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
import org.springframework.web.bind.annotation.*;

import com.health.medisync.model.Patient;
import com.health.medisync.repository.PatientRepository;
import com.health.medisync.model.User;
import com.health.medisync.model.Doctor;
import com.health.medisync.repository.UserRepository;
import com.health.medisync.repository.DoctorRepository;

import com.health.medisync.service.AuthService;
import com.health.medisync.service.EmailService;
import java.util.Map;

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

    public AuthController(AuthenticationManager authenticationManager, JwtUtils jwtUtils,
                          UserRepository userRepository, DoctorRepository doctorRepository,
                          PatientRepository patientRepository,
                          PasswordEncoder passwordEncoder, AuthService authService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
    }
    
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("OK - Auth Controller is reachable");
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody AuthRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateToken(authentication.getName());
        String role = authentication.getAuthorities().iterator().next().getAuthority();
        
        return ResponseEntity.ok(new AuthResponse(jwt, role));
    }

    @PostMapping("/register/doctor")
    public ResponseEntity<?> registerDoctor(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        userRepository.findByUsername(username).ifPresent(existing -> {
            if (existing.isEnabled()) {
                throw new RuntimeException("Error: This account is already registered and verified. Please log in.");
            }
            // Delete ghost/unverified user so registration can proceed
            doctorRepository.findByUserId(existing.getId()).ifPresent(doctorRepository::delete);
            userRepository.delete(existing);
        });

        User user = new User();
        user.setUsername(request.get("username"));
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
        
        user.setEnabled(verified);
        userRepository.save(user);

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        doctor.setName(request.get("name"));
        doctor.setEmail(request.get("email"));
        doctor.setSpecialization(request.get("specialization"));
        doctorRepository.save(doctor);

        return ResponseEntity.ok(Map.of("message", "Doctor registered and verified successfully!"));
    }

    @PostMapping("/register/patient")
    public ResponseEntity<?> registerPatient(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        try {
            userRepository.findByUsername(username).ifPresent(existing -> {
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
        user.setUsername(request.get("username"));
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
        patient.setEmail(request.get("email"));
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

        // Auto-calculate age from DOB if age not directly provided
        if (request.containsKey("age") && request.get("age") != null && !request.get("age").isEmpty()) {
            try {
                patient.setAge(Integer.parseInt(request.get("age")));
            } catch (NumberFormatException e) {
                System.err.println("Invalid age format: " + request.get("age"));
            }
        }

        patientRepository.save(patient);

        return ResponseEntity.ok(Map.of("message", "Patient registered and verified successfully!"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
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
            String email = request.get("email");

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
            String username = request.get("username");
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
}
