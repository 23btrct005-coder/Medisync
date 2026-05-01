package com.health.medisync.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
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
    private final RestTemplate restTemplate;

    public EmailService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000); // 5 seconds
        factory.setReadTimeout(5000);    // 5 seconds
        this.restTemplate = new RestTemplate(factory);
    }

    public String testEmail(String to) {
        return sendEmailInternal(to, "MediSync - Connection Test", "This is a diagnostic test of the Brevo integration.");
    }

    public void sendOtpEmail(String to, String otp) {
        String body = "Your MediSync Verification Code is: " + otp + "\n\nThis code will expire in 5 minutes.";
        String result = sendEmailInternal(to, "MediSync - Email Verification", body);
        if (result != null && result.startsWith("ERROR:")) {
            // Permissive mode for configuration issues (API key or Sender Email missing)
            if (apiKey == null || apiKey.trim().isEmpty() || result.contains("CONFIG_MISSING")) {
                System.out.println("CRITICAL [MOCK-SEND]: Infrastructure configuration incomplete. OTP for " + to + " is: " + otp);
                return; // Allow proceed in dev/missing-config mode
            }
            throw new RuntimeException(result);
        }
    }

    public void sendEmail(String to, String subject, String body) {
        String result = sendEmailInternal(to, subject, body);
        if (result != null && result.startsWith("ERROR:")) {
            throw new RuntimeException(result);
        }
    }

    @Async
    protected String sendEmailInternal(String to, String subject, String body) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            String err = "ERROR: Brevo API Key is missing!";
            System.err.println(err);
            System.out.println("SECURITY ALERT: Email relay skipped due to missing credentials. Check logs for payload.");
            return err;
        }

        String cleanToken = apiKey.trim();
        String tokenHead = (cleanToken.length() >= 4) ? cleanToken.substring(0, 4) : "[SHORT]";
        String tokenTail = (cleanToken.length() >= 4) ? cleanToken.substring(cleanToken.length() - 4) : "";
        
        System.out.println("DIAGNOSTIC: Attempting Brevo send to " + to);
        System.out.println("DIAGNOSTIC: Token length: " + cleanToken.length() + " | Start: " + tokenHead + " | End: " + tokenTail);
        System.out.println("DIAGNOSTIC: Sender Email: " + senderEmail);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("application", "json", java.nio.charset.StandardCharsets.UTF_8));
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        headers.set("api-key", cleanToken);
        headers.set("User-Agent", "MediSync-Backend/1.0");

        Map<String, Object> payload = new HashMap<>();
        Map<String, String> sender = new HashMap<>();
        sender.put("name", "MediSync Portal");
        sender.put("email", senderEmail);
        payload.put("sender", sender);

        Map<String, String> recipient = new HashMap<>();
        recipient.put("email", to);
        payload.put("to", Collections.singletonList(recipient));

        payload.put("subject", subject);
        payload.put("htmlContent", "<div style='font-family: sans-serif;'>" + body.replace("\n", "<br>") + "</div>");
        payload.put("textContent", body);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, request, String.class);
            return "SUCCESS: " + response.getBody();
        } catch (HttpStatusCodeException e) {
            String errorBody = e.getResponseBodyAsString();
            String fullErr = "ERROR: Brevo API " + e.getStatusCode() + " - " + (errorBody.isEmpty() ? "[Empty Body]" : errorBody);
            if (senderEmail == null || senderEmail.trim().isEmpty()) {
                fullErr = "ERROR: CONFIG_MISSING - Brevo Sender Email is missing!";
            }
            System.err.println(fullErr);
            return fullErr;
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
