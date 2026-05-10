package com.health.medisync.service;

import com.health.medisync.model.ClinicalAiResponse;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;

@Service
public class MedicalSafetyValidator {

    public ClinicalAiResponse validate(ClinicalAiResponse response) {
        List<String> safetyFlags = response.getSafetyFlags() != null ? response.getSafetyFlags() : new ArrayList<>();

        // 1. Confidence Score Check
        if (response.getConfidenceScore() < 0.65) {
            safetyFlags.add("LOW_CONFIDENCE_WARNING: Reasoning engine uncertainty detected.");
            response.setClinicalAssessment("Initial Assessment (Pending further details): " + response.getClinicalAssessment());
            if (response.getFollowUpQuestions().isEmpty()) {
                response.getFollowUpQuestions().add("Could you provide more specific details about the onset of these symptoms?");
            }
        }

        // 2. Emergency Escalation Overrides
        boolean isEmergency = isEmergency(response);
        if (isEmergency) {
            response.setTriageLevel("CRITICAL");
            response.setRequiresAmbulance(true);
            response.setEmergencyWarning("URGENT: Life-threatening indicators detected. Proceed to the nearest Emergency Department immediately.");
            safetyFlags.add("EMERGENCY_ESCALATION: Automatic critical trigger.");
        }

        // 3. Hallucination / Dangerous Advice Check (Placeholder for more complex logic)
        // In a real system, we would cross-reference with a medical database
        
        response.setSafetyFlags(safetyFlags);
        return response;
    }

    private boolean isEmergency(ClinicalAiResponse response) {
        String assessment = response.getClinicalAssessment().toLowerCase();
        String warning = response.getEmergencyWarning() != null ? response.getEmergencyWarning().toLowerCase() : "";
        
        return assessment.contains("chest pain") || 
               assessment.contains("stroke") || 
               assessment.contains("heart attack") ||
               assessment.contains("unconscious") ||
               assessment.contains("severe bleeding") ||
               warning.contains("emergency") ||
               "CRITICAL".equals(response.getTriageLevel());
    }
}
