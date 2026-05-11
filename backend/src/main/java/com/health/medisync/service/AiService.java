package com.health.medisync.service;

import com.health.medisync.repository.HospitalRepository;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.PatientRepository;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class AiService {
    private final GeminiAiService geminiAiService;
    private final OpenAiService openAiService;
    private final GroqAiService groqAiService;
    private final HospitalRepository hospitalRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;

    public AiService(GeminiAiService geminiAiService, OpenAiService openAiService, GroqAiService groqAiService,
                     HospitalRepository hospitalRepository, DoctorRepository doctorRepository, PatientRepository patientRepository) {
        this.geminiAiService = geminiAiService;
        this.openAiService = openAiService;
        this.groqAiService = groqAiService;
        this.hospitalRepository = hospitalRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
    }

    public String generateResponse(String email, String query, String imageData, String location, String history) {
        System.out.println("ORCHESTRATOR_ACTIVE: Processing query for [" + email + "]");
        String profile = patientRepository.findByUserUsernameIgnoreCase(email).map(p -> 
            "Name: " + p.getName() + ", Age: " + p.getAge() + ", Allergies: " + p.getAllergies() + ", Medical Info: " + p.getMedicalInfo()
        ).orElse("Unknown Patient");

        StringBuilder hospitalSb = new StringBuilder();
        hospitalRepository.findAll().stream().limit(5).forEach(h -> 
            hospitalSb.append(h.getName()).append(" (").append(h.getLocation()).append("), ")
        );
        String hospitals = hospitalSb.toString();

        StringBuilder doctorSb = new StringBuilder();
        doctorRepository.findAll().stream().limit(5).forEach(d -> 
            doctorSb.append("Dr. ").append(d.getName()).append(" (").append(d.getSpecialization()).append("), ")
        );
        String doctors = doctorSb.toString();

        // Multi-Agent Orchestration Loop
        String response = executeNeuralOrchestration(query, imageData, history, location, hospitals, doctors, profile);
        
        if (response == null || isError(response)) {
            System.out.println("ORCHESTRATOR_FAILOVER: Engaging Local Expert Agent.");
            return executeLocalExpertAgent(query, imageData != null, history);
        }
        return response;
    }

    private boolean isError(String res) {
        if (res == null || res.length() < 30) return true;
        String lower = res.toLowerCase();
        // Only trigger error if it looks like a JSON error or a system failure message
        return (lower.contains("\"error\"") && lower.contains("{")) || 
               (lower.contains("failed") && lower.contains("api")) ||
               lower.contains("api key not configured");
    }

    private String executeNeuralOrchestration(String query, String imageData, String history, String location, String hospitals, String doctors, String profile) {
        String prompt = "### MEDISYNC MULTI-AGENT ORCHESTRATOR — ELITE CLINICAL MODE\n\n" +
                "OBJECTIVE: You are the Lead Orchestrator for the MediSync Copilot. You are a Board-Certified Emergency Physician and Institutional Expert.\n\n" +
                "### EMERGENCY VS. REGISTRY DISCERNMENT:\n" +
                "- SYMPTOMS (Chest pain, Heart attack, trauma, Stroke, Pregnancy bleeding): IMMEDIATELY prioritize CRITICAL triage and map to Emergency/Cardiology/OBGYN.\n" +
                "- INQUIRIES (Heart specialist, Best doctor, How to book): Prioritize LOW triage and map to specific specialist booking without emergency escalation.\n\n" +
                "### COMMUNICATION PROTOCOLS:\n" +
                "- Tone: Elite, calm, professional. Use high-fidelity clinical terms only for actual clinical situations.\n" +
                "- NO INTERNAL DISCLOSURE: Never mention models, nodes, or technical states.\n\n" +
                "### PORTAL NAVIGATOR:\n" +
                "- Booking: '/dashboard/booking' | Reports: '/dashboard/reports'\n\n" +
                "### 8-HEADER CLINICAL PROTOCOL:\n" +
                "1. Copilot Assessment: [Primary reasoning & board-certified clinical empathy]\n" +
                "2. Possible Conditions / Features: [Differential diagnosis OR portal features]\n" +
                "3. Risk Indicators / Instructions: [Clinical red flags OR operational steps]\n" +
                "4. Triage Level: [LOW | MODERATE | HIGH | CRITICAL]\n" +
                "5. Recommended Specialist: [Specific department AND specialist type]\n" +
                "6. Suggested Next Steps: [Actionable advice with MediSync routes]\n" +
                "7. Follow-up Questions: [Refining the assessment]\n" +
                "8. Emergency Warning: [Safety info OR institutional pro-tip]\n\n" +
                "### CONTEXT:\n" +
                "REGISTRY:\n" + hospitals + "\n" + doctors + "\n" +
                "PATIENT PROFILE: " + profile + "\n" +
                "LOCATION: " + location + "\n" +
                "CHAT HISTORY: " + history + "\n\n" +
                "### USER QUERY: " + query;

        String response = null;
        try {
            System.out.println("AI_NODE_TRY: Primary Agent (Gemini 1.5 Flash)");
            response = geminiAiService.getCompletion(prompt, imageData);
            if (response != null && !isError(response)) return response;

            System.out.println("AI_NODE_TRY: Secondary Agent (GPT-4o)");
            response = openAiService.getCompletion(prompt);
            if (response != null && !isError(response)) return response;

            System.out.println("AI_NODE_TRY: Tertiary Agent (Groq)");
            response = groqAiService.getCompletion(prompt);
        } catch (Exception e) {
            System.err.println("ORCHESTRATION_EXCEPTION: " + e.getMessage());
            response = null;
        }

        return response;
    }

    private String executeLocalExpertAgent(String query, boolean hasImage, String history) {
        String q = query.toLowerCase();
        String assessment = "I am your MediSync Copilot. Based on the clinical signals in your query, I have analyzed your situation against our institutional safety registry. ";
        String severity = "MODERATE";
        String specialist = "General Physician";
        String action = "A professional clinical evaluation at your nearest MediSync node is recommended for a definitive diagnosis.";
        String service = "General Clinical";
        String conditions = "Initial symptoms require physical examination for precise correlation.";
        String instructions = "Please monitor for any changes in symptom intensity or the development of new indicators.";
        String warning = "";

        // Memory-Aware Safety: Check history for critical alerts
        String safetyPrefix = "";
        String fullContext = (history + " " + q).toLowerCase();
        if (fullContext.contains("allergy") || fullContext.contains("allergic") || fullContext.contains("penicillin")) {
            safetyPrefix = "IMPORTANT: I have noted your previously mentioned allergy from our clinical history. ";
        }

        // --- CRITICAL EMERGENCY NODES (PRIORITY 1) ---
        if (q.contains("sting") || q.contains("hives") || (q.contains("throat") && q.contains("tight")) || q.contains("anaphylax")) {
            assessment = safetyPrefix + "Your symptoms suggest a potential acute systemic allergic reaction (Anaphylaxis). This is a life-threatening medical emergency.";
            severity = "CRITICAL";
            specialist = "Allergist / Emergency Specialist";
            action = "Navigate IMMEDIATELY to the nearest Emergency department or call Ambulance services.";
            service = "Emergency & Trauma Care";
            conditions = "Potential anaphylactic shock or severe systemic allergic response.";
            instructions = "If you have an Epipen, use it immediately as directed while waiting for help.";
            warning = "ANAPHYLAXIS ALERT: SEEK IMMEDIATE CARE.";
        } else if ((q.contains("child") || q.contains("year old") || q.contains("baby") || q.contains("son") || q.contains("daughter")) && 
                  (q.contains("breath") || q.contains("whistling") || q.contains("ribs") || q.contains("sucking") || q.contains("stridor"))) {
            assessment = safetyPrefix + "I've detected signals of pediatric respiratory distress (retractions/stridor). This requires immediate clinical evaluation to ensure airway stability.";
            severity = "CRITICAL";
            specialist = "Pediatric Emergency Specialist";
            action = "Navigate IMMEDIATELY to the nearest Pediatric Emergency node. Do not delay.";
            service = "Emergency & Trauma Care";
            conditions = "Acute pediatric respiratory distress protocol initiated.";
            instructions = "Keep the child upright and calm. Do not attempt to look down their throat.";
            warning = "PEDIATRIC EMERGENCY: SEEK IMMEDIATE EVALUATION.";
        } else if (q.contains("diabetes") || q.contains("thirsty") || q.contains("blurry") || q.contains("sugar") || q.contains("insulin") || q.contains("glucose")) {
            assessment = safetyPrefix + "Your symptoms suggest a potential glycemic crisis (Hyperglycemia). Rapid stabilization is required to prevent systemic complications.";
            severity = "HIGH";
            specialist = "Endocrinologist / Diabetologist";
            action = "Seek evaluation at an Urgent Care or Emergency node for blood sugar stabilization.";
            service = "Emergency & Trauma Care";
            conditions = "Potential diabetic urgency/Hyperglycemic state identified.";
            instructions = "Monitor your blood glucose levels if you have a meter available.";
            warning = "GLYCEMIC ALERT: EVALUATION RECOMMENDED.";
        } else if (q.contains("weak") || q.contains("speech") || q.contains("droop") || q.contains("numb") || q.contains("vision loss") || q.contains("double vision") || q.contains("stroke")) {
            assessment = safetyPrefix + "I've detected acute neurological signals consistent with a potential stroke protocol. Immediate intervention is required.";
            severity = "CRITICAL";
            specialist = "Neurologist / Stroke Specialist";
            action = "Navigate IMMEDIATELY to the nearest Comprehensive Stroke Center or Emergency Trauma node.";
            service = "Emergency & Trauma Care";
            conditions = "Acute neurological deficit or cerebrovascular signal identified.";
            instructions = "Note the exact time symptoms started for the emergency team.";
            warning = "NEUROLOGICAL EMERGENCY DETECTED: SEEK IMMEDIATE CARE.";
        } else if (q.contains("pregnant") || q.contains("weeks") || q.contains("spotting") || q.contains("contraction")) {
            assessment = safetyPrefix + "Your report of potential complications during pregnancy requires an immediate obstetric evaluation.";
            severity = "CRITICAL";
            specialist = "Obstetrician / Gynecologist";
            action = "Contact your primary OB-GYN immediately or proceed to Labor & Delivery triage.";
            service = "Emergency & Trauma Care";
            conditions = "Potential obstetric emergency or high-risk maternal health signal.";
            instructions = "Monitor for any increase in bleeding or abdominal pain.";
            warning = "OBSTETRIC ALERT: SEEK IMMEDIATE EVALUATION.";
        } else if (q.contains("dark thoughts") || q.contains("overwhelmed") || q.contains("suicide") || q.contains("self harm")) {
            assessment = safetyPrefix + "I've prioritized your report of severe psychological distress. MediSync offers immediate crisis support.";
            severity = "CRITICAL";
            specialist = "Psychiatrist / Crisis Counselor";
            action = "Connect immediately with our Mental Health Support node.";
            service = "Emergency & Trauma Care";
            conditions = "Severe psychological distress protocol.";
            instructions = "Please do not remain alone. Reach out to a support contact immediately.";
            warning = "CRISIS SIGNAL DETECTED: PLEASE SEEK IMMEDIATE SUPPORT.";
        } else if ((q.contains("heart") || q.contains("chest") || q.contains("breathing")) && (q.contains("pain") || q.contains("sharp") || q.contains("attack"))) {
            assessment = safetyPrefix + "Potential acute cardiovascular or respiratory signal identified.";
            severity = "CRITICAL";
            specialist = "Cardiologist / Emergency Specialist";
            action = "Locate and navigate to the nearest Emergency & Trauma Care node immediately.";
            service = "Emergency & Trauma Care";
            conditions = "Acute life-safety cardiovascular signal protocol.";
            instructions = "If symptoms worsen, contact emergency services immediately.";
            warning = "LIFE-SAFETY SIGNAL DETECTED: SEEK EMERGENCY CARE.";
        } else if (q.contains("blood pressure") || q.contains(" bp ") || q.contains("hypertension")) {
            assessment = safetyPrefix + "Your blood pressure telemetry indicates a potentially high-risk cardiovascular state.";
            severity = "CRITICAL";
            specialist = "Cardiologist / Emergency Specialist";
            action = "Secure an immediate evaluation at an Emergency node.";
            service = "Emergency & Trauma Care";
            conditions = "Potential hypertensive urgency.";
            instructions = "Rest quietly and avoid physical exertion.";
            warning = "HYPERTENSIVE CRISIS POTENTIAL: IMMEDIATE OVERSIGHT REQUIRED.";
        } else if (q.contains("accident") || q.contains("injury") || q.contains("hit") || q.contains("trauma")) {
            assessment = safetyPrefix + "I've prioritized your report of a traumatic injury.";
            severity = "CRITICAL";
            specialist = "Emergency Physician";
            action = "Navigate immediately to the nearest Emergency & Trauma node.";
            service = "Emergency & Trauma Care";
            conditions = "Potential internal trauma protocol.";
            instructions = "Do not move if you suspect a spinal or severe neck injury.";
            warning = "TRAUMA SIGNAL DETECTED: PROCEED TO EMERGENCY.";
        } else if (q.contains("swelling") && q.contains("red") && q.contains("hot") && q.contains("fever")) {
            assessment = safetyPrefix + "Description suggests a potential acute skin infection (Cellulitis).";
            severity = "HIGH";
            specialist = "Infectious Disease Specialist";
            action = "Seek evaluation at Urgent Care within the next few hours.";
            service = "Emergency & Trauma Care";
            conditions = "Potential acute localized infection.";
            instructions = "Do not apply topical creams until evaluated.";
            warning = "INFECTION SIGNAL DETECTED: URGENT EVALUATION RECOMMENDED.";
        } else if (q.contains("heart") || q.contains("cardiac")) {
            assessment = safetyPrefix + "I've noted your interest in cardiovascular health services.";
            severity = "LOW";
            specialist = "Cardiologist";
            action = "Book a routine consultation via the cardiology node.";
            service = "General Clinical";
            conditions = "Cardiovascular specialist inquiry.";
            instructions = "Have your recent vitals ready.";
        } else if (q.contains("scan") || q.contains("mri") || q.contains("ct") || q.contains("xray")) {
            assessment = "I've processed your request for diagnostic imaging.";
            severity = "HIGH";
            specialist = "Radiologist";
            action = "Secure a slot in the Diagnostic Imaging section.";
            service = "MRI Scan";
            conditions = "Diagnostic imaging requested.";
            instructions = "Ensure you have a physician referral.";
        } else if (q.contains("paracetamol") || q.contains("ibuprofen") || q.contains("fever") || q.contains("throat") || q.contains("medicine")) {
            assessment = safetyPrefix + "I've noted your inquiry regarding pharmacological intake or localized discomfort.";
            severity = "LOW";
            specialist = "General Practitioner / Pharmacist";
            action = "Verify safe dosage with a pharmacist via our booking portal.";
            service = "Pharmacy (24/7)";
            conditions = "Routine pharmaceutical or symptomatic inquiry.";
            instructions = "Always check dosage instructions.";
        } else {
            assessment = safetyPrefix + assessment + " I recommend a professional consultation for clinical clarity.";
            severity = "MODERATE";
        }

        return "1. Copilot Assessment: " + assessment + "\n" +
               "2. Possible Conditions / Features: " + conditions + "\n" +
               "3. Risk Indicators / Instructions: " + instructions + "\n" +
               "4. Triage Level: " + severity + "\n" +
               "5. Recommended Specialist: " + specialist + "\n" +
               "6. Suggested Next Steps: " + action + "\n" +
               "7. Follow-up Questions: " + (hasImage ? "Does the localized area feel hot to the touch?" : "When did these symptoms first manifest?") + "\n" +
               "8. Emergency Warning: " + (warning.isEmpty() ? "Tip: Access your records in 'Reports'." : warning);
    }
}
