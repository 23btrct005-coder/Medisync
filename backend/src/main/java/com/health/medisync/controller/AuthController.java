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
import org.springframework.security.access.prepost.PreAuthorize;


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
import com.health.medisync.service.DatabaseSchemaService;
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
    private final DatabaseSchemaService databaseSchemaService;

    public AuthController(AuthenticationManager authenticationManager, JwtUtils jwtUtils,
                          UserRepository userRepository, DoctorRepository doctorRepository,
                          PatientRepository patientRepository,
                          PasswordEncoder passwordEncoder, AuthService authService,
                          SupabaseStorageService supabaseStorageService,
                          PasswordResetTokenRepository passwordResetTokenRepository,
                          com.health.medisync.repository.HospitalRepository hospitalRepository,
                          com.health.medisync.repository.HospitalAdminRepository hospitalAdminRepository,
                          org.springframework.jdbc.core.JdbcTemplate jdbcTemplate,
                          DatabaseSchemaService databaseSchemaService) {
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
        this.databaseSchemaService = databaseSchemaService;
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
            String normalizedUsername = loginRequest.getUsername() != null ? loginRequest.getUsername().trim().toLowerCase() : null;
            String rawPassword = loginRequest.getPassword() != null ? loginRequest.getPassword().trim() : null;
            
            System.out.println("DEBUG: Login attempt for " + normalizedUsername);

            // SMART RESOLVER: Support Login via Username, Email, Doctor ID (Employee ID/License), or Patient ID
            final String effectiveUsername;
            var userOpt = userRepository.findByUsernameIgnoreCase(normalizedUsername);
            
            if (userOpt.isPresent()) {
                effectiveUsername = userOpt.get().getUsername();
            } else {
                System.out.println("DEBUG: Direct username lookup failed, attempting multi-channel resolution for: " + normalizedUsername);
                
                // 1. Try Email Lookup
                String resolvedByEmail = doctorRepository.findFirstByEmail(normalizedUsername)
                    .map(d -> d.getUser() != null ? d.getUser().getUsername() : null)
                    .orElseGet(() -> patientRepository.findByEmail(normalizedUsername)
                        .map(p -> p.getUser() != null ? p.getUser().getUsername() : null)
                        .orElse(null));

                if (resolvedByEmail != null) {
                    effectiveUsername = resolvedByEmail;
                    System.out.println("DEBUG: Resolved by Email -> " + effectiveUsername);
                } else {
                    // 2. Try Doctor ID (Employee ID or Medical License)
                    String resolvedByDoctorId = doctorRepository.findFirstByEmployeeId(normalizedUsername)
                        .map(d -> d.getUser() != null ? d.getUser().getUsername() : null)
                        .orElseGet(() -> doctorRepository.findFirstByMedicalLicenseNumber(normalizedUsername)
                            .map(d -> d.getUser() != null ? d.getUser().getUsername() : null)
                            .orElse(null));
                    
                    if (resolvedByDoctorId != null) {
                        effectiveUsername = resolvedByDoctorId;
                        System.out.println("DEBUG: Resolved by Doctor ID -> " + effectiveUsername);
                    } else {
                        // 3. Try Patient ID
                        String resolvedByPatientId = patientRepository.findByPatientId(normalizedUsername)
                            .map(p -> p.getUser() != null ? p.getUser().getUsername() : null)
                            .orElse(null);
                        
                        if (resolvedByPatientId != null) {
                            effectiveUsername = resolvedByPatientId;
                            System.out.println("DEBUG: Resolved by Patient ID -> " + effectiveUsername);
                        } else {
                            // Fallback to original input
                            effectiveUsername = normalizedUsername;
                        }
                    }
                }
            }
            
            // SCHEMA SELF-HEAL: Centralized check via DatabaseSchemaService
            databaseSchemaService.selfHealSchema();

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(effectiveUsername, rawPassword));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            User user = userRepository.findByUsernameIgnoreCase(authentication.getName())
                    .orElseThrow(() -> new RuntimeException("Error: User not found."));

            // APPROVAL & AUTO-VERIFY GATE: Post-Authentication Check
            if ("ROLE_DOCTOR".equals(user.getRole())) {
                doctorRepository.findByUserId(user.getId()).ifPresent(doctor -> {
                    if (!doctor.isApproved()) {
                        throw new org.springframework.security.authentication.DisabledException("Your professional account is pending institutional approval.");
                    }
                });
                // Mandatory Identity Verification Check
                if (!user.isEmailVerified()) {
                    System.out.println("DEBUG: Unverified physician access detected. Triggering institutional OTP dispatch to " + user.getUsername());
                    try {
                        authService.generateAndSendOtp(user.getUsername());
                    } catch (Exception e) {
                        System.err.println("CRITICAL: Failed to dispatch automatic verification OTP: " + e.getMessage());
                    }
                }
            } else if ("ROLE_HOSPITAL_ADMIN".equals(user.getRole())) {
                // Institutional Identity Verification Gate
                if (!user.isEmailVerified()) {
                    System.out.println("DEBUG: Unverified hospital admin detected. Dispatching security OTP to " + user.getUsername());
                    try {
                        authService.generateAndSendOtp(user.getUsername());
                    } catch (Exception e) {
                        System.err.println("CRITICAL: Failed to dispatch admin verification OTP: " + e.getMessage());
                    }
                }
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
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            System.out.println("DEBUG: Bad credentials for " + loginRequest.getUsername());
            return ResponseEntity.status(401).body(Map.of("message", "Invalid credentials. Please check your password and try again."));
        } catch (org.springframework.security.core.AuthenticationException e) {
            System.out.println("DEBUG: Authentication failed for " + loginRequest.getUsername() + ": " + e.getMessage());
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Authentication failed."));
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
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture,
            @RequestPart(value = "licenseDocument", required = false) MultipartFile licenseDocument) throws IOException {
        
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
        
        // Security Policy: Institutional (onboarded) staff must verify their Gmail on 1st login.
        // Self-registered doctors are pre-verified via OTP in Step 1.
        String hospitalIdStr = request.get("hospital") != null ? String.valueOf(request.get("hospital")) : null;
        
        // Detection: If called by an authenticated Hospital Admin, it's definitely institutional onboarding
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isCalledByAdmin = auth != null && auth.isAuthenticated() && 
                                 auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_HOSPITAL_ADMIN"));
        
        boolean isInstitutional = isCalledByAdmin || (hospitalIdStr != null && !hospitalIdStr.isEmpty() && !hospitalIdStr.equals("other"));
        
        // Validation for self-registered doctors
        if (!isInstitutional && request.containsKey("otp")) {
            try {
                authService.verifyOtpStandalone(email, String.valueOf(request.get("otp")));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired verification code."));
            }
        }

        user.setEnabled(true); 
        user.setEmailVerified(!isInstitutional); 
        System.out.println("DEBUG: RegisterDoctor - isInstitutional: " + isInstitutional + ", emailVerified: " + user.isEmailVerified() + ", hospital: " + hospitalIdStr);
        user = userRepository.save(user);

        Doctor doctor = new Doctor();
        doctor.setUser(user);
        
        doctor.setApproved(true); // Self-registered doctors are approved immediately
        doctor.setName(request.get("name") != null ? String.valueOf(request.get("name")) : null);
        doctor.setEmail(email);
        doctor.setGender(request.get("gender") != null ? String.valueOf(request.get("gender")) : null);
        doctor.setDateOfBirth(request.get("dateOfBirth") != null ? String.valueOf(request.get("dateOfBirth")) : null);
        if (request.get("age") != null && !String.valueOf(request.get("age")).isEmpty()) {
            try { doctor.setAge(Integer.parseInt(String.valueOf(request.get("age")))); }
            catch (NumberFormatException ignored) {}
        }
        doctor.setPhone(request.get("phone") != null ? String.valueOf(request.get("phone")) : null);
        doctor.setAlternatePhone(request.get("alternatePhone") != null ? String.valueOf(request.get("alternatePhone")) : null);
        doctor.setSpecialization(request.get("specialization") != null ? String.valueOf(request.get("specialization")) : null);
        doctor.setMedicalDegree(request.get("medicalDegree") != null ? String.valueOf(request.get("medicalDegree")) : null);
        doctor.setAdditionalCertifications(request.get("additionalCertifications") != null ? String.valueOf(request.get("additionalCertifications")) : null);
        doctor.setCollege(request.get("college") != null ? String.valueOf(request.get("college")) : null);
        
        // Clinical Depth
        doctor.setSubSpecialties(request.get("subSpecialties") != null ? String.valueOf(request.get("subSpecialties")) : null);
        doctor.setProceduresHandled(request.get("proceduresHandled") != null ? String.valueOf(request.get("proceduresHandled")) : null);
        doctor.setTreatmentFocus(request.get("treatmentFocus") != null ? String.valueOf(request.get("treatmentFocus")) : null);
        doctor.setLanguagesSpoken(request.get("languagesSpoken") != null ? String.valueOf(request.get("languagesSpoken")) : null);
        doctor.setPublications(request.get("publications") != null ? String.valueOf(request.get("publications")) : null);

        // License & Verification
        doctor.setMedicalLicenseNumber(request.get("medicalLicenseNumber") != null ? String.valueOf(request.get("medicalLicenseNumber")) : null);
        doctor.setMedicalCouncil(request.get("medicalCouncil") != null ? String.valueOf(request.get("medicalCouncil")) : null);
        doctor.setLicenseExpiryDate(request.get("licenseExpiryDate") != null ? String.valueOf(request.get("licenseExpiryDate")) : null);
        if (request.get("registrationYear") != null && !String.valueOf(request.get("registrationYear")).isEmpty()) {
            try { doctor.setRegistrationYear(Integer.parseInt(String.valueOf(request.get("registrationYear")))); }
            catch (NumberFormatException ignored) {}
        }
        
        // Institutional Linkage
        if (hospitalIdStr != null && !hospitalIdStr.isEmpty() && !hospitalIdStr.equals("other")) {
            try {
                Long hospitalId = Long.parseLong(hospitalIdStr);
                hospitalRepository.findById(hospitalId).ifPresent(doctor::setHospitalEntity);
            } catch (NumberFormatException ignored) {}
        }
        doctor.setHospital(request.get("hospitalName") != null ? String.valueOf(request.get("hospitalName")) : hospitalIdStr);
        if (hospitalIdStr != null && !hospitalIdStr.isEmpty()) {
            doctor.setInstitutional(true);
        }
        
        if (request.get("yearsOfExperience") != null && !String.valueOf(request.get("yearsOfExperience")).isEmpty()) {
            try { doctor.setYearsOfExperience(Integer.parseInt(String.valueOf(request.get("yearsOfExperience")))); }
            catch (NumberFormatException ignored) {}
        }
        
        doctor.setEmployeeId(request.get("employeeId") != null ? String.valueOf(request.get("employeeId")) : null);
        doctor.setOpdRoomNumber(request.get("opdRoomNumber") != null ? String.valueOf(request.get("opdRoomNumber")) : null);
        doctor.setSalary(request.get("salary") != null ? String.valueOf(request.get("salary")) : null);
        doctor.setContractType(request.get("contractType") != null ? String.valueOf(request.get("contractType")) : "PERMANENT");
        
        if (request.get("revenueSharePercentage") != null && !String.valueOf(request.get("revenueSharePercentage")).isEmpty()) {
            try { doctor.setRevenueSharePercentage(Double.parseDouble(String.valueOf(request.get("revenueSharePercentage")))); }
            catch (NumberFormatException ignored) {}
        }

        // Permissions
        if (request.containsKey("canPrescribe")) doctor.setCanPrescribe(Boolean.parseBoolean(String.valueOf(request.get("canPrescribe"))));
        if (request.containsKey("canEditPatientData")) doctor.setCanEditPatientData(Boolean.parseBoolean(String.valueOf(request.get("canEditPatientData"))));
        if (request.containsKey("canAccessReports")) doctor.setCanAccessReports(Boolean.parseBoolean(String.valueOf(request.get("canAccessReports"))));
        if (request.containsKey("canManageAppointments")) doctor.setCanManageAppointments(Boolean.parseBoolean(String.valueOf(request.get("canManageAppointments"))));

        doctor.setConsultationFee(request.get("consultationFee") != null ? String.valueOf(request.get("consultationFee")) : null);
        if (request.get("onlineConsultationFee") != null && !String.valueOf(request.get("onlineConsultationFee")).isEmpty()) {
            try { doctor.setOnlineConsultationFee(Double.parseDouble(String.valueOf(request.get("onlineConsultationFee")))); }
            catch (NumberFormatException ignored) {}
        }
        if (request.get("offlineConsultationFee") != null && !String.valueOf(request.get("offlineConsultationFee")).isEmpty()) {
            try { doctor.setOfflineConsultationFee(Double.parseDouble(String.valueOf(request.get("offlineConsultationFee")))); }
            catch (NumberFormatException ignored) {}
        }
        doctor.setClinicAddress(request.get("clinicAddress") != null ? String.valueOf(request.get("clinicAddress")) : null);
        doctor.setClinicStreet(request.get("clinicStreet") != null ? String.valueOf(request.get("clinicStreet")) : null);
        doctor.setClinicCity(request.get("clinicCity") != null ? String.valueOf(request.get("clinicCity")) : null);
        doctor.setClinicState(request.get("clinicState") != null ? String.valueOf(request.get("clinicState")) : null);
        doctor.setClinicPinCode(request.get("clinicPinCode") != null ? String.valueOf(request.get("clinicPinCode")) : null);

        doctor.setWorkingDays(request.get("workingDays") != null ? String.valueOf(request.get("workingDays")) : null);
        doctor.setConsultationTimings(request.get("consultationTimings") != null ? String.valueOf(request.get("consultationTimings")) : null);
        doctor.setBreakTimings(request.get("breakTimings") != null ? String.valueOf(request.get("breakTimings")) : null);
        
        if (request.get("slotDuration") != null && !String.valueOf(request.get("slotDuration")).isEmpty()) {
            try { doctor.setSlotDuration(Integer.parseInt(String.valueOf(request.get("slotDuration")))); }
            catch (NumberFormatException ignored) {}
        }
        if (request.get("maxPatientsPerDay") != null && !String.valueOf(request.get("maxPatientsPerDay")).isEmpty()) {
            try { doctor.setMaxPatientsPerDay(Integer.parseInt(String.valueOf(request.get("maxPatientsPerDay")))); }
            catch (NumberFormatException ignored) {}
        }

        // Financial Settlement Enforcement
        if (doctor.getHospitalEntity() != null) {
            doctor.setRazorpayAccountId(doctor.getHospitalEntity().getRazorpayKeyId());
            doctor.setUpiId(doctor.getHospitalEntity().getUpiId());
            doctor.setPreferredPaymentMode(doctor.getHospitalEntity().getPreferredPaymentMode() != null ? 
                                           doctor.getHospitalEntity().getPreferredPaymentMode() : "BOTH");
        } else {
            doctor.setRazorpayAccountId(request.get("razorpayAccountId") != null ? String.valueOf(request.get("razorpayAccountId")) : null);
            doctor.setUpiId(request.get("upiId") != null ? String.valueOf(request.get("upiId")) : null);
            doctor.setPreferredPaymentMode(request.get("preferredPaymentMode") != null ? 
                                           String.valueOf(request.get("preferredPaymentMode")) : "RAZORPAY");
        }
        
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

        // Advanced Clinical Depth Mapping
        doctor.setSubSpecialties(request.get("subSpecialties") != null ? String.valueOf(request.get("subSpecialties")) : null);
        doctor.setProceduresHandled(request.get("proceduresHandled") != null ? String.valueOf(request.get("proceduresHandled")) : null);
        doctor.setTreatmentFocus(request.get("treatmentFocus") != null ? String.valueOf(request.get("treatmentFocus")) : null);
        doctor.setLanguagesSpoken(request.get("languagesSpoken") != null ? String.valueOf(request.get("languagesSpoken")) : null);
        doctor.setPublications(request.get("publications") != null ? String.valueOf(request.get("publications")) : null);

        if (profilePicture != null && !profilePicture.isEmpty()) {
            String photoUrl = supabaseStorageService.uploadFile(profilePicture);
            if (photoUrl != null) doctor.setProfilePictureUrl(photoUrl);
        }

        if (licenseDocument != null && !licenseDocument.isEmpty()) {
            String docUrl = supabaseStorageService.uploadFile(licenseDocument);
            if (docUrl != null) doctor.setLicenseDocumentUrl(docUrl);
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
        user.setEmailVerified(true); // Default to verified since handled in frontend
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
            @RequestPart(value = "hospitalLogo", required = false) MultipartFile hospitalLogo,
            @RequestPart(value = "registrationCertificate", required = false) MultipartFile registrationCertificate,
            @RequestPart(value = "nabhCertificate", required = false) MultipartFile nabhCertificate,
            @RequestPart(value = "taxCertificate", required = false) MultipartFile taxCertificate,
            @RequestPart(value = "addressProof", required = false) MultipartFile addressProof,
            @RequestPart(value = "adminIdProof", required = false) MultipartFile adminIdProof) throws IOException {

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
        user.setEnabled(true); 
        user.setEmailVerified(false); // Mandate verification on first login for institutional security
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
        hospital.setAlternatePhone(request.get("alternatePhone") != null ? String.valueOf(request.get("alternatePhone")) : null);
        hospital.setContactEmail(request.get("email") != null ? String.valueOf(request.get("email")) : null);
        hospital.setOfficialEmergencyContact(request.get("emergencyPhone") != null ? String.valueOf(request.get("emergencyPhone")) : null);
        
        hospital.setHospitalType(request.get("hospitalType") != null ? String.valueOf(request.get("hospitalType")) : null);
        hospital.setOwnershipType(request.get("ownershipType") != null ? String.valueOf(request.get("ownershipType")) : null);
        hospital.setWebsite(request.get("website") != null ? String.valueOf(request.get("website")) : null);
        hospital.setGoogleMapsUrl(request.get("googleMapsUrl") != null ? String.valueOf(request.get("googleMapsUrl")) : null);
        
        hospital.setFacilityId(request.get("facilityId") != null ? String.valueOf(request.get("facilityId")) : null);
        hospital.setGovtRegistrationNumber(request.get("govtRegistrationNumber") != null ? String.valueOf(request.get("govtRegistrationNumber")) : null);
        hospital.setCinNumber(request.get("cinNumber") != null ? String.valueOf(request.get("cinNumber")) : null);
        
        hospital.setMedicalDirectorName(request.get("medicalDirectorName") != null ? String.valueOf(request.get("medicalDirectorName")) : null);
        hospital.setMedicalDirectorQualification(request.get("medicalDirectorQualification") != null ? String.valueOf(request.get("medicalDirectorQualification")) : null);
        hospital.setMedicalDirectorRegNumber(request.get("medicalDirectorRegNumber") != null ? String.valueOf(request.get("medicalDirectorRegNumber")) : null);
        hospital.setMedicalDirectorEmail(request.get("medicalDirectorEmail") != null ? String.valueOf(request.get("medicalDirectorEmail")) : null);
        
        hospital.setGstNumber(request.get("gstNumber") != null ? String.valueOf(request.get("gstNumber")) : null);
        hospital.setPanNumber(request.get("panNumber") != null ? String.valueOf(request.get("panNumber")) : null);
        hospital.setRegistrationAuthority(request.get("registrationAuthority") != null ? String.valueOf(request.get("registrationAuthority")) : null);
        hospital.setRegistrationDate(request.get("registrationDate") != null ? String.valueOf(request.get("registrationDate")) : null);
        hospital.setLicenseExpiryDate(request.get("licenseExpiryDate") != null ? String.valueOf(request.get("licenseExpiryDate")) : null);
        
        if (request.get("totalBeds") != null && !String.valueOf(request.get("totalBeds")).isEmpty()) {
            hospital.setTotalBeds(Integer.parseInt(String.valueOf(request.get("totalBeds"))));
        }
        if (request.get("doctorCount") != null && !String.valueOf(request.get("doctorCount")).isEmpty()) {
            hospital.setDoctorCount(Integer.parseInt(String.valueOf(request.get("doctorCount"))));
        }
        if (request.get("nurseCount") != null && !String.valueOf(request.get("nurseCount")).isEmpty()) {
            hospital.setNurseCount(Integer.parseInt(String.valueOf(request.get("nurseCount"))));
        }
        if (request.get("generalStaffCount") != null && !String.valueOf(request.get("generalStaffCount")).isEmpty()) {
            hospital.setGeneralStaffCount(Integer.parseInt(String.valueOf(request.get("generalStaffCount"))));
        }

        if (request.containsKey("icuAvailable")) hospital.setIcuAvailable(Boolean.parseBoolean(String.valueOf(request.get("icuAvailable"))));
        if (request.containsKey("ambulanceAvailable")) hospital.setAmbulanceAvailable(Boolean.parseBoolean(String.valueOf(request.get("ambulanceAvailable"))));
        if (request.containsKey("emergencyServicesAvailable")) hospital.setEmergencyServicesAvailable(Boolean.parseBoolean(String.valueOf(request.get("emergencyServicesAvailable"))));
        
        if (request.containsKey("hasEhr")) hospital.setHasEhr(Boolean.parseBoolean(String.valueOf(request.get("hasEhr"))));
        if (request.containsKey("hasPacs")) hospital.setHasPacs(Boolean.parseBoolean(String.valueOf(request.get("hasPacs"))));
        if (request.containsKey("hasLabIntegration")) hospital.setHasLabIntegration(Boolean.parseBoolean(String.valueOf(request.get("hasLabIntegration"))));
        if (request.containsKey("telemedicineEnabled")) hospital.setTelemedicineEnabled(Boolean.parseBoolean(String.valueOf(request.get("telemedicineEnabled"))));
        
        hospital.setBankName(request.get("bankName") != null ? String.valueOf(request.get("bankName")) : null);
        hospital.setBankAccountNumber(request.get("bankAccountNumber") != null ? String.valueOf(request.get("bankAccountNumber")) : null);
        hospital.setIfscCode(request.get("ifscCode") != null ? String.valueOf(request.get("ifscCode")) : null);
        hospital.setUpiId(request.get("upiId") != null ? String.valueOf(request.get("upiId")) : null);
        
        hospital.setTimezone(request.get("timezone") != null ? String.valueOf(request.get("timezone")) : "Asia/Kolkata");
        hospital.setWorkingHours(request.get("workingHours") != null ? String.valueOf(request.get("workingHours")) : "24/7");

        // Handle File Uploads
        if (hospitalLogo != null && !hospitalLogo.isEmpty()) hospital.setLogoUrl(supabaseStorageService.uploadFile(hospitalLogo));
        if (registrationCertificate != null && !registrationCertificate.isEmpty()) hospital.setRegistrationCertificateUrl(supabaseStorageService.uploadFile(registrationCertificate));
        if (nabhCertificate != null && !nabhCertificate.isEmpty()) hospital.setNabhCertificateUrl(supabaseStorageService.uploadFile(nabhCertificate));
        if (taxCertificate != null && !taxCertificate.isEmpty()) hospital.setTaxCertificateUrl(supabaseStorageService.uploadFile(taxCertificate));
        if (addressProof != null && !addressProof.isEmpty()) hospital.setAddressProofUrl(supabaseStorageService.uploadFile(addressProof));

        hospital = hospitalRepository.save(hospital);

        // 3. Create Admin Profile
        com.health.medisync.model.HospitalAdmin admin = new com.health.medisync.model.HospitalAdmin();
        admin.setUser(user);
        admin.setHospital(hospital);
        admin.setName(request.get("adminName") != null ? String.valueOf(request.get("adminName")) : null);
        admin.setPosition(request.get("adminRole") != null ? String.valueOf(request.get("adminRole")) : "CHIEF_ADMIN");
        admin.setContactNumber(request.get("adminContact") != null ? String.valueOf(request.get("adminContact")) : null);
        
        if (profilePicture != null && !profilePicture.isEmpty()) admin.setProfilePictureUrl(supabaseStorageService.uploadFile(profilePicture));
        if (adminIdProof != null && !adminIdProof.isEmpty()) admin.setIdProofUrl(supabaseStorageService.uploadFile(adminIdProof));

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

    @PostMapping("/request-deletion-otp")
    public ResponseEntity<?> requestDeletionOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email") != null ? request.get("email").toLowerCase() : null;
            if (email == null) throw new RuntimeException("Email is required");
            authService.generateAndSendDeletionOtp(email);
            return ResponseEntity.ok(Map.of("message", "High-security deletion code sent to " + email));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/confirm-account-deletion")
    public ResponseEntity<?> confirmAccountDeletion(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email") != null ? request.get("email").toLowerCase() : null;
            String otp = request.get("otp");
            if (email == null || otp == null) throw new RuntimeException("Email and OTP are required");
            
            authService.permanentlyDeleteAccount(email, otp);
            return ResponseEntity.ok(Map.of("message", "Your account and all associated data have been permanently removed."));
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

    @PostMapping("/delete-account/request")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> requestDeletionOtp() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsernameIgnoreCase(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String email = null;
        if ("ROLE_PATIENT".equals(user.getRole())) {
            email = patientRepository.findByUserId(user.getId()).map(Patient::getEmail).orElse(null);
        } else if ("ROLE_DOCTOR".equals(user.getRole())) {
            email = doctorRepository.findByUserId(user.getId()).map(Doctor::getEmail).orElse(null);
        } else if ("ROLE_HOSPITAL_ADMIN".equals(user.getRole())) {
            email = hospitalAdminRepository.findByUserId(user.getId())
                    .map(admin -> admin.getHospital() != null ? admin.getHospital().getContactEmail() : null)
                    .orElse(null);
        }
        
        if (email == null) return ResponseEntity.badRequest().body(Map.of("message", "No verified email associated with this node."));
        
        authService.generateAndSendDeletionOtp(email);
        return ResponseEntity.ok(Map.of("message", "Deletion security code broadcasted to " + email));
    }

    @PostMapping("/delete-account/confirm")
    @PreAuthorize("isAuthenticated()")
    @Transactional
    public ResponseEntity<?> confirmDeletion(@RequestBody Map<String, String> request) {
        String otp = request.get("otp");
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsernameIgnoreCase(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String email = null;
        if ("ROLE_PATIENT".equals(user.getRole())) {
            email = patientRepository.findByUserId(user.getId()).map(Patient::getEmail).orElse(null);
        } else if ("ROLE_DOCTOR".equals(user.getRole())) {
            email = doctorRepository.findByUserId(user.getId()).map(Doctor::getEmail).orElse(null);
        } else if ("ROLE_HOSPITAL_ADMIN".equals(user.getRole())) {
            email = hospitalAdminRepository.findByUserId(user.getId())
                    .map(admin -> admin.getHospital() != null ? admin.getHospital().getContactEmail() : null)
                    .orElse(null);
        }
        
        if (email == null || otp == null) return ResponseEntity.badRequest().body(Map.of("message", "Invalid deletion request."));
        
        try {
            authService.verifyOtpStandalone(email, otp);
            
            // CASCADED DATA WIPE
            Long uid = user.getId();
            
            jdbcTemplate.update("DELETE FROM appointments WHERE patient_id = (SELECT id FROM patients WHERE user_id = ?) OR doctor_id = (SELECT id FROM doctors WHERE user_id = ?)", uid, uid);
            jdbcTemplate.update("DELETE FROM medical_records WHERE patient_id = (SELECT id FROM patients WHERE user_id = ?)", uid);
            jdbcTemplate.update("DELETE FROM reports WHERE patient_id = (SELECT id FROM patients WHERE user_id = ?)", uid);
            jdbcTemplate.update("DELETE FROM notifications WHERE user_id = ?", uid);
            jdbcTemplate.update("DELETE FROM chat_messages WHERE sender_id = ? OR receiver_id = ?", uid, uid);
            jdbcTemplate.update("DELETE FROM access_requests WHERE patient_id = (SELECT id FROM patients WHERE user_id = ?) OR doctor_id = (SELECT id FROM doctors WHERE user_id = ?)", uid, uid);
            jdbcTemplate.update("DELETE FROM ratings WHERE patient_id = (SELECT id FROM patients WHERE user_id = ?) OR doctor_id = (SELECT id FROM doctors WHERE user_id = ?)", uid, uid);
            jdbcTemplate.update("DELETE FROM password_reset_tokens WHERE user_id = ?", uid);
            jdbcTemplate.update("DELETE FROM email_verification_otps WHERE email = ?", email);
            
            // Profile Deletion
            jdbcTemplate.update("DELETE FROM patients WHERE user_id = ?", uid);
            jdbcTemplate.update("DELETE FROM doctors WHERE user_id = ?", uid);
            jdbcTemplate.update("DELETE FROM hospital_admins WHERE user_id = ?", uid);
            
            // Finally the User
            userRepository.delete(user);
            
            return ResponseEntity.ok(Map.of("message", "Your MediSync clinical node and all associated data have been PERMANENTLY deleted."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Security verification failed: " + e.getMessage()));
        }
    }
}
