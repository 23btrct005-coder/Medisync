package com.health.medisync.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    @Value("${brevo.api.key:}")
    private String apiKey;

    @Value("${brevo.sender.email:}")
    private String senderEmail;

    private final String apiUrl = "https://api.brevo.com/v3/smtp/email";
    private final HttpClient httpClient;

    public EmailService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    public String testEmail(String to) {
        return sendEmailInternal(to, "MediSync - Connection Test", "This is a diagnostic test of the Brevo integration.");
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
        if (apiKey == null || apiKey.trim().isEmpty()) {
            String err = "ERROR: Brevo API Key is missing!";
            System.err.println(err);
            System.out.println("SECURITY ALERT: Email relay skipped due to missing credentials. Check logs for payload.");
            return err;
        }

        // Sanitize credentials (strip potential quotes from .env parsing)
        String cleanToken = apiKey.trim().replace("\"", "").replace("'", "");
        String cleanSender = (senderEmail != null) ? senderEmail.trim().replace("\"", "").replace("'", "") : "";
        
        String tokenHead = (cleanToken.length() >= 4) ? cleanToken.substring(0, 4) : "[SHORT]";
        String tokenTail = (cleanToken.length() >= 4) ? cleanToken.substring(cleanToken.length() - 4) : "";
        
        System.out.println("DIAGNOSTIC: Attempting Brevo send to " + to);
        System.out.println("DIAGNOSTIC: Using API Key: " + tokenHead + "..." + tokenTail);
        System.out.println("DIAGNOSTIC: Sender Email: " + cleanSender);

        String escapedSubject = subject.replace("\"", "\\\"");
        String escapedBody = "<div style='font-family: sans-serif;'>" + body.replace("\n", "<br>").replace("\"", "\\\"") + "</div>";

        String jsonPayload = "{"
                + "\"sender\":{\"name\":\"MediSync Portal\",\"email\":\"" + cleanSender + "\"},"
                + "\"to\":[{\"email\":\"" + to + "\"}],"
                + "\"subject\":\"" + escapedSubject + "\","
                + "\"htmlContent\":\"" + escapedBody + "\""
                + "}";

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("accept", "application/json")
                    .header("api-key", cleanToken)
                    .header("content-type", "application/json")
                    .header("User-Agent", "MediSync-Backend/1.0")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, java.nio.charset.StandardCharsets.UTF_8))
                    .timeout(Duration.ofSeconds(5))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return "SUCCESS: " + response.body();
            } else {
                String errorBody = response.body();
                String fullErr = "ERROR: Brevo API " + response.statusCode() + " - " + (errorBody == null || errorBody.isEmpty() ? "[Empty Body]" : errorBody);
                if (cleanSender.isEmpty()) {
                    fullErr += " (Warning: Sender Email is missing!)";
                }
                System.err.println(fullErr);
                return fullErr;
            }
        } catch (Exception e) {
            String fullErr = "ERROR: Brevo Connection Failed - " + e.getMessage();
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
