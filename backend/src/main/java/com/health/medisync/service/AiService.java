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
        if (safeContains(q, "llm") || safeContains(q, "model") || safeContains(q, "system prompt") || safeContains(q, "registry") || q.contains("json format")) {
            assessment = "I am a clinical AI assistant dedicated to patient triage and medical guidance. I cannot disclose internal technical specifications or institutional data structures.";
            severity = "LOW";
            specialist = "MediSync Privacy Officer";
            action = "Please restrict your inquiries to clinical symptoms or institutional service navigation.";
            service = "System Security";
            conditions = "Non-clinical technical inquiry identified.";
        }
        // --- LEVEL 1: ADMINISTRATIVE ROUTING ---
        else if ((safeContains(q, "how") || safeContains(q, "where") || safeContains(q, "find") || safeContains(q, "help") || safeContains(q, "schedule") || safeContains(q, "contact") || safeContains(q, "locate") || safeContains(q, "checkup") || safeContains(q, "specialist") || safeContains(q, "appointment") || safeContains(q, "book")) && (safeContains(q, "book") || safeContains(q, "appointment") || safeContains(q, "hospital") || safeContains(q, "doctor") || safeContains(q, "office") || safeContains(q, "specialist") || safeContains(q, "clinic") || safeContains(q, "checkup"))) {
            assessment = "MediSync Navigator offers a streamlined portal for all scheduling and facility navigation.";
            severity = "LOW";
            specialist = "MediSync Navigator";
            action = "Navigate to /dashboard/booking.";
            service = "General Clinical";
        } else if (safeContains(q, "records") || safeContains(q, "result") || safeContains(q, "report") || safeContains(q, "insurance") || safeContains(q, "password") || safeContains(q, "portal") || safeContains(q, "access") || safeContains(q, "update") || safeContains(q, "email") || (safeContains(q, "see") && safeContains(q, "record"))) {
            assessment = "MediSync Support provides administrative oversight for your medical documentation and access credentials.";
            severity = "LOW";
            specialist = "MediSync Support";
            action = "Navigate to /dashboard/reports.";
            service = "General Clinical";
        }
        // --- LEVEL 2: CRITICAL LIFE-SAFETY OVERRIDES ---
        else if (safeContains(q, "chest") || safeContains(q, "heart") || safeContains(q, "palpitation") || safeContains(q, "cardiac") || safeContains(q, "pressure") || safeContains(q, "vice") || safeContains(q, "drum") || safeContains(q, "skipping")) {
            assessment = safetyPrefix + "Potential acute cardiovascular signal identified. Clinical prioritization required.";
            severity = "CRITICAL";
            specialist = "Cardiologist / Emergency Specialist";
            action = "Navigate IMMEDIATELY to the nearest Emergency & Trauma Care node.";
            service = "Emergency & Trauma Care";
            warning = "CARDIAC ALERT: SEEK EMERGENCY EVALUATION.";
        } else if (safeContains(q, "self-harm") || safeContains(q, "suicid") || safeContains(q, "dark thoughts") || safeContains(q, "overwhelmed") || safeContains(q, "crisis") || safeContains(q, "panic") || safeContains(q, "hallucination") || safeContains(q, "manic") || safeContains(q, "end it") || safeContains(q, "hopeless") || safeContains(q, "anxious")) {
            assessment = safetyPrefix + "I've prioritized your report of severe psychological or psychiatric distress.";
            severity = "CRITICAL";
            specialist = "Psychiatrist";
            action = "Connect immediately with our Mental Health Support node or navigate to Emergency.";
            service = "Emergency & Trauma Care";
            warning = "CRISIS SIGNAL DETECTED: PLEASE SEEK IMMEDIATE SUPPORT.";
        } else if (safeContains(q, "peanut") || safeContains(q, "nut") || safeContains(q, "anaphylax") || safeContains(q, "hives") || (safeContains(q, "throat") && (safeContains(q, "close") || safeContains(q, "tight"))) || safeContains(q, "allergy") || safeContains(q, "allergic") || safeContains(q, "sting")) {
            assessment = safetyPrefix + "Symptoms suggest Anaphylaxis (severe systemic allergic reaction). This is a critical medical emergency.";
            severity = "CRITICAL";
            specialist = "Allergist";
            action = "Use an Epipen if available and navigate IMMEDIATELY to the nearest Emergency node.";
            service = "Emergency & Trauma Care";
            warning = "ANAPHYLAXIS ALERT: SEEK IMMEDIATE CARE.";
        } else if (safeContains(q, "weak") || safeContains(q, "droop") || safeContains(q, "slur") || (safeContains(q, "lift") && safeContains(q, "arm")) || safeContains(q, "stroke") || safeContains(q, "vision loss") || safeContains(q, "seizure") || safeContains(q, "jibberish") || safeContains(q, "lopsided") || safeContains(q, "spinning") || safeContains(q, "confusion") || safeContains(q, "fainting") || safeContains(q, "worst headache") || safeContains(q, "double vision")) {
            assessment = safetyPrefix + "Acute neurological deficit or seizure identified. Immediate clinical intervention is required.";
            severity = "CRITICAL";
            specialist = "Neurologist";
            action = "Navigate IMMEDIATELY to the nearest Comprehensive Stroke Center or Emergency node.";
            service = "Emergency & Trauma Care";
            warning = "NEUROLOGICAL EMERGENCY: SEEK IMMEDIATE CARE.";
        } else if (safeContains(q, "contraction") || safeContains(q, "water broke") || safeContains(q, "pre-eclampsia") || (safeContains(q, "pregnant") && (safeContains(q, "bleed") || safeContains(q, "spotting")))) {
            assessment = safetyPrefix + "Acute obstetric complication identified. Immediate clinical intervention is required.";
            severity = "CRITICAL";
            specialist = "Obstetrician / Gynecologist";
            action = "Contact your primary OB-GYN or proceed to Labor & Delivery triage.";
            service = "Emergency & Trauma Care";
            warning = "OBSTETRIC ALERT: SEEK IMMEDIATE EVALUATION.";
        } else if ((safeContains(q, "blue") && (safeContains(q, "lip") || safeContains(q, "face") || safeContains(q, "skin"))) || (safeContains(q, "breath") && (safeContains(q, "can't") || safeContains(q, "stop")))) {
            assessment = safetyPrefix + "Cyanosis and acute respiratory failure detected. This is a life-threatening oxygenation emergency.";
            severity = "CRITICAL";
            specialist = "Emergency Physician / Pulmonologist";
            action = "Navigate IMMEDIATELY to the nearest Emergency node. Do not delay.";
            service = "Emergency & Trauma Care";
            warning = "LIFE-SAFETY ALERT: SEEK IMMEDIATE OXYGENATION.";
        } else if (safeContains(q, "accident") || safeContains(q, "injury") || safeContains(q, "fall") || safeContains(q, "bent") || safeContains(q, "deform") || safeContains(q, "ladder") || safeContains(q, "laceration") || safeContains(q, "car") || safeContains(q, "hit my head")) {
            assessment = safetyPrefix + "Acute traumatic injury involving potential structural compromise identified.";
            severity = "CRITICAL";
            specialist = "Emergency Physician / Orthopedic Surgeon";
            action = "Navigate immediately to Emergency & Trauma.";
            service = "Emergency & Trauma Care";
            warning = "TRAUMA SIGNAL DETECTED: PROCEED TO EMERGENCY.";
        } else if (safeContains(q, "blood pressure") || safeContains(q, "hypertension") || (safeContains(q, "bp") && (q.contains("190") || q.contains("180")))) {
            assessment = safetyPrefix + "Your blood pressure readings indicate a Hypertensive Emergency protocol.";
            severity = "CRITICAL";
            specialist = "Cardiologist / Emergency Specialist";
            action = "Navigate IMMEDIATELY to the nearest Emergency node.";
            service = "Emergency & Trauma Care";
            warning = "HYPERTENSIVE CRISIS: SEEK IMMEDIATE CARE.";
        }
        // --- LEVEL 3: HIGH-URGENCY SPECIALTY SIGNALS ---
        else if (safeContains(q, "ketones") || safeContains(q, "glucose") || safeContains(q, "sugar") || safeContains(q, "insulin") || safeContains(q, "diabetes") || safeContains(q, "desert") || safeContains(q, "shaky") || safeContains(q, "sweet breath") || safeContains(q, "thirsty") || safeContains(q, "urinat")) {
            assessment = safetyPrefix + "Metabolic or glycemic specialty signals identified.";
            severity = "HIGH";
            specialist = "Endocrinologist / Diabetologist";
            action = "Book an urgent consultation with a Diabetologist.";
            service = "General Clinical";
        } else if (q.contains("urine") || q.contains("pee") || q.contains("bladder") || q.contains("kidney") || q.contains("prostate") || (q.contains("blood") && q.contains("piss"))) {
            assessment = safetyPrefix + "Urological specialty symptoms detected.";
            severity = "HIGH";
            specialist = "Urologist";
            action = "Book a consultation with a Urologist via the specialist node.";
            service = "General Clinical";
        } else if (safeContains(q, "jaundice") || (safeContains(q, "yellow") && safeContains(q, "eye")) || safeContains(q, "liver") || safeContains(q, "pale stool") || safeContains(q, "balloon")) {
            assessment = safetyPrefix + "Hepatobiliary dysfunction signals detected.";
            severity = "HIGH";
            specialist = "Hepatologist / Gastroenterologist";
            action = "Seek evaluation within 24 hours.";
            service = "General Clinical";
        } else if (safeContains(q, "weight loss") || safeContains(q, "lump") || safeContains(q, "tumor") || safeContains(q, "cancer") || safeContains(q, "lymph") || safeContains(q, "night sweats") || safeContains(q, "moles") || safeContains(q, "hard lump") || safeContains(q, "color")) {
            assessment = safetyPrefix + "Persistent systemic symptoms or localized growths identified. Specialized oncology screening recommended.";
            severity = "HIGH";
            specialist = "Oncologist";
            action = "Book an urgent diagnostic consultation via the specialist portal.";
            service = "General Clinical";
        } else if ((safeContains(q, "eye") && (safeContains(q, "vision") || safeContains(q, "red") || safeContains(q, "blur") || safeContains(q, "pressure"))) || safeContains(q, "flashes") || safeContains(q, "double vision")) {
            assessment = safetyPrefix + "Ophthalmological symptoms require specialized assessment.";
            severity = "HIGH";
            specialist = "Ophthalmologist";
            action = "Seek evaluation within 24 hours.";
            service = "General Clinical";
        } else if (safeContains(q, "scan") || safeContains(q, "mri") || safeContains(q, "ct") || safeContains(q, "xray")) {
            assessment = "Diagnostic imaging request identified.";
            severity = "HIGH";
            specialist = "Radiologist";
            action = "Secure a slot in the Diagnostic Imaging section.";
            service = "MRI Scan";
        }
        // --- LEVEL 4: MODERATE SPECIALTY SIGNALS ---
        else if (safeContains(q, "ear") || safeContains(q, "hearing") || safeContains(q, "tonsil") || safeContains(q, "throat") || safeContains(q, "voice") || safeContains(q, "raw") || safeContains(q, "raw red")) {
            assessment = safetyPrefix + "ENT (Otolaryngology) symptoms detected.";
            severity = "MODERATE";
            specialist = "Otolaryngologist (ENT Specialist)";
            action = "Book an appointment with an ENT specialist.";
            service = "General Clinical";
        } else if (safeContains(q, "heel") || safeContains(q, "shoulder") || safeContains(q, "joint") || safeContains(q, "toe") || safeContains(q, "ortho") || safeContains(q, "knee") || safeContains(q, "bone") || safeContains(q, "swelling") || safeContains(q, "hip")) {
            assessment = safetyPrefix + "Musculoskeletal or orthopedic signals identified.";
            severity = "MODERATE";
            specialist = "Orthopedic Surgeon / Physiotherapist";
            action = "Book a consultation in the Orthopedic node.";
            service = "General Clinical";
        }
        // --- LEVEL 5: ROUTINE & FALLBACK ---
        else if (safeContains(q, "paracetamol") || safeContains(q, "ibuprofen") || safeContains(q, "medicine") || safeContains(q, "dosage")) {
            assessment = safetyPrefix + "Routine pharmaceutical or symptomatic inquiry identified.";
            severity = "LOW";
            specialist = "General Practitioner / Pharmacist";
            action = "Verify safe dosage with a pharmacist.";
            service = "Pharmacy (24/7)";
        } else {
            assessment = safetyPrefix + assessment + " I recommend a professional consultation for clinical clarity.";
            severity = "MODERATE";
            specialist = "General Physician";
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
