package com.health.medisync.service;

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

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public AuthService(UserRepository userRepository, 
                       PasswordResetTokenRepository tokenRepository, 
                       PasswordEncoder passwordEncoder,
                       EmailService emailService,
                       PatientRepository patientRepository,
                       DoctorRepository doctorRepository) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
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
}
