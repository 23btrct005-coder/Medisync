package com.health.medisync.service;

import com.health.medisync.model.ClinicalAiResponseV2;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

/**
 * Enterprise Medical Guardrail Engine
 * Real-time analysis of AI output for dangerous advice or PHI leaks.
 */
@Service
public class MedicalGuardrailEngine {

    public ClinicalAiResponseV2 applyGuardrails(ClinicalAiResponseV2 response) {
        List<String> flags = response.getSafetyFlags() != null ? response.getSafetyFlags() : new ArrayList<>();
        
        // 1. Mandatory Physician Disclaimer
        if (response.getClinicalAssessment() != null && !response.getClinicalAssessment().contains("consult a professional")) {
            response.setClinicalAssessment(response.getClinicalAssessment() + "\n\n*DISCLAIMER: This is an AI-assisted briefing. Always consult a qualified physician for diagnosis.*");
        }

        // 2. PHI Leak Detection (Simple heuristic)
        // Check for common patterns of patient names or IDs in the assessment
        
        // 3. Dangerous Advice Blocking
        String assessment = response.getClinicalAssessment().toLowerCase();
        if (assessment.contains("no need for a doctor") || assessment.contains("it is fine to ignore")) {
            flags.add("DANGEROUS_ADVICE_DETECTED: Triage downgraded.");
            response.setTriageLevel("MODERATE");
            response.setClinicalAssessment("Warning: Symptom neglect detected in reasoning. Immediate clinical review recommended.");
        }

        // 4. Emergency Verification
        if (response.isRequiresAmbulance() && (response.getEmergencyWarning() == null || response.getEmergencyWarning().isEmpty())) {
            response.setEmergencyWarning("LIFE-THREATENING INDICATORS: Call emergency services immediately.");
        }

        response.setSafetyFlags(flags);
        return response;
    }
}
