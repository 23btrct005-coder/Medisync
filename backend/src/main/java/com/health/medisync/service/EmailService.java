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

    @Value("${mailtrap.token:}")
    private String apiToken;

    @Value("${mailtrap.from.email:}")
    private String fromEmail;

    @Value("${mailtrap.endpoint:https://send.api.mailtrap.io/api/send}")
    private String apiUrl;

    private final RestTemplate restTemplate;

    public EmailService() {
        this.restTemplate = new RestTemplate();
    }

    public void sendEmail(String to, String subject, String body) {
        // Redacted logging for security, but helps detect if token is missing
        String tokenHead = (apiToken != null && apiToken.length() >= 4) ? apiToken.substring(0, 4) : "[EMPTY]";
        System.out.println("DEBUG: Using Mailtrap endpoint: " + apiUrl);
        System.out.println("DEBUG: Using Mailtrap token starting with: " + tokenHead + "...");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiToken);

        // Building Mailtrap JSON structure:
        // {
        //   "from": {"email": "...", "name": "..."},
        //   "to": [{"email": "..."}],
        //   "subject": "...",
        //   "text": "..."
        // }
        Map<String, Object> payload = new HashMap<>();
        
        Map<String, String> fromMap = new HashMap<>();
        // Fallback for Sandbox mode if fromEmail is not set
        String senderEmail = (fromEmail != null && !fromEmail.trim().isEmpty()) ? fromEmail : "no-reply@medisync.com";
        fromMap.put("email", senderEmail);
        fromMap.put("name", "MediSync Portal");
        payload.put("from", fromMap);

        Map<String, String> toMap = new HashMap<>();
        toMap.put("email", to);
        payload.put("to", Collections.singletonList(toMap));

        payload.put("subject", subject);
        payload.put("text", body);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, request, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Mailtrap API failed with status: " + response.getStatusCode() + " - " + response.getBody());
            }
        } catch (HttpStatusCodeException e) {
            String errorBody = e.getResponseBodyAsString();
            System.err.println("ERROR: Mailtrap API validation failed: " + errorBody);
            throw new RuntimeException("Email delivery failed via Mailtrap API: " + e.getStatusCode() + " - " + errorBody);
        } catch (Exception e) {
            System.err.println("ERROR: Mailtrap delivery failed: " + e.getMessage());
            throw new RuntimeException("Email delivery failed via Mailtrap API: " + e.getMessage());
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
