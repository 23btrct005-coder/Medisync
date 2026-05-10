package com.health.medisync.service;

import com.health.medisync.model.ClinicalAiResponseV2;
import com.health.medisync.repository.*;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.*;

/**
 * World-Class Enterprise Clinical AI Orchestrator (V2)
 * The 'Central Nervous System' of the MediSync Clinical Operating System.
 */
@Service
public class AiService {

    private static final Logger logger = LoggerFactory.getLogger(AiService.class);
    private final IntentOrchestrator intentOrchestrator;
    private final ClinicalMemoryEngine memoryEngine;
    private final InternalNetworkGuard networkGuard;
    private final MedicalKnowledgeEngine knowledgeEngine;
    private final GeminiAiService geminiProvider;
    private final JsonRepairService jsonRepair;

    public AiService(
            IntentOrchestrator intentOrchestrator,
            ClinicalMemoryEngine memoryEngine,
            InternalNetworkGuard networkGuard,
            MedicalKnowledgeEngine knowledgeEngine,
            GeminiAiService geminiProvider,
            JsonRepairService jsonRepair) {
        this.intentOrchestrator = intentOrchestrator;
        this.memoryEngine = memoryEngine;
        this.networkGuard = networkGuard;
        this.knowledgeEngine = knowledgeEngine;
        this.geminiProvider = geminiProvider;
        this.jsonRepair = jsonRepair;
    }

    public ClinicalAiResponseV2 processEnterpriseQuery(String query, String sessionId) {
        logger.info("PROCESSING_ENTERPRISE_QUERY: SessionID={}, Query='{}'", sessionId, query);
        long startTime = System.currentTimeMillis();

        // 1. Contextual Retrieval (Redis + RAG)
        var medicalHistory = memoryEngine.getHistory(sessionId);
        var clinicalState = memoryEngine.getMedicalState(sessionId);
        var evidence = knowledgeEngine.retrieveGuidelines(query);
        
        logger.debug("CONTEXT_LOADED: HistorySize={}, EvidenceFound={}", medicalHistory.size(), evidence.size());

        // 2. Institutional Grounding (Internal Network Only)
        var networkContext = networkGuard.getGroundingContext();

        // 3. Prompt Orchestration (Multi-Agent Routing)
        String masterPrompt = intentOrchestrator.orchestratePrompt(query, clinicalState, networkContext);
        String evidenceContext = knowledgeEngine.buildEvidenceContext(evidence);
        
        String finalPrompt = masterPrompt + "\n" + evidenceContext + "\n" +
                "### PREVIOUS HISTORY:\n" + medicalHistory;

        // 4. Provider Execution (Gemini Pro V1.5)
        logger.debug("CALLING_AI_PROVIDER: SessionID={}", sessionId);
        String rawResponse = geminiProvider.getCompletion(finalPrompt);
        
        // 5. Response Hardening (JSON Repair + Schema Enforcement)
        String repairedJson = jsonRepair.extractJsonFromMarkdown(rawResponse);
        
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            ClinicalAiResponseV2 response = mapper.readValue(repairedJson, ClinicalAiResponseV2.class);
            
            // 6. Safety & Verification (Guardrails + Network Enforcer)
            response.setEvidenceCitations(evidence);
            response.setLatencyMs(System.currentTimeMillis() - startTime);
            response.setSessionId(sessionId);
            
            // Apply Final Institutional Safety Layer
            ClinicalAiResponseV2 finalized = intentOrchestrator.postProcess(response);
            
            logger.info("QUERY_COMPLETED: SessionID={}, Latency={}ms, Triage={}", sessionId, response.getLatencyMs(), response.getTriageLevel());

            // 7. Memory Persistence
            memoryEngine.storeMessage(sessionId, "user", query);
            memoryEngine.storeMessage(sessionId, "assistant", repairedJson);
            
            return finalized;
        } catch (Exception e) {
            logger.error("QUERY_ORCHESTRATION_FAILED: SessionID={}, Error={}", sessionId, e.getMessage());
            return ClinicalAiResponseV2.builder()
                .clinicalAssessment("The reasoning engine encountered a protocol error. Retrying institutional verification...")
                .triageLevel("ROUTINE")
                .build();
        }
    }
}
