package com.health.medisync.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
public class EmailService {

    @Value("${resend.api.key:}")
    private String apiKey;

    @Value("${resend.from.email:onboarding@resend.dev}")
    private String fromEmail;

    private final String apiUrl = "https://api.resend.com/emails";
    private final RestTemplate restTemplate;

    public EmailService() {
        this.restTemplate = new RestTemplate();
    }

    public void sendEmail(String to, String subject, String body) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            System.err.println("ERROR: Resend API Key is missing!");
            return;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey.trim());

        // Building Resend JSON structure
        Map<String, Object> payload = new HashMap<>();
        payload.put("from", fromEmail);
        payload.put("to", Collections.singletonList(to));
        payload.put("subject", subject);
        // Resend prefers 'html' for better deliverability
        payload.put("html", "<div style='font-family: sans-serif;'>" + body.replace("\n", "<br>") + "</div>");
        payload.put("text", body);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            System.out.println("DEBUG: Sending email via Resend to: " + to);
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, request, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("SUCCESS: Email sent successfully via Resend. ID: " + response.getBody());
            }
        } catch (HttpStatusCodeException e) {
            String errorBody = e.getResponseBodyAsString();
            System.err.println("ERROR: Resend API failed: " + e.getStatusCode() + " - " + errorBody);
            throw new RuntimeException("Email delivery failed via Resend: " + errorBody);
        } catch (Exception e) {
            System.err.println("ERROR: Resend delivery failed: " + e.getMessage());
            throw new RuntimeException("Email delivery failed via Resend: " + e.getMessage());
        }
    }

    public void sendPasswordResetEmail(String to, String token) {
        String resetUrl = "https://medisync-vert-five.vercel.app/reset-password?token=" + token;
        String subject = "MediSync - Password Reset Request";
        String body = "You requested a password reset for your MediSync account.\n\n" +
                      "Please click the link below to set a new password. This link is valid for 30 minutes:\n\n" +
                      resetUrl + "\n\n" +
                      "If you did not request this, please ignore this email.";
        
        sendEmail(to, subject, body);
    }
}
