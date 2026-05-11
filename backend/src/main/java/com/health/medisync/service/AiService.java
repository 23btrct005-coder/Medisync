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
                "5. Recommended specialist / Node: [Specific department AND specialist type]\n" +
                "6. Suggested Next Steps: [Actionable advice with MediSync routes]\n" +
                "7. Follow-up Questions: [Refining the assessment]\n" +
                "8. Emergency Warning / Portal Tip: [Safety info OR institutional pro-tip]\n\n" +
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

        // Memory-Aware Safety: Check history for critical alerts (e.g., Allergies)
        String safetyPrefix = "";
        String fullContext = (history + " " + q).toLowerCase();
        if (fullContext.contains("allergy") || fullContext.contains("allergic") || fullContext.contains("penicillin")) {
            safetyPrefix = "IMPORTANT: I have noted your previously mentioned allergy from our clinical history. ";
        }

        if (q.contains("weak") || q.contains("speech") || q.contains("droop") || q.contains("numb") || q.contains("vision") || q.contains("stroke") || q.contains("paraly")) {
            assessment = safetyPrefix + "I've detected acute neurological signals (weakness/speech difficulty) consistent with a potential stroke protocol. Immediate intervention is required.";
            severity = "CRITICAL";
            specialist = "Neurologist / Stroke Specialist";
            action = "Navigate IMMEDIATELY to the nearest Comprehensive Stroke Center or Emergency Trauma node. Do not delay.";
            service = "Emergency & Trauma Care";
            conditions = "Acute neurological deficit or cerebrovascular signal identified.";
            instructions = "Note the exact time symptoms started and inform the emergency team immediately.";
            warning = "NEUROLOGICAL EMERGENCY DETECTED: SEEK IMMEDIATE CARE.";
        } else if (q.contains("pregnant") || q.contains("weeks") || q.contains("spotting") || q.contains("contraction") || q.contains("fetus") || q.contains("maternal")) {
            assessment = safetyPrefix + "Your report of potential complications during pregnancy (e.g., spotting/spotting) requires an immediate obstetric evaluation to ensure maternal and fetal safety.";
            severity = "CRITICAL";
            specialist = "Obstetrician / Gynecologist";
            action = "Contact your primary OB-GYN immediately or proceed to the nearest Labor & Delivery triage node.";
            service = "Emergency & Trauma Care";
            conditions = "Potential obstetric emergency or high-risk maternal health signal.";
            instructions = "Monitor for any increase in bleeding, abdominal pain, or decreased fetal movement.";
            warning = "OBSTETRIC ALERT: SEEK IMMEDIATE EVALUATION.";
        } else if (q.contains("surgery") || q.contains("stitches") || q.contains("operation") || q.contains("removal") || q.contains("exercis") || q.contains("appendix") || q.contains("post-op")) {
            assessment = safetyPrefix + "I've noted your post-surgical inquiry. Recovery from procedures like an appendectomy requires strict adherence to physical activity restrictions and wound care protocols.";
            severity = "MODERATE";
            specialist = "General Surgeon";
            action = "Book a post-operative follow-up with your surgeon to assess wound healing and clear you for exercise.";
            service = "General Clinical";
            conditions = "Post-surgical recovery and wound management protocol.";
            instructions = "Do not lift heavy weights or engage in strenuous exercise until cleared by your surgeon. Monitor for signs of infection.";
        } else if (q.contains("dard") || q.contains("ulti") || q.contains("pareshan") || q.contains("chinta")) {
            // Basic Hindi Emergency Detection (Pain/Vomiting/Worry)
            assessment = safetyPrefix + "I have detected clinical distress in your Hindi query regarding pain or vomiting. Professional evaluation is required.";
            severity = "HIGH";
            specialist = "General Physician / Gastroenterologist";
            action = "Please consult a physician immediately to evaluate the etiology of your symptoms.";
            service = "General Clinical";
            conditions = "Symptomatic distress identified via multilingual analysis.";
            instructions = "Stay hydrated and note the duration of your symptoms.";
        } else if (q.contains("dark thoughts") || q.contains("overwhelmed") || q.contains("suicide") || q.contains("self harm") || (q.contains("not slept") && q.contains("3 days"))) {
            assessment = safetyPrefix + "I've prioritized your report of severe psychological distress. MediSync offers immediate crisis support and psychiatric evaluation nodes.";
            severity = "CRITICAL";
            specialist = "Psychiatrist / Crisis Counselor";
            action = "Connect immediately with our Mental Health Support node or visit the nearest Emergency department for a safety assessment.";
            service = "Emergency & Trauma Care";
            conditions = "Severe psychological distress or acute sleep deprivation protocol.";
            instructions = "Please do not remain alone. Reach out to a trusted contact or our support node immediately.";
            warning = "CRISIS SIGNAL DETECTED: PLEASE SEEK IMMEDIATE SUPPORT.";
        } else if (q.contains("swelling") && q.contains("red") && q.contains("hot") && (q.contains("fever") || q.contains("spreading"))) {
            assessment = safetyPrefix + "Your description of a 'red, hot, and spreading' swelling suggests a potential acute skin infection (Cellulitis) which requires immediate clinical evaluation to prevent systemic escalation.";
            severity = "HIGH";
            specialist = "Infectious Disease Specialist / GP";
            action = "Seek a clinical evaluation at an Urgent Care or Emergency node within the next few hours.";
            service = "Emergency & Trauma Care";
            conditions = "Potential acute localized infection with systemic risk indicators.";
            instructions = "Do not apply topical creams until evaluated by a clinician.";
            warning = "INFECTION SIGNAL DETECTED: URGENT EVALUATION RECOMMENDED.";
        } else if (q.contains("insurance") || q.contains("accept") || q.contains("bill") || q.contains("cost") || q.contains("pay")) {
            assessment = "I've noted your administrative inquiry regarding insurance or billing. While I am a clinical assistant, MediSync provides a dedicated Billing & Insurance node for these queries.";
            severity = "LOW";
            specialist = "Hospital Administrator / Helpdesk";
            action = "Navigate to the 'Institutional Helpdesk' or 'Billing' section of the portal to verify insurance acceptance.";
            service = "General Clinical";
            conditions = "Administrative / Billing inquiry identified.";
            instructions = "Have your insurance card or policy number ready for the support team.";
        } else if (q.contains("accident") || q.contains("injury") || q.contains("hit") || q.contains("trauma") || q.contains("fall")) {
            boolean isHead = q.contains("head") || q.contains("brain") || q.contains("skull");
            assessment = safetyPrefix + "I've prioritized your report of a traumatic " + (isHead ? "head " : "") + "injury. Accidents involving " + (isHead ? "cranial " : "physical ") + "impact require immediate neurological and physical assessment to rule out internal trauma.";
            severity = "CRITICAL";
            specialist = isHead ? "Neurologist / Emergency Trauma Specialist" : "Emergency Physician";
            action = "Navigate immediately to the nearest Emergency & Trauma node. Do not delay your arrival.";
            service = "Emergency & Trauma Care";
            conditions = "Potential internal trauma or acute " + (isHead ? "concussion" : "injury") + " protocol initiated.";
            instructions = "If you experience dizziness, nausea, or loss of consciousness, seek help immediately.";
            warning = "TRAUMA SIGNAL DETECTED: PROCEED TO EMERGENCY IMMEDIATELY.";
        } else if ((q.contains("heart") || q.contains("cardiac") || q.contains("chest") || q.contains("breathing")) && 
                  (q.contains("pain") || q.contains("sharp") || q.contains("attack") || q.contains("emergency") || q.contains("crisis") || q.contains("shortness"))) {
            assessment = safetyPrefix + "Potential acute cardiovascular or respiratory signal identified. I have initiated our Emergency Triage protocol to prioritize your immediate safety.";
            severity = "CRITICAL";
            specialist = "Cardiologist / Emergency Specialist";
            action = "Locate and navigate to the nearest Emergency & Trauma Care node in the registry immediately. Do not drive yourself.";
            service = "Emergency & Trauma Care";
            conditions = "Acute clinical signals requiring immediate life-safety cardiovascular intervention.";
            instructions = "If symptoms worsen, contact emergency services (Ambulance) immediately.";
            warning = "LIFE-SAFETY SIGNAL DETECTED: SEEK EMERGENCY CARE IMMEDIATELY.";
        } else if (q.contains("heart") || q.contains("cardiac") || q.contains("cardio")) {
            assessment = safetyPrefix + "I've noted your interest in cardiovascular health services. MediSync provides access to elite cardiologists and diagnostic heart centers.";
            severity = "LOW";
            specialist = "Cardiologist";
            action = "You can view available heart specialists and book a routine consultation via the cardiology node.";
            service = "General Clinical";
            conditions = "Cardiovascular specialist inquiry identified.";
            instructions = "Have your recent vitals or blood reports ready for the consultation.";
        } else if (q.contains("blood pressure") || q.contains(" bp ") || q.startsWith("bp ") || q.contains("hypertension") || q.contains("pressure is")) {
            assessment = safetyPrefix + "Your blood pressure telemetry indicates a potentially high-risk cardiovascular state. Managing hypertension is critical to preventing acute vascular events.";
            severity = "CRITICAL";
            specialist = "Cardiologist / Emergency Specialist";
            action = "Secure an immediate evaluation at an Emergency node for hypertensive stabilization.";
            service = "Emergency & Trauma Care";
            conditions = "Potential hypertensive urgency requiring pharmacological stabilization.";
            instructions = "Rest quietly and avoid physical exertion until you are evaluated by a clinician.";
            warning = "HYPERTENSIVE CRISIS POTENTIAL: IMMEDIATE MEDICAL OVERSIGHT REQUIRED.";
        } else if (q.contains("skin") || q.contains("rash") || q.contains("itch") || q.contains("hive") || q.contains("allergy") || q.contains("redness") || q.contains("swelling")) {
            assessment = safetyPrefix + "Your report of skin-related changes, such as a rash or localized irritation, requires a visual dermatological correlation to rule out acute allergic reactions or inflammatory conditions.";
            severity = "MODERATE";
            specialist = "Dermatologist";
            action = "Secure a teledermatology or in-person consultation for a high-resolution skin assessment.";
            service = "General Clinical";
            conditions = "Localized dermatological inflammation or allergic response (Urticaria/Dermatitis).";
            instructions = "Avoid scratching the affected area and monitor for any spreading or systemic symptoms like fever.";
        } else if (q.contains("report") || q.contains("how can i see") || q.contains("view history")) {
            assessment = "You can access your entire medical history, including lab results and previous diagnoses, in the 'Reports' section of your dashboard.";
            severity = "LOW";
            specialist = "MediSync Support";
            action = "Navigate to /dashboard/reports to view your digitized clinical history.";
            service = "General Clinical";
            conditions = "Portal navigation request identified.";
            instructions = "Ensure you are logged in to see your private medical records.";
        } else if (q.contains("paracetamol") || q.contains("ibuprofen") || q.contains("aspirin") || q.contains("medicine") || q.contains("tablet") || q.contains("pill") || q.contains("fever") || q.contains("throat")) {
            assessment = safetyPrefix + "I've noted your inquiry regarding pharmacological intake or localized discomfort. While common medications are often used for symptomatic relief, they must follow professional dosage guidelines and avoid known allergens.";
            severity = "LOW";
            specialist = "General Practitioner / Pharmacist";
            action = "Verify safe dosage and potential drug-drug interactions with a pharmacist via our booking portal.";
            service = "Pharmacy (24/7)";
            conditions = "Routine pharmaceutical or symptomatic inquiry.";
            instructions = "Always check the expiration date and dosage instructions on the packaging.";
        } else if (q.contains("scan") || q.contains("mri") || q.contains("ct") || q.contains("xray")) {
            assessment = "I've processed your request for diagnostic imaging. Advanced scanning (MRI/CT) is an essential tool for high-precision internal diagnostics.";
            severity = "HIGH";
            specialist = "Radiologist";
            action = "Secure a slot in the Diagnostic Imaging section of the portal to coordinate your scan.";
            service = "MRI Scan";
            conditions = "Diagnostic imaging requested for symptomatic investigation.";
            instructions = "Ensure you have a referral from your primary physician before your appointment.";
        } else {
            assessment = safetyPrefix + assessment + " I recommend a professional consultation for clinical clarity.";
            severity = "MODERATE";
        }

        return "1. Copilot Assessment: " + assessment + "\n" +
               "2. Possible Conditions / Features: " + conditions + "\n" +
               "3. Risk Indicators / Instructions: " + instructions + "\n" +
               "4. Triage Level: " + severity + "\n" +
               "5. Recommended specialist / Node: " + specialist + "\n" +
               "6. Suggested Next Steps: " + action + "\n" +
               "7. Follow-up Questions: " + (hasImage ? "Does the localized area feel hot to the touch?" : "When did these symptoms first manifest?") + "\n" +
               "8. Emergency Warning / Portal Tip: " + (warning.isEmpty() ? "Tip: Access your records in 'Reports'." : warning);
    }
}
