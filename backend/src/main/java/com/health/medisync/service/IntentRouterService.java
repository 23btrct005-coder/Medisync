package com.health.medisync.service;

import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class IntentRouterService {

    public String classifyIntent(String query) {
        String q = query.toLowerCase();
        
        if (q.contains("ambulance") || q.contains("emergency") || q.contains("chest pain") || q.contains("bleeding")) {
            return "emergency_triage";
        }
        if (q.contains("medicine") || q.contains("pill") || q.contains("dosage") || q.contains("side effect")) {
            return "medication_question";
        }
        if (q.contains("report") || q.contains("test result") || q.contains("lab")) {
            return "report_analysis";
        }
        if (q.contains("book") || q.contains("appointment") || q.contains("schedule")) {
            return "appointment_booking";
        }
        if (q.contains("pregnant") || q.contains("pregnancy") || q.contains("baby")) {
            return "pregnancy_support";
        }
        if (q.contains("diet") || q.contains("nutrition") || q.contains("weight") || q.contains("food")) {
            return "nutrition_guidance";
        }
        
        return "symptom_checker";
    }

    public String getPromptTemplate(String intent) {
        Map<String, String> templates = new HashMap<>();
        
        templates.put("emergency_triage", "FOCUS: Immediate life-safety and stabilization. Prioritize ambulance coordination.");
        templates.put("medication_question", "FOCUS: Pharmacological safety, dosage accuracy, and interaction risks.");
        templates.put("report_analysis", "FOCUS: Clinical value interpretation, abnormal range identification, and follow-up tests.");
        templates.put("appointment_booking", "FOCUS: Locating the most appropriate specialist and institutional node for the triaged condition.");
        
        return templates.getOrDefault(intent, "FOCUS: General clinical assessment and triage.");
    }
}
