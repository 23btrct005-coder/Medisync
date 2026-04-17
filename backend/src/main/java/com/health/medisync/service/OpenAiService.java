package com.health.medisync.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class OpenAiService implements AiProvider {

    @Value("${openai.api.key:}")
    private String apiKey;

    @Override
    public String getProviderName() {
        return "OpenAI GPT-4o (Master Clinical Reasoning)";
    }

    @Override
    public String analyzeReport(byte[] fileData, String mimeType, String patientName, int patientAge) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return "OpenAI Analysis is disabled. Please configure `openai.api.key`.";
        }

        int retries = 0;
        int maxRetries = 3;

        while (retries <= maxRetries) {
            try {
                RestTemplate restTemplate = new RestTemplate();
                String url = "https://api.openai.com/v1/chat/completions";

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(apiKey);

                boolean isPdf = mimeType != null && mimeType.toLowerCase().contains("pdf");
                String extractedText = null;

                if (isPdf) {
                    try (PDDocument document = PDDocument.load(fileData)) {
                        PDFTextStripper pdfStripper = new PDFTextStripper();
                        extractedText = pdfStripper.getText(document);
                    }
                }

                // Construct GPT-4o Multi-modal payload
                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("model", "gpt-4o");

                List<Map<String, Object>> messages = new ArrayList<>();
                Map<String, Object> userMessage = new HashMap<>();
                userMessage.put("role", "user");

                List<Map<String, Object>> contentList = new ArrayList<>();
                
                // Text Instruction
                Map<String, Object> textPart = new HashMap<>();
                textPart.put("type", "text");
                textPart.put("text", "You are a world-class senior clinical diagnostic expert. Analyze this medical document for Name: " + patientName + ", Age: " + patientAge + ".\n" +
                    "CRITICAL SECURITY RULE: If the patient name in the document definitively belongs to a different person than '" + patientName + "', reply ONLY with 'ERROR_PROFILE_MISMATCH'.\n" +
                    "Otherwise, provide a HIGH-DENSITY CLINICAL BRIEF (max 3 professional sentences) for a doctor. Focus exactly on: 1) The primary medical problem. 2) What happened/Conclusion.\n\n" + 
                    (isPdf ? "PDF TEXT CONTENT:\n" + extractedText : ""));
                contentList.add(textPart);

                // Image data if not PDF (GPT-4o Vision)
                if (!isPdf) {
                    Map<String, Object> imagePart = new HashMap<>();
                    imagePart.put("type", "image_url");
                    Map<String, Object> imageUrl = new HashMap<>();
                    imageUrl.put("url", "data:" + mimeType + ";base64," + Base64.getEncoder().encodeToString(fileData));
                    imagePart.put("image_url", imageUrl);
                    contentList.add(imagePart);
                }

                userMessage.put("content", contentList);
                messages.add(userMessage);
                requestBody.put("messages", messages);

                HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
                ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
                Map<String, Object> responseBody = response.getBody();

                if (responseBody != null && responseBody.containsKey("choices")) {
                    List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                    if (!choices.isEmpty()) {
                        Map<String, Object> messageObj = (Map<String, Object>) choices.get(0).get("message");
                        if (messageObj != null && messageObj.containsKey("content")) {
                            return (String) messageObj.get("content");
                        }
                    }
                }

                return null; // Return null if response is unexpected to trigger failover
            } catch (org.springframework.web.client.HttpClientErrorException.TooManyRequests e) {
                retries++;
                if (retries <= maxRetries) {
                    try {
                        // Exponential backoff with jitter
                        long delay = (long) (Math.pow(2, retries) * 1000 + (Math.random() * 500));
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                } else {
                    // Signal failure for failover
                    return null;
                }
            } catch (Exception e) {
                e.printStackTrace();
                return null; // Return null on any error to allow failover
            }
        }
        return null;
    }
}
