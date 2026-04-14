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
        int maxRetries = 2;
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
                            return "Groq AI could not extract digital text from this PDF. This engine currently requires text-based PDFs. Please use an image or a text-based PDF.";
                        }
                    }
                }

                Map<String, Object> textObj = new HashMap<>();
                textObj.put("type", "text");
                textObj.put("text", "You are an expert senior medical consultant and radiologist. Examine the document for Name: " + patientName + ", Age: " + patientAge + ".\n" +
                    "SECURITY RULE: If the patient name in the document definitively belongs to a different person, reply ONLY with 'ERROR_PROFILE_MISMATCH'.\n" +
                    "Otherwise, provide a professional Markdown clinical analysis with sections for: 1) Verified Patient Bio, 2) Primary Impression, 3) Evidence Points, 4) Critical Normal/Abnormal metrics, 5) Recommended Follow-ups.\n\n" + (isPdf ? "DOCUMENT TEXT:\n" + extractedText : ""));

                List<Map<String, Object>> contentList = new ArrayList<>();
                contentList.add(textObj);

                if (!isPdf) {
                    String base64Data = Base64.getEncoder().encodeToString(fileData);
                    String dataUrl = "data:" + mimeType + ";base64," + base64Data;
                    Map<String, Object> imageUrlData = new HashMap<>();
                    imageUrlData.put("url", dataUrl);
                    Map<String, Object> imageObj = new HashMap<>();
                    imageObj.put("type", "image_url");
                    imageObj.put("image_url", imageUrlData);
                    contentList.add(imageObj);
                }

                Map<String, Object> message = new HashMap<>();
                message.put("role", "user");
                message.put("content", contentList);

                Map<String, Object> requestBody = new HashMap<>();
                // Llama 3.3 70B for text (extremely high accuracy), Llama 3.2 90B Vision for images
                requestBody.put("model", isPdf ? "llama-3.3-70b-versatile" : "llama-3.2-11b-vision-preview"); // Note: Using 11b-vision unless 90b is explicitly on your tier
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
                        long delay = (long) Math.pow(2, retries) * 1000;
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
