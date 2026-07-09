package com.health.medisync.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GeminiAiService implements AiProvider {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-pro}")
    private String model;

    @Override
    public String getProviderName() {
        return "Google Gemini (Advanced Reasoning)";
    }

    @Override
    public String analyzeReport(byte[] fileData, String mimeType, String patientName, int patientAge) {
        String prompt = "### SYSTEM INSTRUCTION: ELITE CLINICAL DIAGNOSTICIAN\n" +
                        "You are a Board-Certified Physician specializing in Medical Report Analysis.\n" +
                        "Task: Analyze the following medical document metadata and provide a high-precision clinical briefing.\n\n" +
                        "Patient: " + patientName + " (Age: " + patientAge + ")\n" +
                        "Document MIME: " + mimeType + "\n\n" +
                        "### GUIDELINES:\n" +
                        "1. **STRICT PROFESSIONALISM**: Use precise clinical terminology (e.g., 'Etiology', 'Prognosis').\n" +
                        "2. **RISK ASSESSMENT**: Identify potential 'Red Flags' or 'High Risk' indicators.\n" +
                        "3. **ACTIONABLE STEPS**: Suggest the next clinical intervention (e.g., 'Consult Cardiologist', 'Repeat Serum Test').\n" +
                        "4. **ZERO-PARAGRAPH POLICY**: Use headers and bullets only.\n\n" +
                        "Please provide the briefing based on the provided metadata and simulated diagnostic patterns.";
        return getCompletion(prompt);
    }

    public String getCompletion(String prompt) {
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);
        return getCompletion(Collections.singletonList(textPart));
    }

    public String getCompletion(String prompt, String base64Image) {
        List<Map<String, Object>> parts = new ArrayList<>();
        
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);
        parts.add(textPart);

        if (base64Image != null && base64Image.contains(",")) {
            String[] partsArr = base64Image.split(",");
            String mimeType = partsArr[0].split(":")[1].split(";")[0];
            String data = partsArr[1];

            Map<String, Object> inlineData = new HashMap<>();
            inlineData.put("mime_type", mimeType);
            inlineData.put("data", data);

            Map<String, Object> imagePart = new HashMap<>();
            imagePart.put("inline_data", inlineData);
            parts.add(imagePart);
        }

        return getCompletion(parts);
    }

    public String getCompletion(List<Map<String, Object>> parts) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            System.err.println("GEMINI_KEY_FAILURE: Institutional API key is missing from environment.");
            return "{\"error\": \"Gemini API key not configured.\"}";
        }
        
        System.out.println("GEMINI_NODE_ACTIVE: Initializing clinical sync with key prefix [" + apiKey.substring(0, Math.min(4, apiKey.length())) + "...]");

        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", parts);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(content));

            // Optional: Safety settings and generation config
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("temperature", 0.7);
            generationConfig.put("topK", 40);
            generationConfig.put("topP", 0.95);
            generationConfig.put("maxOutputTokens", 2048);
            requestBody.put("generationConfig", generationConfig);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> firstCandidate = candidates.get(0);
                    Map<String, Object> contentObj = (Map<String, Object>) firstCandidate.get("content");
                    if (contentObj != null) {
                        List<Map<String, Object>> resParts = (List<Map<String, Object>>) contentObj.get("parts");
                        if (resParts != null && !resParts.isEmpty()) {
                            return (String) resParts.get(0).get("text");
                        }
                    }
                }
            }
            return "{\"error\": \"Empty response from Gemini.\"}";
        } catch (Exception e) {
            System.err.println("GEMINI_ERROR: " + e.getMessage());
            try {
                RestTemplate restTemplate = new RestTemplate();
                String listUrl = "https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey;
                ResponseEntity<String> modelsResponse = restTemplate.getForEntity(listUrl, String.class);
                return "{\"error\": \"Model failed. Available models: " + modelsResponse.getBody().replace("\"", "'").replace("\n", " ") + "\"}";
            } catch (Exception ex) {
                return "{\"error\": \"" + e.getMessage() + " (Failed to fetch models: " + ex.getMessage() + ")\"}";
            }
        }
    }
}
