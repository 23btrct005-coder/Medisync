package com.health.medisync.controller;

import com.health.medisync.service.*;
import com.health.medisync.model.ClinicalAiResponseV2;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.Flux;
import java.util.Map;

/**
 * Enterprise AI Streaming Gateway
 * Provides high-throughput, low-latency ( <500ms TTFT) clinical reasoning streams.
 */
@RestController
@RequestMapping("/api/ai/v2")
public class EnterpriseAiStreamingController {

    private static final Logger logger = LoggerFactory.getLogger(EnterpriseAiStreamingController.class);
    private final GeminiStreamingService geminiStreamingService;
    private final JsonRepairService jsonRepair;
    private final MedicalGuardrailEngine guardrails;
    private final ClinicalMemoryEngine memory;
    private final InternalNetworkGuard networkGuard;

    public EnterpriseAiStreamingController(
            GeminiStreamingService geminiStreamingService,
            JsonRepairService jsonRepair,
            MedicalGuardrailEngine guardrails,
            ClinicalMemoryEngine memory,
            InternalNetworkGuard networkGuard) {
        this.geminiStreamingService = geminiStreamingService;
        this.jsonRepair = jsonRepair;
        this.guardrails = guardrails;
        this.memory = memory;
        this.networkGuard = networkGuard;
    }

    @GetMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamClinicalReasoning(@RequestParam String query, @RequestParam String sessionId) {
        logger.info("ENTERPRISE_STREAM_START: SessionID={}, Query='{}'", sessionId, query);
        
        // 1. Retrieve Context from Redis
        var history = memory.getHistory(sessionId);
        var state = memory.getMedicalState(sessionId);
        var networkContext = networkGuard.getGroundingContext();

        logger.debug("CONTEXT_RETRIEVED: HistorySize={}, StateKeys={}", history.size(), state.keySet());

        // 2. Assemble Master Prompt
        String masterPrompt = "SYSTEM: You are the MediSync Enterprise Copilot. " +
                "Ground all responses in the provided INSTITUTIONAL NETWORK. " +
                "Respond ONLY in valid JSON. " +
                networkContext + "\n" +
                "Session State: " + state + "\n" +
                "Query: " + query;

        // 3. Initiate Stream
        return geminiStreamingService.streamCompletion(masterPrompt)
                .map(token -> {
                    // 4. Progressive Hydration (Repair partial JSON chunks)
                    return jsonRepair.repair(token);
                })
                .doOnNext(chunk -> logger.trace("STREAM_CHUNK: SessionID={}, Size={}", sessionId, chunk.length()))
                .doOnComplete(() -> {
                    logger.info("ENTERPRISE_STREAM_COMPLETE: SessionID={}", sessionId);
                    // 5. Finalize Session Memory
                    memory.storeMessage(sessionId, "user", query);
                })
                .doOnError(e -> logger.error("ENTERPRISE_STREAM_ERROR: SessionID={}, Error={}", sessionId, e.getMessage()));
    }
}
