package com.health.medisync.model;

import java.util.List;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClinicalAiResponse {
    private String sessionId;
    private String intent;
    private String triageLevel; // LOW | MODERATE | HIGH | CRITICAL
    private double confidenceScore;
    private boolean requiresAmbulance;
    private String clinicalAssessment;
    private List<String> possibleConditions;
    private List<String> riskIndicators;
    private String recommendedSpecialist;
    private List<String> suggestedNextSteps;
    private List<String> followUpQuestions;
    private String emergencyWarning;
    private List<String> abnormalFindings;
    private List<String> medicationsMentioned;
    private List<String> recommendedTests;
    private List<String> careAdvice;
    private String explanation;
    private List<String> citations;
    private List<String> safetyFlags;
}
