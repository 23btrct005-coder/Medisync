package com.health.medisync.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.*;

@Service
public class GeminiStreamingService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-pro}")
    private String model;

    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GeminiStreamingService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public Flux<String> streamCompletion(String prompt) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return Flux.just("{\"error\": \"Gemini API key not configured.\"}");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":streamGenerateContent?key=" + apiKey;

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);

        Map<String, Object> content = new HashMap<>();
        content.put("parts", Collections.singletonList(textPart));

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", Collections.singletonList(content));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.7);
        generationConfig.put("maxOutputTokens", 2048);
        requestBody.put("generationConfig", generationConfig);

        return webClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToFlux(Map.class)
                .map(response -> {
                    try {
                        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                        if (candidates != null && !candidates.isEmpty()) {
                            Map<String, Object> contentObj = (Map<String, Object>) candidates.get(0).get("content");
                            if (contentObj != null) {
                                List<Map<String, Object>> parts = (List<Map<String, Object>>) contentObj.get("parts");
                                if (parts != null && !parts.isEmpty()) {
                                    return (String) parts.get(0).get("text");
                                }
                            }
                        }
                    } catch (Exception e) {
                        return "";
                    }
                    return "";
                });
    }
}
