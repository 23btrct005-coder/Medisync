package com.health.medisync.service;

import com.health.medisync.model.EmailVerificationOtp;
import com.health.medisync.repository.EmailVerificationOtpRepository;
import com.health.medisync.model.Patient;
import com.health.medisync.model.Doctor;
import com.health.medisync.model.PasswordResetToken;
import com.health.medisync.model.User;
import com.health.medisync.repository.PasswordResetTokenRepository;
import com.health.medisync.repository.UserRepository;
import com.health.medisync.repository.PatientRepository;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.MedicalRecordRepository;
import com.health.medisync.repository.ReportRepository;
import com.health.medisync.repository.AccessRequestRepository;
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

    public AuthService(UserRepository userRepository,
                       PasswordResetTokenRepository tokenRepository,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService,
                       PatientRepository patientRepository,
                       DoctorRepository doctorRepository,
                       EmailVerificationOtpRepository emailVerificationOtpRepository,
                       MedicalRecordRepository medicalRecordRepository,
                       ReportRepository reportRepository,
                       AccessRequestRepository accessRequestRepository) {
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
    }

    @Transactional
    public String initiatePasswordReset(String input) {
        String normalizedInput = input != null ? input.toLowerCase() : null;
        User user = userRepository.findByUsername(normalizedInput).orElse(null);

        if (user == null && normalizedInput != null && normalizedInput.contains("@")) {
            // Try searching by email in Patient and Doctor repositories
            user = patientRepository.findByUserUsernameIgnoreCase(normalizedInput)
                    .map(Patient::getUser)
                    .orElseGet(() -> doctorRepository.findByEmail(normalizedInput)
                            .map(Doctor::getUser)
                            .orElse(null));
        }

        if (user == null) {
            throw new RuntimeException("No account found with username or email: " + input);
        }

        // Cleanly delete any existing tokens for this user before creating a new one
        tokenRepository.deleteByUserId(user.getId());
        tokenRepository.flush(); // Force immediate deletion to prevent @OneToOne conflicts

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(token, user, 30); // 30 mins expiry
        tokenRepository.save(resetToken);

        // Fetch the user's email based on their role to send a real link
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
            System.out.println("DEBUG: Attempting to send real password reset email to: " + userEmail);
            try {
                emailService.sendPasswordResetEmail(userEmail, token);
            } catch (Exception e) {
                System.err.println("CRITICAL: Failed to send email to " + userEmail + ". Message: " + e.getMessage());
                // Rethrow as a runtime exception so the Controller catches it and reports it to the UI
                throw new RuntimeException("Email delivery failed: " + e.getMessage() + ". Please check your Render SMTP settings.");
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

        // Success, delete the token
        tokenRepository.delete(resetToken);
    }

    public EmailService getEmailService() {
        return this.emailService;
    }

    @Transactional
    public void generateAndSendOtp(String email) {
        String normalizedEmail = email != null ? email.toLowerCase() : null;
        // Delete any existing OTPs for this email
        emailVerificationOtpRepository.deleteByEmail(normalizedEmail);
        emailVerificationOtpRepository.flush();

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(1000000));
        
        EmailVerificationOtp verificationOtp = new EmailVerificationOtp(normalizedEmail, otp, 5); // 5 mins expiry
        emailVerificationOtpRepository.save(verificationOtp);

        System.out.println("DEBUG: Sending OTP " + otp + " to " + normalizedEmail);
        emailService.sendOtpEmail(normalizedEmail, otp);
    }

    @Transactional
    public void verifyOtp(String email, String otp) {
        String normalizedEmail = email != null ? email.toLowerCase() : null;
        verifyOtpStandalone(normalizedEmail, otp);
        
        // After standalone verification, we find the user and enable them
        User user = userRepository.findByUsername(normalizedEmail).orElse(null);
        if (user == null) {
            // If username isn't email, try finding by role link
            user = patientRepository.findByUserUsernameIgnoreCase(normalizedEmail)
                    .map(Patient::getUser)
                    .orElseGet(() -> doctorRepository.findByEmail(normalizedEmail)
                            .map(Doctor::getUser)
                            .orElse(null));
        }

        if (user != null) {
            user.setEnabled(true);
            userRepository.save(user);
            System.out.println("SUCCESS: User " + email + " has been verified and enabled.");
        } else {
            // In the NEW inline flow, this is normal if they haven't registered yet
            System.out.println("INFO: Email " + email + " verified, but no user account exists yet to enable.");
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

        // Success, delete the OTP
        emailVerificationOtpRepository.delete(verificationOtp);
    }

    @Transactional
    public void clearAllData() {
        System.out.println("CRITICAL: Clearing all registered data from the database...");
        // Delete child records first to satisfy foreign-key constraints
        accessRequestRepository.deleteAll();
        reportRepository.deleteAll();
        medicalRecordRepository.deleteAll();
        tokenRepository.deleteAll();
        emailVerificationOtpRepository.deleteAll();
        patientRepository.deleteAll();
        doctorRepository.deleteAll();
        userRepository.deleteAll();
        System.out.println("SUCCESS: Database has been wiped.");
    }
}
