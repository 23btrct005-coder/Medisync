package com.health.medisync.service;

import com.health.medisync.model.ClinicalAiResponseV2;
import org.springframework.stereotype.Service;
import java.util.*;

/**
 * Enterprise Multi-Agent Intent Orchestrator
 * Routes queries to specialized agents and chains reasoning paths.
 */
@Service
public class IntentOrchestrator {

    private final IntentRouterService router;
    private final InternalNetworkGuard networkGuard;
    private final MedicalGuardrailEngine guardrails;

    public IntentOrchestrator(IntentRouterService router, InternalNetworkGuard networkGuard, MedicalGuardrailEngine guardrails) {
        this.router = router;
        this.networkGuard = networkGuard;
        this.guardrails = guardrails;
    }

    public String orchestratePrompt(String query, Map<String, Object> state, String networkContext) {
        String intent = router.classifyIntent(query);
        
        StringBuilder prompt = new StringBuilder();
        prompt.append("### MASTER ORCHESTRATOR ROLE: CLINICAL_OS_V2\n");
        prompt.append("Current Intent: ").append(intent).append("\n");
        
        // 1. Dynamic Agent Personalization
        switch (intent) {
            case "EMERGENCY":
                prompt.append("AGENT: TRAUMA_SPECIALIST. Prioritize stabilization and Red-Flag identification.\n");
                break;
            case "MEDICATION":
                prompt.append("AGENT: PHARMACOLOGIST. Analyze drug interactions and dosage safety.\n");
                break;
            case "REPORT_ANALYSIS":
                prompt.append("AGENT: RADIOLOGIST/PATHOLOGIST. Extract clinical findings from raw telemetry.\n");
                break;
            default:
                prompt.append("AGENT: GENERAL_PRACTITIONER. Provide high-fidelity triage.\n");
        }

        // 2. Context Injection
        prompt.append("\n### INSTITUTIONAL CONTEXT:\n").append(networkContext);
        prompt.append("\n### PATIENT STATE:\n").append(state);
        
        // 3. Strict Contract Enforcement
        prompt.append("\n### RESPONSE_PROTOCOL:\n");
        prompt.append("Return ONLY a JSON object matching ClinicalAiResponseV2 schema.\n");
        prompt.append("Fields: [clinicalAssessment, triageLevel, reasoningPath, networkVerified, evidenceCitations].\n");
        
        return prompt.toString();
    }

    public ClinicalAiResponseV2 postProcess(ClinicalAiResponseV2 response) {
        // Apply guardrails and institutional verification
        return guardrails.applyGuardrails(response);
    }
}
