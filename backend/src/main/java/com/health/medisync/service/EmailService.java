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
        this.restTemplate = new RestTemplate();
    }

    public void sendEmail(String to, String subject, String body) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            System.err.println("ERROR: Brevo API Key is missing!");
            return;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey.trim());
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

        // Building Brevo JSON structure (SMTP API v3)
        Map<String, Object> payload = new HashMap<>();
        
        Map<String, String> sender = new HashMap<>();
        sender.put("name", "MediSync Portal");
        sender.put("email", senderEmail);
        payload.put("sender", sender);

        Map<String, String> recipient = new HashMap<>();
        recipient.put("email", to);
        payload.put("to", Collections.singletonList(recipient));

        payload.put("subject", subject);
        // Brevo uses 'htmlContent' for HTML emails
        payload.put("htmlContent", "<div style='font-family: sans-serif;'>" + body.replace("\n", "<br>") + "</div>");
        payload.put("textContent", body);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            System.out.println("DEBUG: Sending email via Brevo to: " + to);
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, request, String.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("SUCCESS: Email sent via Brevo. Response: " + response.getBody());
            }
        } catch (HttpStatusCodeException e) {
            String errorBody = e.getResponseBodyAsString();
            System.err.println("ERROR: Brevo API failed: " + e.getStatusCode() + " - " + errorBody);
            throw new RuntimeException("Email delivery failed via Brevo: " + errorBody);
        } catch (Exception e) {
            System.err.println("ERROR: Brevo delivery failed: " + e.getMessage());
            throw new RuntimeException("Email delivery failed via Brevo: " + e.getMessage());
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
