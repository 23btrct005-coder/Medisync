package com.health.medisync.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    public String testEmail(String to) {
        return sendEmailInternal(to, "MediSync - Connection Test", "This is a diagnostic test of the Gmail SMTP integration.");
    }

    @Async
    public void sendOtpEmail(String to, String otp) {
        System.out.println("========================================");
        System.out.println("DEVELOPMENT OTP FALLBACK: [" + otp + "] for " + to);
        System.out.println("========================================");
        
        String body = "Your MediSync Verification Code is: " + otp + "\n\nThis code will expire in 5 minutes.";
        String result = sendEmailInternal(to, "MediSync - Email Verification", body);
        
        if (result.startsWith("ERROR") || result.startsWith("FAIL")) {
            System.err.println("CRITICAL: Failed to send OTP email to " + to + ". Check credentials and quota.");
        } else {
            System.out.println("SUCCESS: OTP email queued for " + to);
        }
    }

    @Async
    public void sendEmail(String to, String subject, String body) {
        sendEmailInternal(to, subject, body);
    }

    @Async
    protected String sendEmailInternal(String to, String subject, String body) {
        if (senderEmail == null || senderEmail.trim().isEmpty()) {
            String err = "ERROR: Sender Email is missing!";
            System.err.println(err);
            System.out.println("SECURITY ALERT: Email relay skipped due to missing credentials. Check logs for payload.");
            return err;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(senderEmail, "MediSync Portal");
            helper.setTo(to);
            helper.setSubject(subject);
            
            String htmlContent = "<div style='font-family: sans-serif;'>" + body.replace("\n", "<br>") + "</div>";
            helper.setText(body, true); 
            
            mailSender.send(message);
            return "SUCCESS: Email sent to " + to;
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            String fullErr = "ERROR: Failed to send email - " + e.getMessage();
            System.err.println(fullErr);
            return fullErr;
        }
    }

    public void sendPasswordResetEmail(String to, String token) {
        String resetUrl = "https://medisync-vert-five.vercel.app/reset-password?token=" + token;
        String subject = "MediSync - Password Reset Request";
        String body = "You requested a password reset for your MediSync account.\n\n" +
                      "Please click the link below to set a new password. This link is valid for 30 minutes:\n\n" +
                      resetUrl + "\n\n" +
                      "If you did not request this, please ignore this email.";
        
        System.out.println("DEBUG: Sending recovery link to: " + to);
        sendEmail(to, subject, body);
    }

    public void sendDoctorInvitationEmail(String to, String patientName) {
        String portalUrl = "https://medisync-vert-five.vercel.app/doctor-portal";
        String subject = "MediSync - Clinical Access Invitation from " + patientName;
        String body = "Hello Doctor,\n\n" +
                      "Patient " + patientName + " has invited you to access their secure clinical portal on MediSync.\n\n" +
                      "This will allow you to view their medical history, AI-analyzed reports, and diagnostic journey in real-time.\n\n" +
                      "Please log in or register at the following link to review the access request:\n\n" +
                      portalUrl + "\n\n" +
                      "Thank you for being part of the MediSync secure healthcare network.";
        
        System.out.println("DEBUG: Sending physician invitation to: " + to);
        sendEmail(to, subject, body);
    }

    public void sendDeletionOtpEmail(String to, String otp) {
        String subject = "MediSync - PERMANENT Account Deletion Request";
        String body = "You have requested to PERMANENTLY DELETE your MediSync account.\n\n" +
                      "Your security verification code is: " + otp + "\n\n" +
                      "This code is valid for 10 minutes. If you did not request this, please change your password immediately. " +
                      "MediSync staff will NEVER ask for this code.";
        sendEmail(to, subject, body);
    }
}
