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
                            return "{\"error\": \"Inconclusive Signal: No digital text found in PDF. Scanned documents are currently inconclusive via this engine.\"}";
                        }
                    }
                } else {
                    return "Groq AI current engine only supports text-based PDFs. Images are routed to the Reasoning Engine.";
                }

                Map<String, Object> textObj = new HashMap<>();
                textObj.put("type", "text");
                textObj.put("text", "You are an elite clinical reasoning AI. Your task is to extract a structured diagnostic briefing from a medical document.\n\n" +
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
                    "}\n\nDOCUMENT TEXT:\n" + extractedText);

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
    public String getCompletion(String prompt) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("YOUR_API_KEY_HERE")) {
            return "{\"error\": \"AI is disabled. Configure groq.api.key.\"}";
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "https://api.groq.com/openai/v1/chat/completions";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", "You are the MediSync Clinical Assistant. " +
                "STRICT FORMATTING RULE: NEVER use paragraphs. " +
                "EVERY response MUST be structured into sections with Markdown headers (### Topic). " +
                "EVERY point MUST be a bullet point (-). " +
                "NO introductory filler text like 'Hi there' in paragraph form.");

            Map<String, Object> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", prompt);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "llama-3.3-70b-versatile");
            requestBody.put("messages", Arrays.asList(systemMessage, userMessage));
            requestBody.put("temperature", 0.3); // Lower temperature for stricter formatting

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
            return "{\"error\": \"Parse error.\"}";
        } catch (Exception e) {
            return "{\"error\": \"" + e.getMessage() + "\"}";
        }
    }
}
