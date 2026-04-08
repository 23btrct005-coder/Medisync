package com.health.medisync.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GroqAiService {

    @Value("${groq.api.key:YOUR_API_KEY_HERE}")
    private String apiKey;

    public String analyzeReport(byte[] fileData, String mimeType, String patientName, int patientAge) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.equals("YOUR_API_KEY_HERE")) {
            return "AI Analysis is currently disabled as no valid Groq API key is configured. Please provide a `groq.api.key` in application.properties.";
        }

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
                        return "Groq AI could not extract any digital text from this PDF. This engine cannot parse purely scanned paper documents. Please upload an exported text-based PDF or a native image (JPEG/PNG).";
                    }
                }
            }

            // Construct payload dynamically based on PDF or Image
            Map<String, Object> textObj = new HashMap<>();
            textObj.put("type", "text");
            textObj.put("text", "You are an expert radiologist and medical analyst. First, examine the document to identify the patient name if it is available. " +
                "The intended target profile patient is: Name: " + patientName + ", Age: " + patientAge + ". " +
                "If there is a patient name explicitly stated in the document and it clearly DOES NOT MATCH the intended target patient name, you MUST reply EXACTLY with the string 'ERROR_PROFILE_MISMATCH' and nothing else. " +
                "Do not reject if the name is simply absent or abbreviated. Only reject if it clearly belongs to a different person. " +
                "Otherwise, return a structured Markdown summary of the available information. Include sections for: 1) Documented Patient Info, 2) Diagnosed disease / primary assumption, 3) Severity / Urgency, 4) Key abnormal metrics, 5) Suggested physician review points.\n\n" + (isPdf ? "DOCUMENT TEXT CONTENT:\n" + extractedText : ""));

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
            // If it is a PDF we extract text to the extremely fast language model. Otherwise vision.
            requestBody.put("model", isPdf ? "llama-3.1-8b-instant" : "meta-llama/llama-4-scout-17b-16e-instruct");
            requestBody.put("messages", Arrays.asList(message));
            requestBody.put("temperature", 0.2);

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

            return "Unable to parse Groq AI response. Please view the original document.";

        } catch (Exception e) {
            e.printStackTrace();
            return "Groq AI Analysis failed to process this document. Technical error: " + e.getMessage();
        }
    }
}
