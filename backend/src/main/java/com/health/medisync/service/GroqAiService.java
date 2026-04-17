package com.health.medisync.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GroqAiService implements AiProvider {
    
    @Override
    public String getProviderName() {
        return "Groq AI (Fast Summary)";
    }

    @Value("${groq.api.key:YOUR_API_KEY_HERE}")
    private String apiKey;

    public String analyzeReport(byte[] fileData, String mimeType, String patientName, int patientAge) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("YOUR_API_KEY_HERE")) {
            return "AI Analysis is currently disabled as no valid Groq API key is configured. Please provide a `groq.api.key` in application.properties.";
        }

        int retries = 0;
        int maxRetries = 3;
        StringBuilder errorLog = new StringBuilder();

        while (retries <= maxRetries) {
            try {
                RestTemplate restTemplate = new RestTemplate();
                String url = "https://api.groq.com/openai/v1/chat/completions";

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(apiKey);

                boolean isPdf = mimeType != null && mimeType.toLowerCase().contains("pdf");
                String extractedText = null;

                if (isPdf) {
                    try (PDDocument document = PDDocument.load(fileData)) {
                        PDFTextStripper pdfStripper = new PDFTextStripper();
                        extractedText = pdfStripper.getText(document);
                        
                        if (extractedText == null || extractedText.trim().isEmpty()) {
                            return "Groq AI could not extract digital text from this PDF. Please use an image or a text-based PDF.";
                        }
                    }
                } else {
                    return "Groq AI current engine only supports text-based PDFs. Images are routed to the Reasoning Engine.";
                }

                Map<String, Object> textObj = new HashMap<>();
                textObj.put("type", "text");
                textObj.put("text", "You are an expert senior medical consultant. Examine the document for Name: " + patientName + ", Age: " + patientAge + ".\n" +
                    "SECURITY RULE: If the patient name in the document definitively belongs to a different person, reply ONLY with 'ERROR_PROFILE_MISMATCH'.\n" +
                    "Otherwise, provide a HIGH-DENSITY BRIEF summary (max 3 sentences) for a doctor. Focus exactly on: 1) The primary medical problem. 2) What happened/Conclusion.\n\nDOCUMENT TEXT:\n" + extractedText);

                List<Map<String, Object>> contentList = new ArrayList<>();
                contentList.add(textObj);

                Map<String, Object> message = new HashMap<>();
                message.put("role", "user");
                message.put("content", contentList);

                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("model", "llama-3.3-70b-versatile");
                requestBody.put("messages", Arrays.asList(message));
                requestBody.put("temperature", 0.1);

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
                return "Unable to parse Groq AI response.";

            } catch (org.springframework.web.client.HttpClientErrorException.TooManyRequests e) {
                retries++;
                if (retries <= maxRetries) {
                    try {
                        // Exponential backoff with randomized jitter
                        long delay = (long) (Math.pow(2, retries) * 1000 + (Math.random() * 500));
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                } else {
                    return "Groq AI is currently under high load (429 Rate Limit). Please try again in 1-2 minutes.";
                }
            } catch (Exception e) {
                e.printStackTrace();
                return "Groq AI Analysis failed. Technical error: " + e.getMessage();
            }
        }
        return "Groq AI Analysis failed due to persistent service issues.";
    }
}
