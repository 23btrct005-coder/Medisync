package com.health.medisync.model;

import lombok.*;
import java.util.List;
import java.util.Map;

/**
 * Enterprise Clinical AI Response Contract (V2)
 * Designed for institutional reliability, schema versioning, and streaming assembly.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalAiResponseV2 {
    
    // Metadata & Protocol
    private String schemaVersion = "2.0.0";
    private String sessionId;
    private long timestamp = System.currentTimeMillis();
    private String provider; // Gemini | Groq | OpenAI
    private double latencyMs;
    
    // Core Clinical Intelligence
    private String intent; // EMERGENCY | TRIAGE | MEDICATION | REPORT | APPOINTMENT
    private String triageLevel; // CRITICAL | HIGH | MODERATE | ROUTINE
    private double confidenceScore;
    
    // Reasoning & Evidence
    private String clinicalAssessment;
    private String reasoningPath;
    private List<String> differentialDiagnoses;
    private List<String> riskIndicators;
    private List<Map<String, String>> evidenceCitations; // {source, url, confidence}
    
    // Safety & Governance
    private boolean requiresAmbulance;
    private String emergencyWarning;
    private List<String> safetyFlags;
    private boolean networkVerified; // Strict check against internal DB
    
    // Actionable Outcomes
    private String recommendedSpecialist;
    private String departmentId;
    private List<String> suggestedNextSteps;
    private List<String> followUpQuestions;
    
    // Streaming Status (Internal)
    private boolean isPartial = false;
    private int tokenCount;
    
    // Hallucination & Consistency Metrics
    private double hallucinationRisk;
    private boolean consistencyVerified;
}
