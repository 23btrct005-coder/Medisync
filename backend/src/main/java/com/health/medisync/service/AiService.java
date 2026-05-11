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
        // --- LEVEL 0: TECHNICAL REJECTION & PRIVACY ---
        if (q.contains("llm") || q.contains("model") || q.contains("system prompt") || q.contains("registry") || q.contains("json format")) {
            assessment = "I am a clinical AI assistant dedicated to patient triage and medical guidance. I cannot disclose internal technical specifications.";
            severity = "LOW";
            specialist = "MediSync Privacy Officer";
            action = "Please restrict your inquiries to clinical symptoms.";
            service = "System Security";
        }
        // --- LEVEL 1: ADMINISTRATIVE ROUTING ---
        else if (q.contains("book") || q.contains("appointment") || q.contains("schedule") || q.contains("find") || q.contains("where") || q.contains("how") || q.contains("checkup")) {
            assessment = "MediSync Navigator offers a streamlined portal for all scheduling and facility navigation.";
            severity = "LOW";
            specialist = "MediSync Navigator";
            action = "Navigate to /dashboard/booking.";
            service = "General Clinical";
        } else if (q.contains("records") || q.contains("result") || q.contains("report") || q.contains("insurance") || q.contains("password") || q.contains("portal") || q.contains("access") || (q.contains("see") && q.contains("record"))) {
            assessment = "MediSync Support provides administrative oversight for your medical documentation.";
            severity = "LOW";
            specialist = "MediSync Support";
            action = "Navigate to /dashboard/reports.";
            service = "General Clinical";
        }
        // --- LEVEL 2: CRITICAL LIFE-SAFETY (AUDIT-ALIGNED PRIORITY) ---
        else if (q.contains("nut") || q.contains("peanut") || q.contains("allergy") || q.contains("allergic") || q.contains("sting") || q.contains("anaphylax") || q.contains("hives")) {
            assessment = safetyPrefix + "Symptoms suggest Anaphylaxis (severe systemic allergic reaction).";
            severity = "CRITICAL";
            specialist = "Allergist";
            action = "Use an Epipen if available and navigate IMMEDIATELY to Emergency.";
            service = "Emergency & Trauma Care";
            warning = "ANAPHYLAXIS ALERT: SEEK IMMEDIATE CARE.";
        } else if (q.contains("stroke") || q.contains("confusion") || q.contains("headache") || q.contains("weak") || q.contains("droop") || q.contains("slur") || q.contains("seizure") || q.contains("jibberish") || q.contains("lopsided") || q.contains("spinning") || q.contains("fainting") || q.contains("vision loss") || q.contains("double vision")) {
            assessment = safetyPrefix + "Acute neurological deficit or crisis identified.";
            severity = "CRITICAL";
            specialist = "Neurologist";
            action = "Navigate IMMEDIATELY to the nearest Comprehensive Stroke Center or Emergency node.";
            service = "Emergency & Trauma Care";
            warning = "NEUROLOGICAL EMERGENCY: SEEK IMMEDIATE CARE.";
        } else if (q.contains("self-harm") || q.contains("suicid") || q.contains("panic") || q.contains("crisis") || q.contains("dark thoughts") || q.contains("end it") || q.contains("hopeless") || q.contains("anxious") || q.contains("overwhelmed")) {
            assessment = safetyPrefix + "Severe psychological or psychiatric distress identified.";
            severity = "CRITICAL";
            specialist = "Psychiatrist";
            action = "Connect with our Mental Health Support node or navigate to Emergency.";
            service = "Emergency & Trauma Care";
            warning = "CRISIS SIGNAL DETECTED: PLEASE SEEK IMMEDIATE SUPPORT.";
        } else if (q.contains("contraction") || q.contains("water broke") || q.contains("pregnant") || q.contains("bleed") || q.contains("spotting") || q.contains("pre-eclampsia")) {
            assessment = safetyPrefix + "Acute obstetric complication identified.";
            severity = "CRITICAL";
            specialist = "Obstetrician / Gynecologist";
            action = "Contact your primary OB-GYN or proceed to Labor & Delivery triage.";
            service = "Emergency & Trauma Care";
            warning = "OBSTETRIC ALERT: SEEK IMMEDIATE EVALUATION.";
        } else if (q.contains("chest") || q.contains("heart") || q.contains("cardiac") || q.contains("pressure") || q.contains("vice") || q.contains("drum") || q.contains("skipping") || q.contains("palpitation")) {
            assessment = safetyPrefix + "Potential acute cardiovascular signal identified.";
            severity = "CRITICAL";
            specialist = "Cardiologist";
            action = "Navigate IMMEDIATELY to the nearest Emergency & Trauma Care node.";
            service = "Emergency & Trauma Care";
            warning = "CARDIAC ALERT: SEEK EMERGENCY EVALUATION.";
        } else if ((q.contains("breath") && (q.contains("can't") || q.contains("stop"))) || (q.contains("blue") && (q.contains("lip") || q.contains("face")))) {
            assessment = safetyPrefix + "Cyanosis and acute respiratory failure detected.";
            severity = "CRITICAL";
            specialist = "Pulmonologist";
            action = "Navigate IMMEDIATELY to the nearest Emergency node.";
            service = "Emergency & Trauma Care";
            warning = "LIFE-SAFETY ALERT: SEEK IMMEDIATE OXYGENATION.";
        } else if (q.contains("accident") || q.contains("injury") || q.contains("fall") || q.contains("bent") || q.contains("deform") || q.contains("laceration") || q.contains("car") || q.contains("hit my head")) {
            assessment = safetyPrefix + "Acute traumatic injury identified.";
            severity = "CRITICAL";
            specialist = "Orthopedic Surgeon";
            action = "Navigate immediately to Emergency & Trauma.";
            service = "Emergency & Trauma Care";
            warning = "TRAUMA SIGNAL DETECTED: PROCEED TO EMERGENCY.";
        }
        // --- LEVEL 3: HIGH-URGENCY SPECIALTY SIGNALS ---
        else if (q.contains("diabetes") || q.contains("sugar") || q.contains("glucose") || q.contains("insulin") || q.contains("desert") || q.contains("shaky") || q.contains("sweet breath") || q.contains("thirsty") || q.contains("urinat")) {
            assessment = safetyPrefix + "Metabolic or glycemic specialty signals identified.";
            severity = "HIGH";
            specialist = "Diabetologist";
            action = "Book an urgent consultation with a Diabetologist.";
            service = "General Clinical";
        } else if (q.contains("jaundice") || q.contains("yellow") || q.contains("liver") || q.contains("pale stool") || q.contains("balloon")) {
            assessment = safetyPrefix + "Hepatobiliary dysfunction signals detected.";
            severity = "HIGH";
            specialist = "Hepatologist";
            action = "Seek evaluation within 24 hours.";
            service = "General Clinical";
        } else if (q.contains("urine") || q.contains("pee") || q.contains("bladder") || q.contains("kidney") || q.contains("prostate")) {
            assessment = safetyPrefix + "Urological specialty symptoms detected.";
            severity = "HIGH";
            specialist = "Urologist";
            action = "Book a consultation with a Urologist.";
            service = "General Clinical";
        } else if (q.contains("weight loss") || q.contains("lump") || q.contains("tumor") || q.contains("cancer") || q.contains("moles") || q.contains("color")) {
            assessment = safetyPrefix + "Persistent systemic symptoms or localized growths identified.";
            severity = "HIGH";
            specialist = "Oncologist";
            action = "Book an urgent diagnostic consultation.";
            service = "General Clinical";
        } else if (q.contains("eye") || q.contains("vision") || q.contains("flashes") || q.contains("blur") || q.contains("red")) {
            assessment = safetyPrefix + "Ophthalmological symptoms identified.";
            severity = "HIGH";
            specialist = "Ophthalmologist";
            action = "Seek evaluation within 24 hours.";
            service = "General Clinical";
        }
        // --- LEVEL 4: MODERATE SPECIALTY SIGNALS ---
        else if (q.contains("ear") || q.contains("hearing") || q.contains("tonsil") || q.contains("throat") || q.contains("voice") || q.contains("raw")) {
            assessment = safetyPrefix + "ENT (Otolaryngology) symptoms detected.";
            severity = "MODERATE";
            specialist = "Otolaryngologist (ENT Specialist)";
            action = "Book an appointment with an ENT specialist.";
            service = "General Clinical";
        } else if (q.contains("joint") || q.contains("ortho") || q.contains("knee") || q.contains("bone") || q.contains("hip") || q.contains("shoulder")) {
            assessment = safetyPrefix + "Musculoskeletal signals identified.";
            severity = "MODERATE";
            specialist = "Orthopedic Surgeon";
            action = "Book a consultation in the Orthopedic node.";
            service = "General Clinical";
        }
        // --- LEVEL 5: ROUTINE & FALLBACK ---
        else if (q.contains("medicine") || q.contains("dosage") || q.contains("paracetamol") || q.contains("ibuprofen")) {
            assessment = safetyPrefix + "Routine pharmaceutical inquiry identified.";
            severity = "LOW";
            specialist = "Pharmacist";
            action = "Verify safe dosage with a pharmacist.";
            service = "Pharmacy (24/7)";
        } else {
            assessment = safetyPrefix + assessment + " I recommend a professional consultation.";
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
