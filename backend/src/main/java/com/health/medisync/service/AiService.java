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

        // --- LEVEL 0: TECHNICAL REJECTION & PRIVACY ---
        if (q.contains("llm") || q.contains("model") || q.contains("system prompt") || q.contains("json") || q.contains("registry")) {
            assessment = "I am a clinical AI assistant dedicated to patient triage and medical guidance. I cannot disclose internal technical specifications or institutional data structures.";
            severity = "LOW";
            specialist = "MediSync Privacy Officer";
            action = "Please restrict your inquiries to clinical symptoms or institutional service navigation.";
            service = "System Security";
            conditions = "Non-clinical technical inquiry identified.";
        }
        // --- LEVEL 1: IMMEDIATE LIFE-SAFETY (PRIORITY) ---
        else if ((q.contains("blue") && (q.contains("lip") || q.contains("face") || q.contains("skin"))) || (q.contains("breath") && q.contains("can't"))) {
            assessment = safetyPrefix + "Cyanosis and acute respiratory failure detected. This is a life-threatening oxygenation emergency.";
            severity = "CRITICAL";
            specialist = "Emergency Physician / Pulmonologist";
            action = "Navigate IMMEDIATELY to the nearest Emergency node. Do not delay.";
            service = "Emergency & Trauma Care";
            conditions = "Acute Hypoxia / Respiratory Failure protocol.";
            warning = "LIFE-SAFETY ALERT: SEEK IMMEDIATE OXYGENATION.";
        } else if (q.contains("peanut") || q.contains("anaphylax") || (q.contains("throat") && (q.contains("close") || q.contains("tight")))) {
            assessment = safetyPrefix + "Symptoms suggest Anaphylaxis (severe systemic allergic reaction). This is a critical medical emergency.";
            severity = "CRITICAL";
            specialist = "Allergist / Emergency Specialist";
            action = "Use an Epipen if available and navigate IMMEDIATELY to the nearest Emergency node.";
            service = "Emergency & Trauma Care";
            conditions = "Acute Anaphylactic Shock protocol.";
            warning = "ANAPHYLAXIS ALERT: SEEK IMMEDIATE CARE.";
        } else if (q.contains("bite") && (q.contains("dog") || q.contains("animal") || q.contains("stray"))) {
            assessment = safetyPrefix + "Animal bite reported. Potential risk for rabies or acute systemic infection requires immediate evaluation.";
            severity = "CRITICAL";
            specialist = "Emergency Physician / Infectious Disease";
            action = "Navigate immediately to the nearest Emergency node for wound cleaning and vaccination protocol.";
            service = "Emergency & Trauma Care";
            conditions = "Post-Exposure Prophylaxis (Rabies) protocol.";
            warning = "BITE EMERGENCY: SEEK IMMEDIATE WOUND CARE.";
        } else if (q.contains("skin") && (q.contains("peel") || q.contains("sheet") || q.contains("blister")) && q.contains("medicine")) {
            assessment = safetyPrefix + "Symptoms of extensive skin peeling after medication suggest Stevens-Johnson Syndrome (SJS), a critical medical emergency.";
            severity = "CRITICAL";
            specialist = "Dermatologist / Burn Specialist";
            action = "Navigate IMMEDIATELY to the nearest Burn Center or Emergency node.";
            service = "Emergency & Trauma Care";
            conditions = "SJS / TEN Emergency protocol.";
            warning = "DERMATOLOGICAL EMERGENCY: SEEK IMMEDIATE CARE.";
        }
        // --- LEVEL 2: ACUTE SPECIALTY SIGNAL DETECTION ---
        else if (q.contains("yellow") && (q.contains("eye") || q.contains("skin") || q.contains("jaundice"))) {
            assessment = safetyPrefix + "Jaundice and potential liver dysfunction detected. High-urgency evaluation required.";
            severity = "HIGH";
            specialist = "Hepatologist / Gastroenterologist";
            action = "Seek clinical evaluation within the next 24 hours.";
            service = "General Clinical";
            conditions = "Potential Acute Liver Failure / Jaundice protocol.";
        } else if (q.contains("urine") || q.contains("pee") || q.contains("bladder")) {
            assessment = safetyPrefix + "Urological symptoms detected. Potential infection or structural issue identified.";
            severity = "HIGH";
            specialist = "Urologist";
            action = "Book a consultation with a Urologist via the specialist node.";
            service = "General Clinical";
            conditions = "Urological specialty inquiry.";
        } else if (q.contains("ear") || q.contains("hearing") || q.contains("tonsil") || q.contains("throat") && q.contains("patch")) {
            assessment = safetyPrefix + "Otolaryngological (ENT) symptoms detected. Specialized evaluation recommended.";
            severity = "MODERATE";
            specialist = "Otolaryngologist (ENT Specialist)";
            action = "Book an appointment with an ENT specialist for detailed imaging/scoping.";
            service = "General Clinical";
            conditions = "ENT specialty inquiry.";
        } else if (q.contains("eye") && (q.contains("vision") || q.contains("red") || q.contains("blur"))) {
            assessment = safetyPrefix + "Ophthalmological symptoms detected. Vision changes require specialized assessment.";
            severity = "HIGH";
            specialist = "Ophthalmologist";
            action = "Seek evaluation from an Ophthalmologist within 24 hours.";
            service = "General Clinical";
            conditions = "Ophthalmic specialty inquiry.";
        } else if (q.contains("foot") || q.contains("heel") || q.contains("toe") || q.contains("podiatry")) {
            assessment = safetyPrefix + "Podiatric symptoms detected. Lower limb specialist evaluation recommended.";
            severity = "MODERATE";
            specialist = "Podiatrist / Orthopedic Surgeon";
            action = "Book a consultation with a Podiatrist via the specialist portal.";
            service = "General Clinical";
            conditions = "Podiatry specialty inquiry.";
        }
        // --- LEVEL 3: HARDENED EXISTING NODES ---
        else if (q.contains("neck") && (q.contains("stiff") || q.contains("pain")) && (q.contains("light") || q.contains("fever"))) {
            assessment = safetyPrefix + "Symptoms suggest acute meningeal irritation. Immediate evaluation for meningitis required.";
            severity = "CRITICAL";
            specialist = "Neurologist / Infectious Disease Specialist";
            action = "Navigate IMMEDIATELY to the nearest Emergency department.";
            service = "Emergency & Trauma Care";
            warning = "NEUROLOGICAL ALERT: SEEK IMMEDIATE EVALUATION.";
        } else if ((q.contains("sun") || q.contains("heat") || q.contains("outside")) && (q.contains("confused") || q.contains("hot") || q.contains("dry"))) {
            assessment = safetyPrefix + "Signals consistent with potential Heat Stroke detected.";
            severity = "CRITICAL";
            specialist = "Emergency Physician";
            action = "Navigate IMMEDIATELY to the nearest Emergency node.";
            service = "Emergency & Trauma Care";
            warning = "HEAT EMERGENCY DETECTED: SEEK IMMEDIATE CARE.";
        } else if (q.contains("pregnant") && (q.contains("weeks") || q.contains("spotting") || q.contains("contraction") || q.contains("headache"))) {
            assessment = safetyPrefix + "Obstetric complications reported during pregnancy. Immediate evaluation required.";
            severity = "CRITICAL";
            specialist = "Obstetrician / Gynecologist";
            action = "Contact your primary OB-GYN or proceed to Labor & Delivery triage.";
            service = "Emergency & Trauma Care";
            warning = "OBSTETRIC ALERT: SEEK IMMEDIATE EVALUATION.";
        } else if (q.contains("weak") && (q.contains("face") || q.contains("arm") || q.contains("leg") || q.contains("slur"))) {
            assessment = safetyPrefix + "Acute neurological deficit (Stroke Protocol) identified.";
            severity = "CRITICAL";
            specialist = "Neurologist / Stroke Specialist";
            action = "Navigate IMMEDIATELY to a Stroke Center.";
            service = "Emergency & Trauma Care";
            warning = "NEUROLOGICAL EMERGENCY DETECTED: SEEK IMMEDIATE CARE.";
        } else if (q.contains("tearing") && q.contains("back") && q.contains("stomach")) {
            assessment = safetyPrefix + "Tearing back pain indicates a potential vascular emergency (AAA).";
            severity = "CRITICAL";
            specialist = "Vascular Surgeon / Emergency Specialist";
            action = "Navigate IMMEDIATELY to Emergency & Trauma.";
            service = "Emergency & Trauma Care";
            warning = "VASCULAR EMERGENCY DETECTED: SEEK IMMEDIATE CARE.";
        } else if ((q.contains("shiver") || q.contains("confused")) && (q.contains("surgery") || q.contains("post-op"))) {
            assessment = safetyPrefix + "Potential post-operative Sepsis identified.";
            severity = "CRITICAL";
            specialist = "Infectious Disease Specialist / Surgeon";
            action = "Navigate IMMEDIATELY to Emergency.";
            service = "Emergency & Trauma Care";
            warning = "SEPSIS ALERT: SEEK IMMEDIATE EVALUATION.";
        } else if (q.contains("accident") || q.contains("injury") || q.contains("fall") || q.contains("bent") || q.contains("deform")) {
            assessment = safetyPrefix + "Acute traumatic injury involving potential deformity identified.";
            severity = "CRITICAL";
            specialist = "Emergency Physician / Orthopedic Surgeon";
            action = "Navigate immediately to Emergency & Trauma.";
            service = "Emergency & Trauma Care";
            warning = "TRAUMA SIGNAL DETECTED: PROCEED TO EMERGENCY.";
        } else if (q.contains("report") || q.contains("result") || q.contains("blood test") || q.contains("see my")) {
            assessment = "Access your results and reports in the 'Reports' section of your dashboard.";
            severity = "LOW";
            specialist = "MediSync Support / Records Department";
            action = "Navigate to /dashboard/reports.";
            service = "General Clinical";
        } else if (q.contains("how") && (q.contains("book") || q.contains("find") || q.contains("appointment"))) {
            assessment = "Use the 'Book Appointment' portal in your sidebar for scheduling.";
            severity = "LOW";
            specialist = "MediSync Navigator";
            action = "Navigate to /dashboard/booking.";
            service = "General Clinical";
        } else if (q.contains("diabetes") || q.contains("sugar") || q.contains("glucose")) {
            assessment = safetyPrefix + "Potential glycemic crisis detected.";
            severity = "HIGH";
            specialist = "Endocrinologist / Diabetologist";
            action = "Seek evaluation at Urgent Care or Emergency.";
            service = "Emergency & Trauma Care";
        } else if (q.contains("heart") || q.contains("chest") || q.contains("breathing") && q.contains("pain")) {
            assessment = safetyPrefix + "Potential acute cardiovascular or respiratory signal identified.";
            severity = "CRITICAL";
            specialist = "Cardiologist / Emergency Specialist";
            action = "Locate and navigate to Emergency & Trauma immediately.";
            service = "Emergency & Trauma Care";
            warning = "LIFE-SAFETY SIGNAL DETECTED: SEEK EMERGENCY CARE.";
        } else if (q.contains("scan") || q.contains("mri") || q.contains("ct") || q.contains("xray")) {
            assessment = "Diagnostic imaging request identified.";
            severity = "HIGH";
            specialist = "Radiologist";
            action = "Secure a slot in the Diagnostic Imaging section.";
            service = "MRI Scan";
        } else if (q.contains("paracetamol") || q.contains("ibuprofen") || q.contains("medicine") || q.contains("dosage")) {
            assessment = safetyPrefix + "Routine pharmaceutical or symptomatic inquiry identified.";
            severity = "LOW";
            specialist = "General Practitioner / Pharmacist";
            action = "Verify safe dosage with a pharmacist.";
            service = "Pharmacy (24/7)";
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
