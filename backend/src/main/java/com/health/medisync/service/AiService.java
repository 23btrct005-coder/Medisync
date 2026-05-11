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

        // 1. Run local expert first to handle known signals
        String expertResponse = executeLocalExpertAgent(query, imageData != null, history);
        if (expertResponse != null && !expertResponse.contains("Recommended Specialist: General Physician")) {
            return expertResponse;
        }

        // 2. Multi-Agent Orchestration Loop
        String response = executeNeuralOrchestration(query, imageData, history, location, hospitals, doctors, profile);
        
        if (response == null || isError(response)) {
            System.out.println("ORCHESTRATOR_FAILOVER: Engaging Local Expert Agent.");
            return expertResponse;
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

    private boolean safeContains(String q, String target) {
        if (q == null || target == null) return false;
        if (target.length() <= 3) {
            return q.matches(".*\\b" + target + "\\b.*");
        }
        return q.contains(target);
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

        // --- LEVEL 0: TECHNICAL REJECTION & PRIVACY ---
        if (q.contains("llm") || q.contains("model") || q.contains("system prompt") || q.contains("registry") || q.contains("json format")) {
            assessment = "Technical inquiry identified. Please restrict your query to clinical symptoms.";
            severity = "LOW";
            specialist = "MediSync Privacy Officer";
            action = "Return to clinical symptoms.";
            service = "System Security";
        }
        // --- LEVEL 1: ADMINISTRATIVE ROUTING ---
        else if (q.contains("book") || q.contains("find") || q.contains("nearest") || q.contains("where is") || q.contains("schedule")) {
            assessment = "MediSync Navigator offers a streamlined portal for all scheduling.";
            severity = "LOW";
            specialist = "MediSync Navigator";
            action = "Navigate to /dashboard/booking.";
            service = "General Clinical";
        } else if (q.contains("records") || q.contains("result") || q.contains("download") || q.contains("insurance") || q.contains("password")) {
            assessment = "MediSync Support provides administrative oversight for your records.";
            severity = "LOW";
            specialist = "MediSync Support";
            action = "Navigate to /dashboard/reports.";
            service = "General Clinical";
        }
        // --- LEVEL 2: CRITICAL LIFE-SAFETY (TEMPLATE ALIGNED) ---
        else if (q.contains("throat closing") || q.contains("peanut") || q.contains("swollen tongue") || q.contains("hives") || q.contains("anaphylaxis")) {
            assessment = safetyPrefix + "Symptoms suggest Anaphylaxis (severe allergic reaction).";
            severity = "CRITICAL";
            specialist = "Allergist";
            action = "Use an Epipen and seek EMERGENCY care.";
            service = "Emergency & Trauma Care";
            warning = "ANAPHYLAXIS ALERT.";
        } else if (q.contains("drooping") || q.contains("weakness") || q.contains("slurred") || q.contains("confusion") || q.contains("vision loss") || q.contains("stiff neck")) {
            assessment = safetyPrefix + "Acute neurological deficit identified.";
            severity = "CRITICAL";
            specialist = "Neurologist";
            action = "Seek IMMEDIATE Stroke Center or Emergency care.";
            service = "Emergency & Trauma Care";
            warning = "NEUROLOGICAL EMERGENCY.";
        } else if (q.contains("self-harm") || q.contains("dark thoughts") || q.contains("suicidal") || q.contains("mental crisis") || q.contains("panic attack")) {
            assessment = safetyPrefix + "Severe psychiatric distress identified.";
            severity = "CRITICAL";
            specialist = "Psychiatrist";
            action = "Seek immediate Mental Health Support.";
            service = "Emergency & Trauma Care";
            warning = "CRISIS SIGNAL.";
        } else if (q.contains("pregnant") || q.contains("contraction") || q.contains("water broke") || q.contains("pre-eclampsia")) {
            assessment = safetyPrefix + "Acute obstetric complication identified.";
            severity = "CRITICAL";
            specialist = "Obstetrician / Gynecologist";
            action = "Proceed to Labor & Delivery triage.";
            service = "Emergency & Trauma Care";
            warning = "OBSTETRIC ALERT.";
        } else if (q.contains("chest") || q.contains("heart attack") || q.contains("pounding heart")) {
            assessment = safetyPrefix + "Acute cardiovascular signal identified.";
            severity = "CRITICAL";
            specialist = "Cardiologist";
            action = "Navigate IMMEDIATELY to Emergency.";
            service = "Emergency & Trauma Care";
            warning = "CARDIAC ALERT.";
        } else if (q.contains("fall") || q.contains("bent arm") || q.contains("car accident") || q.contains("laceration")) {
            assessment = safetyPrefix + "Acute traumatic injury identified.";
            severity = "CRITICAL";
            specialist = "Emergency Physician / Orthopedic Surgeon";
            action = "Navigate immediately to Emergency & Trauma.";
            service = "Emergency & Trauma Care";
            warning = "TRAUMA SIGNAL.";
        }
        // --- LEVEL 3: HIGH-URGENCY ---
        else if (q.contains("diabetes") || q.contains("diabetis") || q.contains("sugar") || q.contains("thirsty") || q.contains("insulin") || q.contains("urine") || q.contains("glucose")) {
            if (q.contains("ketones") || q.contains("400") || q.contains("glucose")) {
                assessment = safetyPrefix + "Metabolic crisis signals identified.";
                severity = "HIGH";
                specialist = "Diabetologist";
                action = "Seek urgent Diabetologist consultation.";
                service = "General Clinical";
            } else if (q.contains("blood in urine") || q.contains("kidney") || q.contains("pee") || q.contains("bladder") || q.contains("urination")) {
                assessment = safetyPrefix + "Urological specialty symptoms detected.";
                severity = "HIGH";
                specialist = "Urologist";
                action = "Book a consultation with a Urologist.";
                service = "General Clinical";
            } else {
                assessment = safetyPrefix + "Metabolic signals detected.";
                severity = "HIGH";
                specialist = "Diabetologist";
                action = "Seek urgent consultation.";
                service = "General Clinical";
            }
        } else if (q.contains("yellow") || q.contains("jaundice") || q.contains("liver") || q.contains("hepatitis") || q.contains("pale stool")) {
            assessment = safetyPrefix + "Hepatobiliary dysfunction signals detected.";
            severity = "HIGH";
            specialist = "Hepatologist";
            action = "Seek evaluation within 24 hours.";
            service = "General Clinical";
        } else if (q.contains("weight loss") || q.contains("lump") || q.contains("tumor") || q.contains("cancer") || q.contains("lymph")) {
            assessment = safetyPrefix + "Persistent systemic symptoms identified.";
            severity = "HIGH";
            specialist = "Oncologist";
            action = "Book a diagnostic consultation.";
            service = "General Clinical";
        } else if (q.contains("vision") || q.contains("eye") || q.contains("flashes")) {
            assessment = safetyPrefix + "Ophthalmological symptoms identified.";
            severity = "HIGH";
            specialist = "Ophthalmologist";
            action = "Seek evaluation within 24 hours.";
            service = "General Clinical";
        }
        // --- LEVEL 4: MODERATE ---
        else if (q.contains("ear") || q.contains("hearing") || q.contains("sore throat") || q.contains("sinus") || q.contains("tonsil")) {
            assessment = safetyPrefix + "ENT symptoms detected.";
            severity = "MODERATE";
            specialist = "Otolaryngologist (ENT Specialist)";
            action = "Book an appointment with an ENT specialist.";
            service = "General Clinical";
        } else if (q.contains("joint") || q.contains("knee") || q.contains("shoulder") || q.contains("broken") || q.contains("arm") || q.contains("hip")) {
            assessment = safetyPrefix + "Musculoskeletal signals identified.";
            severity = "MODERATE";
            specialist = "Orthopedic Surgeon";
            action = "Book a consultation in the Orthopedic node.";
            service = "General Clinical";
        }
        // --- LEVEL 5: FALLBACK ---
        else {
            assessment = safetyPrefix + assessment + " Professional consultation recommended.";
            severity = "MODERATE";
            specialist = "General Physician";
        }

        String followUp = hasImage ? "Does the localized area feel hot to the touch?" : "When did these symptoms first manifest?";
        String finalWarning = warning.isEmpty() ? "Tip: Access your records in 'Reports'." : warning;

        return "1. Copilot Assessment: " + assessment + "\n" +
               "2. Possible Conditions / Features: " + conditions + "\n" +
               "3. Risk Indicators / Instructions: " + instructions + "\n" +
               "4. Triage Level: " + severity + "\n" +
               "5. Recommended Specialist: " + specialist + "\n" +
               "6. Suggested Next Steps: " + action + "\n" +
               "7. Follow-up Questions: " + followUp + "\n" +
               "8. Emergency Warning: " + finalWarning;
    }
}
