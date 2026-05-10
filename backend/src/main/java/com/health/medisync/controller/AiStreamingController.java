package com.health.medisync.controller;

import com.health.medisync.service.AiService;
import com.health.medisync.service.GeminiStreamingService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiStreamingController {

    private final GeminiStreamingService geminiStreamingService;
    private final AiService aiService;

    public AiStreamingController(GeminiStreamingService geminiStreamingService, AiService aiService) {
        this.geminiStreamingService = geminiStreamingService;
        this.aiService = aiService;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamAiResponse(@RequestParam String query, @RequestParam(required = false) String email) {
        // For structured JSON streaming, we need the full context
        // This is a simplified version. In a full implementation, we would 
        // handle partial JSON accumulation and validation.
        
        // Construct the enterprise prompt
        String fullPrompt = "Respond in JSON for query: " + query; // Simplified for this implementation
        
        return geminiStreamingService.streamCompletion(fullPrompt);
    }
}
