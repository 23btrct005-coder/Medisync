package com.health.medisync.service;

import com.health.medisync.model.EmailVerificationOtp;
import com.health.medisync.model.Patient;
import com.health.medisync.model.Doctor;
import com.health.medisync.model.PasswordResetToken;
import com.health.medisync.model.User;
import com.health.medisync.repository.*;
import com.health.medisync.model.Hospital;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final EmailVerificationOtpRepository emailVerificationOtpRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final ReportRepository reportRepository;
    private final AccessRequestRepository accessRequestRepository;
    private final HospitalAdminRepository hospitalAdminRepository;
    private final HospitalRepository hospitalRepository;
    private final AppointmentRepository appointmentRepository;
    private final RatingRepository ratingRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final TelemetryRepository telemetryRepository;
    private final DepartmentRepository departmentRepository;

    public AuthService(UserRepository userRepository,
                       PasswordResetTokenRepository tokenRepository,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService,
                       PatientRepository patientRepository,
                       DoctorRepository doctorRepository,
                       EmailVerificationOtpRepository emailVerificationOtpRepository,
                       MedicalRecordRepository medicalRecordRepository,
                       ReportRepository reportRepository,
                       AccessRequestRepository accessRequestRepository,
                       HospitalAdminRepository hospitalAdminRepository,
                       HospitalRepository hospitalRepository,
                       AppointmentRepository appointmentRepository,
                       RatingRepository ratingRepository,
                       PrescriptionRepository prescriptionRepository,
                       NotificationRepository notificationRepository,
                       AuditLogRepository auditLogRepository,
                       TelemetryRepository telemetryRepository,
                       DepartmentRepository departmentRepository) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.emailVerificationOtpRepository = emailVerificationOtpRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.reportRepository = reportRepository;
        this.accessRequestRepository = accessRequestRepository;
        this.hospitalAdminRepository = hospitalAdminRepository;
        this.hospitalRepository = hospitalRepository;
        this.appointmentRepository = appointmentRepository;
        this.ratingRepository = ratingRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.notificationRepository = notificationRepository;
        this.auditLogRepository = auditLogRepository;
        this.telemetryRepository = telemetryRepository;
        this.departmentRepository = departmentRepository;
    }

    @Transactional
    public String initiatePasswordReset(String input) {
        String normalizedInput = input != null ? input.toLowerCase() : null;
        User user = userRepository.findByUsername(normalizedInput).orElse(null);

        if (user == null && normalizedInput != null && normalizedInput.contains("@")) {
            user = patientRepository.findByUserUsernameIgnoreCase(normalizedInput)
                    .map(Patient::getUser)
                    .orElseGet(() -> doctorRepository.findByEmail(normalizedInput)
                            .map(Doctor::getUser)
                            .orElse(null));
        }

        if (user == null) {
            throw new RuntimeException("No account found with username or email: " + input);
        }

        tokenRepository.deleteByUserId(user.getId());
        tokenRepository.flush();

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(token, user, 30);
        tokenRepository.save(resetToken);

        String userEmail = null;
        if ("ROLE_PATIENT".equals(user.getRole())) {
            userEmail = patientRepository.findByUserId(user.getId())
                .map(Patient::getEmail)
                .orElse(null);
        } else if ("ROLE_DOCTOR".equals(user.getRole())) {
            userEmail = doctorRepository.findByUserId(user.getId())
                .map(Doctor::getEmail)
                .orElse(null);
        }

        if (userEmail != null) {
            try {
                emailService.sendPasswordResetEmail(userEmail, token);
            } catch (Exception e) {
                throw new RuntimeException("Email delivery failed: " + e.getMessage());
            }
        } else {
            throw new RuntimeException("No email address found associated with input: " + input);
        }
        
        return token;
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or non-existent token"));

        if (resetToken.isExpired()) {
            tokenRepository.delete(resetToken);
            throw new RuntimeException("Token has expired");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        tokenRepository.delete(resetToken);
    }

    public EmailService getEmailService() {
        return this.emailService;
    }

    @Transactional
    public void generateAndSendOtp(String email) {
        String normalizedEmail = email != null ? email.toLowerCase() : null;
        emailVerificationOtpRepository.deleteByEmail(normalizedEmail);
        emailVerificationOtpRepository.flush();

        String otp = String.format("%06d", new Random().nextInt(1000000));
        EmailVerificationOtp verificationOtp = new EmailVerificationOtp(normalizedEmail, otp, 5);
        emailVerificationOtpRepository.save(verificationOtp);
        emailService.sendOtpEmail(normalizedEmail, otp);
    }

    @Transactional
    public void generateAndSendDeletionOtp(String email) {
        String normalizedEmail = email != null ? email.toLowerCase() : null;
        emailVerificationOtpRepository.deleteByEmail(normalizedEmail);
        emailVerificationOtpRepository.flush();

        String otp = String.format("%06d", new Random().nextInt(1000000));
        EmailVerificationOtp verificationOtp = new EmailVerificationOtp(normalizedEmail, otp, 10);
        emailVerificationOtpRepository.save(verificationOtp);
        emailService.sendDeletionOtpEmail(normalizedEmail, otp);
    }

    @Transactional
    public void verifyOtp(String email, String otp) {
        String normalizedEmail = email != null ? email.toLowerCase() : null;
        verifyOtpStandalone(normalizedEmail, otp);
        
        User user = userRepository.findByUsername(normalizedEmail).orElse(null);
        if (user == null) {
            user = patientRepository.findByUserUsernameIgnoreCase(normalizedEmail)
                    .map(Patient::getUser)
                    .orElseGet(() -> doctorRepository.findByEmail(normalizedEmail)
                            .map(Doctor::getUser)
                            .orElse(null));
        }

        if (user != null) {
            user.setEnabled(true);
            userRepository.save(user);
        }
    }

    @Transactional
    public void verifyOtpStandalone(String email, String otp) {
        String normalizedEmail = email != null ? email.toLowerCase() : null;
        EmailVerificationOtp verificationOtp = emailVerificationOtpRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("No verification code found for this email."));

        if (verificationOtp.isExpired()) {
            emailVerificationOtpRepository.delete(verificationOtp);
            throw new RuntimeException("Verification code has expired. Please request a new one.");
        }

        if (!verificationOtp.getOtp().equals(otp)) {
            throw new RuntimeException("Invalid verification code.");
        }

        emailVerificationOtpRepository.delete(verificationOtp);
    }

    @Transactional
    public void permanentlyDeleteAccount(String email, String otp) {
        String normalizedEmail = email != null ? email.toLowerCase() : null;
        verifyOtpStandalone(normalizedEmail, otp);

        User user = userRepository.findByUsername(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String role = user.getRole();

        if ("ROLE_DOCTOR".equals(role)) {
            Doctor doctor = doctorRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new RuntimeException("Doctor profile not found"));
            
            // Delete associated data
            appointmentRepository.deleteByDoctorId(doctor.getId());
            prescriptionRepository.deleteAll(prescriptionRepository.findByDoctorIdOrderByCreatedAtDesc(doctor.getId()));
            ratingRepository.deleteAll(ratingRepository.findByDoctorId(doctor.getId()));
            
            doctorRepository.delete(doctor);
        } else if ("ROLE_HOSPITAL_ADMIN".equals(role)) {
            hospitalAdminRepository.findByUserId(user.getId()).ifPresent(admin -> {
                Hospital hospital = admin.getHospital();
                if (hospital != null) {
                    // This will cascade to doctors if configured, but let's be explicit if needed
                    hospitalRepository.delete(hospital);
                }
                hospitalAdminRepository.delete(admin);
            });
        }

        userRepository.delete(user);
    }

    /**
     * CRITICAL: Clears all institutional, professional, and patient data.
     * Deletes in reverse order of dependencies to avoid FK constraints.
     */
    @Transactional
    public void clearAllData() {
        System.out.println("CRITICAL: Initiating full database wipe...");
        
        // 1. Delete most downstream child records
        ratingRepository.deleteAll();
        prescriptionRepository.deleteAll();
        notificationRepository.deleteAll();
        auditLogRepository.deleteAll();
        telemetryRepository.deleteAll();
        
        // 2. Delete medical interactions
        accessRequestRepository.deleteAll();
        reportRepository.deleteAll();
        medicalRecordRepository.deleteAll();
        appointmentRepository.deleteAll();
        
        // 3. Delete organizational structure
        departmentRepository.deleteAll();
        
        // 4. Delete auth tokens
        tokenRepository.deleteAll();
        emailVerificationOtpRepository.deleteAll();
        
        // 5. Delete specific profiles (linked to users and hospitals)
        patientRepository.deleteAll();
        doctorRepository.deleteAll();
        hospitalAdminRepository.deleteAll();
        
        // 6. Delete core users
        userRepository.deleteAll();
        
        // 7. Finally delete hospitals
        hospitalRepository.deleteAll();
        
        System.out.println("SUCCESS: Database has been completely reset.");
    }
}
