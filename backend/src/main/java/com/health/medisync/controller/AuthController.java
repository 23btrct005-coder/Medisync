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
import org.springframework.dao.DataAccessException;
import org.springframework.transaction.CannotCreateTransactionException;

import com.health.medisync.model.Patient;
import com.health.medisync.repository.PatientRepository;
import com.health.medisync.model.User;
import com.health.medisync.model.Doctor;
import com.health.medisync.repository.UserRepository;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.PasswordResetTokenRepository;
import com.health.medisync.service.AuthService;
import com.health.medisync.service.EmailService;
import com.health.medisync.service.SupabaseStorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.health.medisync.utils.GeographicalMappingUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import java.util.Map;
import java.util.List;
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
    private final SupabaseStorageService supabaseStorageService;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final com.health.medisync.repository.HospitalRepository hospitalRepository;
    private final com.health.medisync.repository.HospitalAdminRepository hospitalAdminRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public AuthController(AuthenticationManager authenticationManager, JwtUtils jwtUtils,
                          UserRepository userRepository, DoctorRepository doctorRepository,
                          PatientRepository patientRepository,
                          PasswordEncoder passwordEncoder, AuthService authService,
                          SupabaseStorageService supabaseStorageService,
                          PasswordResetTokenRepository passwordResetTokenRepository,
                          com.health.medisync.repository.HospitalRepository hospitalRepository,
                          com.health.medisync.repository.HospitalAdminRepository hospitalAdminRepository,
                          org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.supabaseStorageService = supabaseStorageService;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.hospitalRepository = hospitalRepository;
        this.hospitalAdminRepository = hospitalAdminRepository;
        this.jdbcTemplate = jdbcTemplate;
    }
    
    @GetMapping("/geography")
    public ResponseEntity<?> getGeography() {
        return ResponseEntity.ok(GeographicalMappingUtils.getGeographyData());
    }

    @GetMapping("/hospitals")
    public ResponseEntity<?> getHospitals() {
        return ResponseEntity.ok(hospitalRepository.findAll());
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("OK - Auth Controller is reachable");
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody AuthRequest loginRequest) {
        try {
            String normalizedUsername = loginRequest.getUsername() != null ? loginRequest.getUsername().toLowerCase() : null;
            System.out.println("DEBUG: Login attempt for " + normalizedUsername);

            // SMART RESOLVER: If username doesn't exist, check if it's an email
            final String effectiveUsername;
            if (normalizedUsername != null && normalizedUsername.contains("@") && userRepository.findByUsernameIgnoreCase(normalizedUsername).isEmpty()) {
                System.out.println("DEBUG: Username not found, attempting email lookup for " + normalizedUsername);
                effectiveUsername = doctorRepository.findFirstByEmail(normalizedUsername)
                    .map(d -> d.getUser() != null ? d.getUser().getUsername() : normalizedUsername)
                    .orElseGet(() -> patientRepository.findByEmail(normalizedUsername)
                        .map(p -> p.getUser() != null ? p.getUser().getUsername() : normalizedUsername)
                        .orElse(normalizedUsername));
                System.out.println("DEBUG: Resolved effective username: " + effectiveUsername);
            } else {
                effectiveUsername = normalizedUsername;
            }
            
            // SCHEMA SELF-HEAL: Ensure the approved column exists (PostgreSQL syntax)
            try {
                jdbcTemplate.execute("ALTER TABLE hospital_admins ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE");
                jdbcTemplate.execute("ALTER TABLE doctors ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE");
            } catch (Exception e) {
                System.out.println("DEBUG: Schema self-heal skipped: " + e.getMessage());
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(effectiveUsername, loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            User user = userRepository.findByUsernameIgnoreCase(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("Error: User not found."));

            // APPROVAL GATE: Post-Authentication Check
            if ("ROLE_DOCTOR".equals(user.getRole())) {
                doctorRepository.findByUserId(user.getId()).ifPresent(doctor -> {
                    if (!doctor.isApproved()) {
                        throw new org.springframework.security.authentication.DisabledException("Your professional account is pending institutional approval.");
                    }
                });
            } else if ("ROLE_HOSPITAL_ADMIN".equals(user.getRole())) {
                hospitalAdminRepository.findByUserId(user.getId()).ifPresent(admin -> {
                    if (!admin.isApproved()) {
                        throw new org.springframework.security.authentication.DisabledException("Your institutional portal access is pending global administrative approval.");
                    }
                });
            }

            String jwt = jwtUtils.generateToken(user.getId(), user.getUsername(), user.getRole());
            return ResponseEntity.ok(new AuthResponse(jwt, user.getRole(), user.isEmailVerified()));

        } catch (org.springframework.security.authentication.DisabledException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        } catch (org.springframework.security.core.AuthenticationException e) {
            System.out.println("DEBUG: Authentication failed for " + loginRequest.getUsername() + ": " + e.getMessage());
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials."));
        } catch (CannotCreateTransactionException e) {
            System.err.println("CRITICAL: Database connection pool exhausted during login: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "High traffic. Please try again in a few moments."));
        } catch (DataAccessException e) {
            System.err.println("CRITICAL: Database error during login: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Database operation failed."));
        } catch (Exception e) {
            System.err.println("CRITICAL: Internal Server Error during login for " + loginRequest.getUsername());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "A secure clinical node exception occurred: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/register/doctor", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<?> registerDoctor(
            @RequestPart("userData") String userDataJson,
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture) throws IOException {
        
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> request = mapper.readValue(userDataJson, Map.class);

        String username = request.get("username") != null ? String.valueOf(request.get("username")).toLowerCase() : null;
        String email = request.get("email") != null ? String.valueOf(request.get("email")).toLowerCase() : null;
        
        // Use email as username if none provided
        final String finalUsername = (username == null || username.isEmpty()) ? email : username;

        try {
            // Check for existing user by username/email
            userRepository.findByUsernameIgnoreCase(finalUsername).ifPresent(existing -> {
                if (existing.isEnabled()) {
                    throw new RuntimeException("Error: This account is already registered and verified. Please log in.");
                }
                
                // Protection: Don't allow overwriting a pending doctor/admin with a different role
                boolean hasAdminProfile = hospitalAdminRepository.findByUserId(existing.getId()).isPresent();
                if (hasAdminProfile) {
                    throw new RuntimeException("Error: This email is already associated with a hospital administrator account.");
                }

                // Delete unverified user and ALL linked data so registration can proceed cleanly
                passwordResetTokenRepository.deleteByUserId(existing.getId());
                doctorRepository.findByUserId(existing.getId()).ifPresent(doctorRepository::delete);
                patientRepository.findByUserId(existing.getId()).ifPresent(patientRepository::delete);
                hospitalAdminRepository.findByUserId(existing.getId()).ifPresent(hospitalAdminRepository::delete);
                userRepository.delete(existing);
            });

            // Check for existing doctor by email directly (if username was different)
            if (email != null) {
                doctorRepository.findFirstByEmail(email).ifPresent(existingDoctor -> {
                    User u = existingDoctor.getUser();
                    if (u != null && u.isEnabled()) {
                        throw new RuntimeException("Error: A physician with this email is already registered.");
                    }
                    // Clean up if unverified
                    if (u != null) {
                        passwordResetTokenRepository.deleteByUserId(u.getId());
                        doctorRepository.delete(existingDoctor);
                        patientRepository.findByUserId(u.getId()).ifPresent(patientRepository::delete);
                        hospitalAdminRepository.findByUserId(u.getId()).ifPresent(hospitalAdminRepository::delete);
                        userRepository.delete(u);
                    } else {
                        doctorRepository.delete(existingDoctor);
                    }
                });
            }

            // Check for existing doctor by Medical License Number
            String medicalLicenseNumber = request.get("medicalLicenseNumber") != null ? String.valueOf(request.get("medicalLicenseNumber")).trim() : null;
            if (medicalLicenseNumber != null && !medicalLicenseNumber.isEmpty()) {
                doctorRepository.findFirstByMedicalLicenseNumber(medicalLicenseNumber).ifPresent(existingDoctor -> {
                    User u = existingDoctor.getUser();
                    if (u != null && u.isEnabled()) {
                        throw new RuntimeException("Error: A physician with this medical license number is already registered.");
                    }
                    // Clean up if unverified
                    if (u != null) {
                        passwordResetTokenRepository.deleteByUserId(u.getId());
                        doctorRepository.delete(existingDoctor);
                        patientRepository.findByUserId(u.getId()).ifPresent(patientRepository::delete);
                        hospitalAdminRepository.findByUserId(u.getId()).ifPresent(hospitalAdminRepository::delete);
                        userRepository.delete(u);
                    } else {
                        doctorRepository.delete(existingDoctor);
                    }
                });
            }
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }

        User user = new User();
        user.setUsername(finalUsername);
        user.setPassword(passwordEncoder.encode(String.valueOf(request.get("password"))));
        user.setRole("ROLE_DOCTOR");
        
        // In the new flow, email is pre-verified via /verify-otp before registration
        boolean verified = true; // Default to enabled since email was pre-verified
        if (request.containsKey("otp")) {
            try {
                authService.verifyOtpStandalone(String.valueOf(request.get("email")), String.valueOf(request.get("otp")));
                verified = true;
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired verification code."));
            }
        }
        
        // Professional accounts are enabled by default since email is verified via OTP
        // Their 'approved' status in the Doctor entity controls institutional access
        user.setEnabled(true); 
        user.setEmailVerified(request.containsKey("otp")); 
        user = userRepository.save(user);

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_HOSPITAL_ADMIN"));
        doctor.setApproved(isAdmin); // Must be approved by admin, unless created by one
        doctor.setName(request.get("name") != null ? String.valueOf(request.get("name")) : null);
        doctor.setEmail(email);
        doctor.setGender(request.get("gender") != null ? String.valueOf(request.get("gender")) : null);
        doctor.setDateOfBirth(request.get("dateOfBirth") != null ? String.valueOf(request.get("dateOfBirth")) : null);
        doctor.setPhone(request.get("phone") != null ? String.valueOf(request.get("phone")) : null);
        doctor.setAlternatePhone(request.get("alternatePhone") != null ? String.valueOf(request.get("alternatePhone")) : null);
        doctor.setSpecialization(request.get("specialization") != null ? String.valueOf(request.get("specialization")) : null);
        doctor.setMedicalDegree(request.get("medicalDegree") != null ? String.valueOf(request.get("medicalDegree")) : null);
        doctor.setAdditionalCertifications(request.get("additionalCertifications") != null ? String.valueOf(request.get("additionalCertifications")) : null);
        doctor.setCollege(request.get("college") != null ? String.valueOf(request.get("college")) : null);
        doctor.setMedicalLicenseNumber(request.get("medicalLicenseNumber") != null ? String.valueOf(request.get("medicalLicenseNumber")) : null);
        
        // Institutional Linkage
        String hospitalIdStr = request.get("hospital") != null ? String.valueOf(request.get("hospital")) : null;
        if (hospitalIdStr != null && !hospitalIdStr.isEmpty() && !hospitalIdStr.equals("other")) {
            try {
                Long hospitalId = Long.parseLong(hospitalIdStr);
                hospitalRepository.findById(hospitalId).ifPresent(doctor::setHospitalEntity);
            } catch (NumberFormatException ignored) {}
        }
        doctor.setHospital(request.get("hospitalName") != null ? String.valueOf(request.get("hospitalName")) : hospitalIdStr);
        
        doctor.setConsultationFee(request.get("consultationFee") != null ? String.valueOf(request.get("consultationFee")) : null);
        doctor.setWorkingDays(request.get("workingDays") != null ? String.valueOf(request.get("workingDays")) : null);
        doctor.setConsultationTimings(request.get("consultationTimings") != null ? String.valueOf(request.get("consultationTimings")) : null);
        doctor.setRazorpayAccountId(request.get("razorpayAccountId") != null ? String.valueOf(request.get("razorpayAccountId")) : null);
        doctor.setUpiId(request.get("upiId") != null ? String.valueOf(request.get("upiId")) : null);
        
        if (request.get("yearsOfExperience") != null && !String.valueOf(request.get("yearsOfExperience")).isEmpty()) {
            try { doctor.setYearsOfExperience(Integer.parseInt(String.valueOf(request.get("yearsOfExperience")))); }
            catch (NumberFormatException ignored) {}
        }
        if (request.get("onlineConsultation") != null) {
            doctor.setOnlineConsultation(Boolean.parseBoolean(String.valueOf(request.get("onlineConsultation"))));
        }
        if (request.get("age") != null && !String.valueOf(request.get("age")).isEmpty()) {
            try { doctor.setAge(Integer.parseInt(String.valueOf(request.get("age")))); }
            catch (NumberFormatException ignored) {}
        }

        if (profilePicture != null && !profilePicture.isEmpty()) {
            String photoUrl = supabaseStorageService.uploadFile(profilePicture);
            if (photoUrl != null) doctor.setProfilePictureUrl(photoUrl);
        }

        System.out.println("DEBUG: Saving doctor profile for user " + finalUsername + " linked to hospital " + (doctor.getHospitalEntity() != null ? doctor.getHospitalEntity().getName() : "NONE"));
        doctorRepository.save(doctor);
        System.out.println("DEBUG: Doctor profile saved successfully for " + finalUsername);

        return ResponseEntity.ok(Map.of("message", "Doctor registered successfully! Please log in and verify your email."));
    }

    @PostMapping(value = "/register/patient", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<?> registerPatient(
            @RequestPart("userData") String userDataJson,
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture) throws IOException {

        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> request = mapper.readValue(userDataJson, Map.class);

        String username = request.get("username") != null ? String.valueOf(request.get("username")).toLowerCase() : null;
        String email = request.get("email") != null ? String.valueOf(request.get("email")).toLowerCase() : null;
        
        // Use email as username if none provided
        final String finalUsername = (username == null || username.isEmpty()) ? email : username;
        
        try {
            userRepository.findByUsernameIgnoreCase(finalUsername).ifPresent(existing -> {
                if (existing.isEnabled()) {
                    throw new RuntimeException("Error: This account is already registered and verified. Please log in.");
                }

                // Protection: Critical. Do NOT delete pending doctors or admins during patient registration
                boolean hasDoctorProfile = doctorRepository.findByUserId(existing.getId()).isPresent();
                boolean hasAdminProfile = hospitalAdminRepository.findByUserId(existing.getId()).isPresent();
                
                if (hasDoctorProfile || hasAdminProfile) {
                    throw new RuntimeException("Error: This email is registered for a professional account awaiting verification. Please use a different email or log in as a professional.");
                }

                // Delete ghost/unverified patient and linked data
                passwordResetTokenRepository.deleteByUserId(existing.getId());
                doctorRepository.findByUserId(existing.getId()).ifPresent(doctorRepository::delete);
                patientRepository.findByUserId(existing.getId()).ifPresent(patientRepository::delete);
                hospitalAdminRepository.findByUserId(existing.getId()).ifPresent(hospitalAdminRepository::delete);
                userRepository.delete(existing);
            });
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }

        User user = new User();
        user.setUsername(finalUsername);
        user.setPassword(passwordEncoder.encode(String.valueOf(request.get("password"))));
        user.setRole("ROLE_PATIENT");
        
        // Check if OTP is provided for inline verification (legacy flow)
        // In the new flow, email is pre-verified via /verify-otp before registration
        boolean verified = true; // Default to enabled since email was pre-verified
        if (request.containsKey("otp")) {
            try {
                authService.verifyOtpStandalone(String.valueOf(request.get("email")), String.valueOf(request.get("otp")));
                verified = true;
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired verification code."));
            }
        }
        
        user.setEnabled(verified);
        user = userRepository.save(user);

        Patient patient = new Patient();
        patient.setUser(user);
        patient.setName(request.get("name") != null ? String.valueOf(request.get("name")) : null);
        patient.setEmail(email);
        patient.setGender(request.get("gender") != null ? String.valueOf(request.get("gender")) : null);
        patient.setDateOfBirth(request.get("dateOfBirth") != null ? String.valueOf(request.get("dateOfBirth")) : null);
        patient.setPhone(request.get("phone") != null ? String.valueOf(request.get("phone")) : null);
        patient.setAlternatePhone(request.get("alternatePhone") != null ? String.valueOf(request.get("alternatePhone")) : null);
        patient.setStreet(request.get("street") != null ? String.valueOf(request.get("street")) : null);
        patient.setCity(request.get("city") != null ? String.valueOf(request.get("city")) : null);
        patient.setState(request.get("state") != null ? String.valueOf(request.get("state")) : null);
        patient.setPinCode(request.get("pinCode") != null ? String.valueOf(request.get("pinCode")) : null);
        patient.setEmergencyContactName(request.get("emergencyContactName") != null ? String.valueOf(request.get("emergencyContactName")) : null);
        patient.setEmergencyContactRelationship(request.get("emergencyContactRelationship") != null ? String.valueOf(request.get("emergencyContactRelationship")) : null);
        patient.setEmergencyContactPhone(request.get("emergencyContactPhone") != null ? String.valueOf(request.get("emergencyContactPhone")) : null);
        patient.setBloodGroup(request.get("bloodGroup") != null ? String.valueOf(request.get("bloodGroup")) : null);
        patient.setAllergies(request.get("allergies") != null ? String.valueOf(request.get("allergies")) : null);
        patient.setExistingDiseases(request.get("existingDiseases") != null ? String.valueOf(request.get("existingDiseases")) : null);
        patient.setCurrentMedications(request.get("currentMedications") != null ? String.valueOf(request.get("currentMedications")) : null);
        patient.setPastSurgeries(request.get("pastSurgeries") != null ? String.valueOf(request.get("pastSurgeries")) : null);
        
        // New Antigravity Pro Fields
        patient.setNationalId(request.get("nationalId") != null ? String.valueOf(request.get("nationalId")) : null);
        patient.setMaritalStatus(request.get("maritalStatus") != null ? String.valueOf(request.get("maritalStatus")) : null);
        patient.setOccupation(request.get("occupation") != null ? String.valueOf(request.get("occupation")) : null);
        patient.setAltEmergencyPhone(request.get("altEmergencyPhone") != null ? String.valueOf(request.get("altEmergencyPhone")) : null);
        patient.setHeight(request.get("height") != null ? String.valueOf(request.get("height")) : null);
        patient.setWeight(request.get("weight") != null ? String.valueOf(request.get("weight")) : null);
        if (request.containsKey("hasDisability")) {
            patient.setHasDisability(Boolean.parseBoolean(String.valueOf(request.get("hasDisability"))));
        }
        patient.setDisabilityDetails(request.get("disabilityDetails") != null ? String.valueOf(request.get("disabilityDetails")) : null);
        patient.setDistrict(request.get("district") != null ? String.valueOf(request.get("district")) : null);

        // Auto-calculate age from DOB if age not directly provided
        if (request.containsKey("age") && request.get("age") != null && !String.valueOf(request.get("age")).isEmpty()) {
            try {
                patient.setAge(Integer.parseInt(String.valueOf(request.get("age"))));
            } catch (NumberFormatException e) {
                System.err.println("Invalid age format: " + request.get("age"));
            }
        }

        if (profilePicture != null && !profilePicture.isEmpty()) {
            String photoUrl = supabaseStorageService.uploadFile(profilePicture);
            if (photoUrl != null) patient.setProfilePictureUrl(photoUrl);
        }

        patient = patientRepository.save(patient);
        
        // Post-save: Assign the official ST-DT-XXXX ID based on database primary key and geographical data
        if (patient.getPatientId() == null || patient.getPatientId().startsWith("MS-TEMP")) {
            String st = GeographicalMappingUtils.getStateCode(patient.getState());
            String dt = GeographicalMappingUtils.getDistrictCode(patient.getState(), patient.getDistrict(), patient.getCity());
            patient.setPatientId(st + "-" + dt + "-" + String.format("%04d", patient.getId()));
            patientRepository.save(patient);
        }

        user.setEmailVerified(true); // Patients verify via OTP before registration
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Patient registered and verified successfully!"));
    }

    @PostMapping(value = "/register/hospital-admin", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public ResponseEntity<?> registerHospitalAdmin(
            @RequestPart("userData") String userDataJson,
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture,
            @RequestPart(value = "hospitalLogo", required = false) MultipartFile hospitalLogo) throws IOException {

        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> request = mapper.readValue(userDataJson, Map.class);
        String username = request.get("username") != null ? String.valueOf(request.get("username")).toLowerCase() : String.valueOf(request.get("email")).toLowerCase();
        
        // Cleanup existing ghost account if any
        try {
            userRepository.findByUsernameIgnoreCase(username).ifPresent(existing -> {
                if (existing.isEnabled()) {
                    throw new RuntimeException("Error: This account is already registered. Please log in.");
                }
                
                // Protection: Don't overwrite pending doctors
                boolean hasDoctorProfile = doctorRepository.findByUserId(existing.getId()).isPresent();
                if (hasDoctorProfile) {
                    throw new RuntimeException("Error: This email is reserved for a physician account awaiting approval.");
                }

                passwordResetTokenRepository.deleteByUserId(existing.getId());
                doctorRepository.findByUserId(existing.getId()).ifPresent(doctorRepository::delete);
                patientRepository.findByUserId(existing.getId()).ifPresent(patientRepository::delete);
                hospitalAdminRepository.findByUserId(existing.getId()).ifPresent(hospitalAdminRepository::delete);
                userRepository.delete(existing);
            });
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }

        // 1. Create User
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(String.valueOf(request.get("password"))));
        user.setRole("ROLE_HOSPITAL_ADMIN");
        user.setEnabled(true); // Assuming email pre-verified
        user = userRepository.save(user);

        // 2. Create or Find Hospital
        String hospitalName = request.get("hospitalName") != null ? String.valueOf(request.get("hospitalName")) : null;
        String licenseCode = request.get("licenseCode") != null ? String.valueOf(request.get("licenseCode")) : null;
        
        com.health.medisync.model.Hospital hospital = hospitalRepository.findByLicenseCode(licenseCode)
            .orElseGet(() -> new com.health.medisync.model.Hospital());

        hospital.setName(hospitalName);
        hospital.setLicenseCode(licenseCode);
        hospital.setState(request.get("state") != null ? String.valueOf(request.get("state")) : null);
        hospital.setCity(request.get("city") != null ? String.valueOf(request.get("city")) : null);
        hospital.setStreet(request.get("street") != null ? String.valueOf(request.get("street")) : null);
        hospital.setPinCode(request.get("pinCode") != null ? String.valueOf(request.get("pinCode")) : null);
        hospital.setPhone(request.get("phone") != null ? String.valueOf(request.get("phone")) : null);
        hospital.setContactEmail(request.get("email") != null ? String.valueOf(request.get("email")) : null);
        hospital.setHospitalType(request.get("hospitalType") != null ? String.valueOf(request.get("hospitalType")) : null);
        hospital.setWebsite(request.get("website") != null ? String.valueOf(request.get("website")) : null);
        // Compose a human-readable location string
        String city = request.get("city") != null ? String.valueOf(request.get("city")) : "";
        String state = request.get("state") != null ? String.valueOf(request.get("state")) : "";
        hospital.setLocation((city + ", " + state).trim().replaceAll("^,|,$", "").trim());
        
        // Handle Logo
        if (hospitalLogo != null && !hospitalLogo.isEmpty()) {
            try {
                String logoUrl = supabaseStorageService.uploadFile(hospitalLogo);
                if (logoUrl != null) hospital.setLogoUrl(logoUrl);
            } catch (Exception e) {
                System.err.println("Failed to upload hospital logo: " + e.getMessage());
            }
        }
        
        hospital = hospitalRepository.save(hospital);

        // 3. Create Admin Profile
        com.health.medisync.model.HospitalAdmin admin = new com.health.medisync.model.HospitalAdmin();
        admin.setUser(user);
        admin.setHospital(hospital);
        admin.setName(request.get("name") != null ? String.valueOf(request.get("name")) : null);
        admin.setPosition(request.get("position") != null ? String.valueOf(request.get("position")) : "Administrator");

        if (profilePicture != null && !profilePicture.isEmpty()) {
            try {
                String adminPhotoUrl = supabaseStorageService.uploadFile(profilePicture);
                if (adminPhotoUrl != null) admin.setProfilePictureUrl(adminPhotoUrl);
            } catch (Exception e) {
                System.err.println("Failed to upload admin photo: " + e.getMessage());
            }
        }

        hospitalAdminRepository.save(admin);

        return ResponseEntity.ok(Map.of("message", "Hospital Administration registered successfully! Your account is now pending global administrative approval."));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email") != null ? request.get("email").toLowerCase() : null;
            String otp = request.get("otp");
            authService.verifyOtpStandalone(email, otp);
            
            userRepository.findByUsernameIgnoreCase(email).ifPresent(user -> {
                user.setEmailVerified(true);
                userRepository.save(user);
            });
            
            return ResponseEntity.ok(Map.of("message", "Institutional email verified successfully!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
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

    @PostMapping("/admin/backfill-ids")
    public ResponseEntity<?> backfillPatientIds() {
        try {
            List<Patient> patients = patientRepository.findAll();
            int count = 0;
            for (Patient p : patients) {
                if (p.getPatientId() == null || p.getPatientId().startsWith("MS-TEMP") || p.getPatientId().startsWith("MS-") || p.getPatientId().contains("-00-")) {
                    String st = GeographicalMappingUtils.getStateCode(p.getState());
                    String dt = GeographicalMappingUtils.getDistrictCode(p.getState(), p.getDistrict(), p.getCity());
                    p.setPatientId(st + "-" + dt + "-" + String.format("%04d", p.getId()));
                    patientRepository.save(p);
                    count++;
                }
            }
            return ResponseEntity.ok(Map.of("message", "Successfully backfilled " + count + " patient IDs."));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Backfill failed: " + e.getMessage()));
        }
    }

    // ── PUBLIC Emergency Info Endpoint (no auth required — for QR scanning) ──
    @GetMapping("/emergency/{patientId}")
    public ResponseEntity<?> getEmergencyInfo(@PathVariable Long patientId) {
        return patientRepository.findById(patientId)
            .map(this::buildEmergencyResponse)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/emergency/shortcode/{code}")
    public ResponseEntity<?> getEmergencyByShortCode(@PathVariable String code) {
        return patientRepository.findByPatientId(code.toUpperCase().trim())
            .map(this::buildEmergencyResponse)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> buildEmergencyResponse(Patient patient) {
        Map<String, Object> info = new java.util.LinkedHashMap<>();
        info.put("id", patient.getId());
        info.put("patientId", patient.getPatientId()); // The MS-XXXX Short Code
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
        info.put("height", patient.getHeight());
        info.put("weight", patient.getWeight());
        return info;
    }

    // ── Profile Photo Serving Endpoints ──

    @GetMapping(value = "/doctor/photo/{id}")
    public ResponseEntity<?> getDoctorPhoto(@PathVariable Long id) {
        // Smart Resolver: Try findById first, fall back to findByUserId
        com.health.medisync.model.Doctor doctor = doctorRepository.findById(id)
            .filter(d -> d.getProfilePictureUrl() != null && !d.getProfilePictureUrl().isEmpty())
            .orElseGet(() -> doctorRepository.findByUserId(id).orElseGet(() -> doctorRepository.findById(id).orElse(null)));

        if (doctor != null && doctor.getProfilePictureUrl() != null && !doctor.getProfilePictureUrl().isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                                 .location(java.net.URI.create(doctor.getProfilePictureUrl()))
                                 .build();
        }

        // Fallback to DiceBear
        String diceBearUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + 
                           (doctor != null && doctor.getUser() != null ? doctor.getUser().getUsername() : id.toString());
        return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                             .location(java.net.URI.create(diceBearUrl))
                             .build();
    }

    @GetMapping(value = "/patient/photo/{id}")
    public ResponseEntity<?> getPatientPhoto(@PathVariable Long id) {
        // Smart Resolver: Try findById first, fall back to findByUserId
        com.health.medisync.model.Patient patient = patientRepository.findById(id)
            .filter(p -> p.getProfilePictureUrl() != null && !p.getProfilePictureUrl().isEmpty())
            .orElseGet(() -> patientRepository.findByUserId(id).orElseGet(() -> patientRepository.findById(id).orElse(null)));

        if (patient != null && patient.getProfilePictureUrl() != null && !patient.getProfilePictureUrl().isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                                 .location(java.net.URI.create(patient.getProfilePictureUrl()))
                                 .build();
        }
 
        // Fallback to DiceBear if missing
        String diceBearUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + 
                           (patient != null && patient.getUser() != null ? patient.getUser().getUsername() : id.toString());
        return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                             .location(java.net.URI.create(diceBearUrl))
                             .build();
    }
}
