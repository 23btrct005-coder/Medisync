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
                textPart.put("text", "You are an elite clinical reasoning AI. Your task is to extract a structured diagnostic briefing from a medical document.\n\n" +
                    "METADATA (MANDATORY: Use these for 'patient_info' and 'date' if not found in document):\n" +
                    "- System Patient Name: " + patientName + "\n" +
                    "- System Patient Age: " + patientAge + "\n" +
                    "- System Current Date: " + new java.util.Date().toString() + "\n\n" +
                    "STRICT EXTRACTION RULES:\n" +
                    "- Return ONLY valid JSON as per the schema below.\n" +
                    "- NO conversational text before or after the JSON.\n" +
                    "- If document text is unreadable or empty, set 'diagnosis' to 'INCONCLUSIVE_DATA_SIGNAL'.\n" +
                    "- For 'patient_info', you MUST use the provided METADATA if the actual name/age is not explicitly in the text.\n" +
                    "- For ANY field where no information is found, use null (do NOT use strings like 'Not Available' or 'N/A').\n" +
                    "- Keep bullet points short, high-density, and scannable.\n" +
                    "- Maximum 5 items per section.\n\n" +
                    "OUTPUT SCHEMA (JSON):\n" +
                    "{\n" +
                    "  \"patient_info\": {\"name\": null, \"age\": null, \"date\": null},\n" +
                    "  \"diagnosis\": null,\n" +
                    "  \"key_findings\": [],\n" +
                    "  \"critical_alerts\": [],\n" +
                    "  \"treatment\": [],\n" +
                    "  \"follow_up\": [],\n" +
                    "  \"additional_notes\": [],\n" +
                    "  \"confidence\": \"0%\"\n" +
                    "}\n\n" + 
                    (isPdf ? "DOCUMENT TEXT (PDF):\n" + extractedText : ""));
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
    @Override
    public String getCompletion(String prompt) {
        return getCompletion(prompt, null, null);
    }

    public String getCompletion(String prompt, String base64Image, String mimeType) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return "{\"error\": \"OpenAI is disabled. Configure `openai.api.key`.\"}";
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "https://api.openai.com/v1/chat/completions";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-4o");

            List<Map<String, Object>> messages = new ArrayList<>();
            Map<String, Object> userMessage = new HashMap<>();
            userMessage.put("role", "user");

            List<Map<String, Object>> contentList = new ArrayList<>();
            
            // Text Part
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("type", "text");
            textPart.put("text", prompt);
            contentList.add(textPart);

            // Image Part (if present)
            if (base64Image != null && mimeType != null) {
                Map<String, Object> imagePart = new HashMap<>();
                imagePart.put("type", "image_url");
                Map<String, Object> imageUrl = new HashMap<>();
                imageUrl.put("url", "data:" + mimeType + ";base64," + base64Image);
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
                    return (String) messageObj.get("content");
                }
            }
            return "{\"error\": \"Unexpected response format.\"}";
        } catch (Exception e) {
            return "{\"error\": \"" + e.getMessage() + "\"}";
        }
    }
}
