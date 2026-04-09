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
        // Redacted logging for security
        String cleanToken = (apiToken != null) ? apiToken.trim() : "";
        String tokenHead = (cleanToken.length() >= 4) ? cleanToken.substring(0, 4) : "[EMPTY]";
        String tokenTail = (cleanToken.length() >= 4) ? cleanToken.substring(cleanToken.length() - 4) : "";
        
        // Sanitize URL (remove spaces, quotes, and trailing slashes)
        String cleanUrl = apiUrl.trim().replace("\"", "").replace("'", "");
        if (cleanUrl.endsWith("/")) {
            cleanUrl = cleanUrl.substring(0, cleanUrl.length() - 1);
        }
        
        System.out.println("DEBUG: Using Mailtrap endpoint: " + cleanUrl);
        System.out.println("DEBUG: Token Check - Length: " + cleanToken.length() + ", Start: " + tokenHead + "..., End: ..." + tokenTail);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("application", "json", java.nio.charset.StandardCharsets.UTF_8));
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        
        // Use Api-Token for Sandbox, Bearer for Production
        if (cleanUrl.contains("sandbox")) {
            headers.set("Api-Token", cleanToken);
        } else {
            headers.setBearerAuth(cleanToken);
        }
        headers.set("User-Agent", "MediSync-Backend/1.0");

        // Building Mailtrap JSON structure:
        // {
        //   "from": {"email": "...", "name": "..."},
        //   "to": [{"email": "..."}],
        //   "subject": "...",
        //   "text": "..."
        // }
        Map<String, Object> payload = new HashMap<>();
        
        String senderEmail = (fromEmail != null && !fromEmail.trim().isEmpty()) ? fromEmail : "no-reply@medisync.com";
        
        Map<String, String> fromMap = new HashMap<>();
        fromMap.put("email", senderEmail);
        payload.put("from", fromMap);

        Map<String, String> toMap = new HashMap<>();
        toMap.put("email", to);
        payload.put("to", Collections.singletonList(toMap));

        payload.put("subject", subject);
        payload.put("text", body);
        // Added category to help Mailtrap categorize the sandbox email
        payload.put("category", "Integration Test");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        System.out.println("DEBUG: JSON Payload being sent: " + payload.toString());

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(cleanUrl, request, String.class);
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
