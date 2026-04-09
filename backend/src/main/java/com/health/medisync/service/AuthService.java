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

    public AuthService(UserRepository userRepository, 
                       PasswordResetTokenRepository tokenRepository, 
                       PasswordEncoder passwordEncoder,
                       EmailService emailService,
                       PatientRepository patientRepository,
                       DoctorRepository doctorRepository,
                       EmailVerificationOtpRepository emailVerificationOtpRepository) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.emailVerificationOtpRepository = emailVerificationOtpRepository;
    }

    @Transactional
    public String initiatePasswordReset(String input) {
        User user = userRepository.findByUsername(input).orElse(null);

        if (user == null && input.contains("@")) {
            // Try searching by email in Patient and Doctor repositories
            user = patientRepository.findByEmail(input)
                    .map(Patient::getUser)
                    .orElseGet(() -> doctorRepository.findByEmail(input)
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
        // Delete any existing OTPs for this email
        emailVerificationOtpRepository.deleteByEmail(email);
        emailVerificationOtpRepository.flush();

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(1000000));
        
        EmailVerificationOtp verificationOtp = new EmailVerificationOtp(email, otp, 5); // 5 mins expiry
        emailVerificationOtpRepository.save(verificationOtp);

        System.out.println("DEBUG: Sending OTP " + otp + " to " + email);
        emailService.sendOtpEmail(email, otp);
    }

    @Transactional
    public void verifyOtp(String email, String otp) {
        verifyOtpStandalone(email, otp);
        
        // After standalone verification, we find the user and enable them
        User user = userRepository.findByUsername(email).orElse(null);
        if (user == null) {
            // If username isn't email, try finding by role link
            user = patientRepository.findByEmail(email)
                    .map(Patient::getUser)
                    .orElseGet(() -> doctorRepository.findByEmail(email)
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
        EmailVerificationOtp verificationOtp = emailVerificationOtpRepository.findByEmail(email)
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
        tokenRepository.deleteAll();
        emailVerificationOtpRepository.deleteAll();
        patientRepository.deleteAll();
        doctorRepository.deleteAll();
        userRepository.deleteAll();
        System.out.println("SUCCESS: Database has been wiped.");
    }
}
