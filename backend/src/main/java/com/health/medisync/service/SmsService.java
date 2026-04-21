package com.health.medisync.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

@Service
public class SmsService {

    @Value("${textbee.api.key:}")
    private String apiKey;

    @Value("${textbee.device.id:}")
    private String deviceId;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Async
    public void sendSms(String toPhoneNumber, String content) {
        if (toPhoneNumber == null || toPhoneNumber.trim().isEmpty()) {
            return;
        }

        // Standardize phone number
        String cleanPhone = toPhoneNumber.replaceAll("[^0-9+]", "");
        if (!cleanPhone.startsWith("+")) {
            cleanPhone = "+" + cleanPhone;
        }

        if (apiKey == null || apiKey.isEmpty() || apiKey.contains("YOUR_")) {
            System.out.println("=================================================");
            System.out.println("[SMS MOCK MODE] To: " + cleanPhone);
            System.out.println("[SMS MOCK MODE] Content: " + content);
            System.out.println("[SMS MOCK MODE] Instruction: Paste your full TextBee API Key in application.properties to go live.");
            System.out.println("=================================================");
            return;
        }

        try {
            String url = "https://api.textbee.dev/api/v1/gateway/devices/" + deviceId + "/send-sms";
            
            Map<String, Object> bodyMap = Map.of(
                "recipients", List.of(cleanPhone),
                "message", content
            );
            String jsonBody = objectMapper.writeValueAsString(bodyMap);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("x-api-key", apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

            System.out.println("[SMS DISPATCH] Sending to TextBee Gateway: " + cleanPhone);
            
            httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                .thenApply(HttpResponse::body)
                .thenAccept(body -> System.out.println("[SMS DISPATCH] Response: " + body))
                .exceptionally(ex -> {
                    System.err.println("[SMS DISPATCH] Error: " + ex.getMessage());
                    return null;
                });

        } catch (Exception e) {
            System.err.println("[SMS DISPATCH] Fatal Error while preparing request: " + e.getMessage());
        }
    }
}
