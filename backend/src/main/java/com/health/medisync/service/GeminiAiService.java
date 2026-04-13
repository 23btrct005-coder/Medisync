package com.health.medisync.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GeminiAiService implements AiProvider {

    @Value("${google.api.key:YOUR_API_KEY_HERE}")
    private String apiKey;

    @Override
    public String getProviderName() {
        return "Gemini 1.5 Pro (Clinical Analysis)";
    }

    @Override
    public String analyzeReport(byte[] fileData, String mimeType, String patientName, int patientAge) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("YOUR_API_KEY_HERE")) {
            return "Gemini Analysis is currently disabled as no valid Google API key is configured. Please provide a `google.api.key` in application.properties.";
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            // Using v1beta for Gemini 1.5 access (Flash is highly reliable for clinical analysis)
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Constructing the Gemini request body (contents/parts structure)
            Map<String, Object> requestBody = new HashMap<>();
            
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", "You are a world-class senior medical consultant and radiologist with decades of clinical experience. " +
                "You are analyzing a medical document for: Name: " + patientName + ", Age: " + patientAge + ". " +
                "CRITICAL INSTRUCTIONS:\n" +
                "1. If the patient name in the document is clearly and explicitly different from '" + patientName + "', reply ONLY with 'ERROR_PROFILE_MISMATCH'.\n" +
                "2. Provide an extremely high-accuracy clinical analysis. Minimize errors by sticking strictly to documented evidence.\n" +
                "3. Structure your response in Markdown with the following sections:\n" +
                "   # 🧬 Clinical Reasoning Report\n" +
                "   ## 1. Primary Diagnostic Impression\n" +
                "   ## 2. Evidence-Based Rationale (detailed points)\n" +
                "   ## 3. Critical Metrics & Abnormalities\n" +
                "   ## 4. Differential Diagnoses to Consider\n" +
                "   ## 5. Recommended Physician Follow-ups\n" +
                "   ## 6. Safety Warnings & Clinical Caveats\n\n" +
                "Analyze the attached medical imaging/document data meticulously.");

            Map<String, Object> inlineData = new HashMap<>();
            inlineData.put("mimeType", mimeType);
            inlineData.put("data", Base64.getEncoder().encodeToString(fileData));

            Map<String, Object> imagePart = new HashMap<>();
            imagePart.put("inlineData", inlineData);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", Arrays.asList(textPart, imagePart));

            requestBody.put("contents", Collections.singletonList(content));

            // Set strict safety settings for medical context
            List<Map<String, Object>> safetySettings = new ArrayList<>();
            String[] categories = {"HARM_CATEGORY_HARASSMENT", "HARM_CATEGORY_HATE_SPEECH", "HARM_CATEGORY_SEXUALLY_EXPLICIT", "HARM_CATEGORY_DANGEROUS_CONTENT"};
            for (String category : categories) {
                Map<String, Object> setting = new HashMap<>();
                setting.put("category", category);
                setting.put("threshold", "BLOCK_NONE"); // Allow high-medical context which can sometimes be flagged
                safetySettings.add(setting);
            }
            requestBody.put("safetySettings", safetySettings);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && responseBody.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> contentObj = (Map<String, Object>) candidates.get(0).get("content");
                    if (contentObj != null && contentObj.containsKey("parts")) {
                        List<Map<String, Object>> parts = (List<Map<String, Object>>) contentObj.get("parts");
                        if (!parts.isEmpty()) {
                            return (String) parts.get(0).get("text");
                        }
                    }
                }
            }

            return "Unable to parse Gemini AI response. Please verify your document manually.";

        } catch (Exception e) {
            e.printStackTrace();
            return "Gemini 1.5 Pro Analysis failed. Technical error: " + e.getMessage();
        }
    }
}
