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
    private String smtpSenderEmail;

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${brevo.sender.email:}")
    private String brevoSenderEmail;

    public String testEmail(String to) {
        return sendEmailInternal(to, "MediSync - Connection Test", "This is a diagnostic test of the email integration.");
    }

    @Async
    public void sendOtpEmail(String to, String otp) {
        System.out.println("========================================");
        System.out.println("DEVELOPMENT OTP FALLBACK: [" + otp + "] for " + to);
        System.out.println("========================================");
        
        String body = "Your MediSync Verification Code is: <strong>" + otp + "</strong><br><br>This code will expire in 5 minutes.";
        String result = sendEmailInternal(to, "MediSync - Email Verification", body);
        
        if (result.startsWith("ERROR") || result.startsWith("FAIL")) {
            System.err.println("CRITICAL: Failed to send OTP email to " + to + ". Result: " + result);
        } else {
            System.out.println("SUCCESS: OTP email sent to " + to);
        }
    }

    @Async
    public void sendEmail(String to, String subject, String body) {
        String htmlBody = body.replace("\n", "<br>");
        sendEmailInternal(to, subject, htmlBody);
    }

    private String sendEmailInternal(String to, String subject, String htmlBody) {
        if (brevoApiKey != null && !brevoApiKey.trim().isEmpty()) {
            return sendEmailViaBrevo(to, subject, htmlBody);
        } else if (smtpSenderEmail != null && !smtpSenderEmail.trim().isEmpty()) {
            return sendEmailViaSmtp(to, subject, htmlBody);
        } else {
            String err = "ERROR: Neither Brevo (BREVO_API_KEY) nor Gmail SMTP (GMAIL_USERNAME) is configured! Cannot send email.";
            System.err.println(err);
            return err;
        }
    }

    private String sendEmailViaBrevo(String to, String subject, String htmlBody) {
        String cleanToken = brevoApiKey.trim().replace("\"", "").replace("'", "");
        String cleanSender = (brevoSenderEmail != null) ? brevoSenderEmail.trim().replace("\"", "").replace("'", "") : "";
        if (cleanSender.isEmpty()) {
            cleanSender = "no-reply@medisync.hos";
        }

        System.out.println("[BREVO EMAIL] Attempting to send email to: " + to);
        System.out.println("[BREVO EMAIL] From: " + cleanSender);
        System.out.println("[BREVO EMAIL] Subject: " + subject);

        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                    .connectTimeout(java.time.Duration.ofSeconds(5))
                    .build();

            String jsonPayload = "{"
                    + "\"sender\":{\"name\":\"MediSync Portal\",\"email\":\"" + cleanSender + "\"},"
                    + "\"to\":[{\"email\":\"" + to + "\"}],"
                    + "\"subject\":\"" + escapeJson(subject) + "\","
                    + "\"htmlContent\":\"" + escapeJson(htmlBody) + "\""
                    + "}";

            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("Content-Type", "application/json")
                    .header("api-key", cleanToken)
                    .header("Accept", "application/json")
                    .header("User-Agent", "MediSync-Backend/1.0")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonPayload, java.nio.charset.StandardCharsets.UTF_8))
                    .timeout(java.time.Duration.ofSeconds(5))
                    .build();

            java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                System.out.println("[BREVO EMAIL] SUCCESS: Email delivered to " + to);
                return "SUCCESS: Email sent to " + to + " via Brevo HTTP API";
            } else {
                String fullErr = "ERROR: Brevo API returned status " + response.statusCode() + " - " + response.body();
                System.err.println(fullErr);
                return fullErr;
            }
        } catch (Exception e) {
            String fullErr = "ERROR: Brevo HTTP call failed - " + e.getMessage();
            System.err.println(fullErr);
            e.printStackTrace();
            return fullErr;
        }
    }

    private String sendEmailViaSmtp(String to, String subject, String htmlBody) {
        System.out.println("[SMTP EMAIL] Attempting to send email to: " + to);
        System.out.println("[SMTP EMAIL] From: " + smtpSenderEmail);
        System.out.println("[SMTP EMAIL] Subject: " + subject);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(smtpSenderEmail, "MediSync Portal");
            helper.setTo(to);
            helper.setSubject(subject);
            
            String fullHtml = "<div style='font-family: Arial, sans-serif; padding: 20px;'>" + htmlBody + "</div>";
            helper.setText(fullHtml, true);
            
            mailSender.send(message);
            System.out.println("[SMTP EMAIL] SUCCESS: Email delivered to " + to);
            return "SUCCESS: Email sent to " + to + " via SMTP";
        } catch (MessagingException e) {
            String fullErr = "ERROR: Gmail SMTP failed - " + e.getMessage();
            System.err.println(fullErr);
            e.printStackTrace();
            return fullErr;
        } catch (java.io.UnsupportedEncodingException e) {
            String fullErr = "ERROR: Encoding issue - " + e.getMessage();
            System.err.println(fullErr);
            return fullErr;
        } catch (Exception e) {
            String fullErr = "ERROR: Unexpected SMTP failure - " + e.getClass().getName() + ": " + e.getMessage();
            System.err.println(fullErr);
            e.printStackTrace();
            return fullErr;
        }
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < input.length(); i++) {
            char ch = input.charAt(i);
            switch (ch) {
                case '\\': sb.append("\\\\"); break;
                case '"': sb.append("\\\""); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (ch >= 0 && ch <= 31) {
                        String ss = Integer.toHexString(ch);
                        sb.append("\\u");
                        for (int k = 0; k < 4 - ss.length(); k++) {
                            sb.append('0');
                        }
                        sb.append(ss.toLowerCase());
                    } else {
                        sb.append(ch);
                    }
            }
        }
        return sb.toString();
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
