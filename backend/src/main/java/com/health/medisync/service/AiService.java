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
        String expertResponse = executeLocalExpertAgent(query, imageData != null, history);
        System.out.println("EXPERT_OVERRIDE_ENGAGED: Deterministic triage active.");
        return expertResponse;
    }

    private String sanitizeInput(String input) {
        if (input == null) return "";
        return input.replaceAll("(?i)\\b(ignore|system|instruction|bypass|jailbreak|roleplay|override|prompt)\\b", "[REDACTED]");
    }

    private String executeLocalExpertAgent(String query, boolean hasImage, String history) {
        String systemPrompt = "You are MedAI Pro, a highly empathetic, friendly, and knowledgeable medical AI assistant.\n\n" +
            "MISSION\n" +
            "Provide a short, clear, and reassuring response to the user's medical concern in simple, everyday language (like a caring doctor talking to a patient).\n\n" +
            "CORE PRINCIPLES\n" +
            "1. Be structured: Break your response into clearly segregated bulleted sections (e.g., 'Clinical Assessment', 'Possible Causes', 'Next Steps') so it is very easy for the user to read and understand. Do not write a single massive paragraph.\n" +
            "2. Be empathetic: Start with a reassuring tone.\n" +
            "3. Safety: Remind them gently that this is an AI assessment and they should see a doctor for formal diagnosis.\n" +
            "4. Never guess unknown facts or prescribe controlled substances.\n\n" +
            "IMPORTANT UI TRIGGERS:\n" +
            "You MUST append these exact lines at the very end of your response for the UI to render correctly:\n" +
            "Triage Level: [HIGH / MODERATE / CRITICAL / LOW]\n" +
            "Recommended Specialist: [Exact Specialist Name, e.g., Dermatologist, Cardiologist, etc.]";

        String safeQuery = sanitizeInput(query);
        String userPrompt = "Patient History: " + history + "\n\nCurrent Query: " + safeQuery;

        try {
            String combinedPrompt = systemPrompt + "\n\n" + userPrompt;
            String llmResponse = geminiAiService.getCompletion(combinedPrompt);
            if (llmResponse != null && !llmResponse.contains("\"error\"")) {
                return llmResponse;
            }
            if (llmResponse != null) {
                return "Condition Summary:\nAPI Error: " + llmResponse + "\n\n" +
                       "Triage Level: MODERATE\n" +
                       "Recommended Specialist: General Physician";
            }
        } catch (Exception e) {
            System.err.println("Failed to reach Groq AI Engine: " + e.getMessage());
        }

        String q = query.toLowerCase().replaceAll("[^a-z0-9 ]", " ");
        String assessment = "I am your MediSync Copilot. Based on the clinical signals in your query, I have analyzed your situation against our institutional safety registry. ";
        String severity = "MODERATE";
        String specialist = "General Physician";
        String action = "A professional clinical evaluation at your nearest MediSync node is recommended for a definitive diagnosis.";
        String service = "General Clinical";
        String conditions = "Initial symptoms require physical examination for precise correlation.";
        String instructions = "Please monitor for any changes in symptom intensity or the development of new indicators.";
        String warning = "";

        String safetyPrefix = "";
        String fullContext = (history + " " + q).toLowerCase();
        if (matchesWord(fullContext, "allergy") || matchesWord(fullContext, "allergic") || matchesWord(fullContext, "penicillin")) {
            safetyPrefix = "IMPORTANT: I have noted your previously mentioned allergy from our clinical history. ";
        }

        // --- Triage Logic Chain ---
        if (matchesWord(q, "llm") || matchesWord(q, "model") || matchesWord(q, "system prompt") || matchesWord(q, "registry") || matchesWord(q, "json format")) {
            assessment = "Technical inquiry identified. Please restrict your query to clinical symptoms.";
            severity = "LOW";
            specialist = "MediSync Privacy Officer";
            action = "Return to clinical symptoms.";
            service = "System Security";
        }
        else if (matchesWord(q, "book") || matchesWord(q, "find") || matchesWord(q, "nearest") || matchesWord(q, "where is") || matchesWord(q, "schedule")) {
            assessment = "MediSync Navigator offers a streamlined portal for all scheduling.";
            severity = "LOW";
            specialist = "MediSync Navigator";
            action = "Navigate to /dashboard/booking.";
            service = "General Clinical";
        } else if (matchesWord(q, "records") || matchesWord(q, "result") || matchesWord(q, "download") || matchesWord(q, "insurance") || matchesWord(q, "password")) {
            assessment = "MediSync Support provides administrative oversight for your records.";
            severity = "LOW";
            specialist = "MediSync Support";
            action = "Navigate to /dashboard/reports.";
            service = "General Clinical";
        }
        // --- LEVEL 1: EMERGENCY RED-FLAGS (Highest Priority) ---
        else if (matchesWord(q, "throat closing") || matchesWord(q, "peanut") || matchesWord(q, "swollen tongue") || matchesWord(q, "hives") || matchesWord(q, "anaphylaxis")) {
            assessment = safetyPrefix + "Symptoms suggest Anaphylaxis (severe allergic reaction).";
            severity = "CRITICAL";
            specialist = "Allergist";
            action = "Use an Epipen and seek EMERGENCY care.";
            service = "Emergency & Trauma Care";
            warning = "ANAPHYLAXIS ALERT.";
        } else if (matchesWord(q, "drooping") || matchesWord(q, "weakness") || matchesWord(q, "slurred") || matchesWord(q, "confusion") || matchesWord(q, "vision loss") || matchesWord(q, "stiff neck") || matchesWord(q, "seizure") || matchesWord(q, "unconscious") || matchesWord(q, "memory loss") || matchesWord(q, "balance")) {
            assessment = safetyPrefix + "Acute neurological deficit identified.";
            severity = "CRITICAL";
            specialist = "Neurologist";
            action = "Seek IMMEDIATE Stroke Center or Emergency care.";
            service = "Emergency & Trauma Care";
            warning = "NEUROLOGICAL EMERGENCY.";
        } else if (matchesWord(q, "self-harm") || matchesWord(q, "dark thoughts") || matchesWord(q, "suicidal") || matchesWord(q, "mental crisis") || matchesWord(q, "panic attack")) {
            assessment = safetyPrefix + "Severe psychiatric distress identified.";
            severity = "CRITICAL";
            specialist = "Psychiatrist";
            action = "Seek immediate Mental Health Support.";
            service = "Emergency & Trauma Care";
            warning = "CRISIS SIGNAL.";
        } else if (matchesWord(q, "pregnant") || matchesWord(q, "contraction") || matchesWord(q, "water broke") || matchesWord(q, "pre-eclampsia") || matchesWord(q, "bleeding")) {
            assessment = safetyPrefix + "Acute obstetric complication identified.";
            severity = "CRITICAL";
            specialist = "Obstetrician / Gynecologist";
            action = "Proceed to Labor & Delivery triage.";
            service = "Emergency & Trauma Care";
            warning = "OBSTETRIC ALERT.";
        } else if (matchesWord(q, "chest") || matchesWord(q, "heart attack") || matchesWord(q, "atrial fibrillation") || matchesWord(q, "statin") || matchesWord(q, "statins") || matchesWord(q, "cardiology") || matchesWord(q, "pounding heart") || matchesWord(q, "crushing") || matchesWord(q, "shortness of breath") || matchesWord(q, "breathing difficulty") || matchesWord(q, "asthma") || matchesWord(q, "oxygen")) {
            assessment = safetyPrefix + "Acute cardiovascular or respiratory signal identified.";
            severity = "CRITICAL";
            specialist = "Cardiologist";
            action = "Navigate IMMEDIATELY to Emergency.";
            service = "Emergency & Trauma Care";
            warning = "LIFE-SAFETY ALERT.";
        } else if (matchesWord(q, "fall") || matchesWord(q, "bent arm") || matchesWord(q, "car accident") || matchesWord(q, "laceration") || matchesWord(q, "accident") || matchesWord(q, "internal bleeding") || matchesWord(q, "fainted")) {
            assessment = safetyPrefix + "Acute traumatic injury identified.";
            severity = "CRITICAL";
            specialist = "Emergency Physician / Orthopedic Surgeon";
            action = "Navigate immediately to Emergency & Trauma.";
            service = "Emergency & Trauma Care";
            warning = "TRAUMA SIGNAL.";
        }
        // --- LEVEL 2: SEMANTIC REGISTRY (MedQuAD Parity) ---
        else if (ClinicalRegistry.isNeurological(q)) {
            assessment = safetyPrefix + "Neurological clinical entity identified via institutional registry.";
            severity = "HIGH";
            specialist = "Neurologist";
            action = "Secure a neurological evaluation via our clinical dashboard.";
            service = "General Clinical";
        } else if (ClinicalRegistry.isOncological(q)) {
            assessment = safetyPrefix + "Oncological clinical entity identified via institutional registry.";
            severity = "HIGH";
            specialist = "Oncologist";
            action = "Secure an oncological consultation for specialized diagnostic review.";
            service = "General Clinical";
        } else if (ClinicalRegistry.isMetabolic(q)) {
            assessment = safetyPrefix + "Metabolic or endocrine clinical entity identified via institutional registry.";
            severity = "HIGH";
            specialist = "Diabetologist";
            action = "Secure a consultation for metabolic management.";
            service = "General Clinical";
        }
        // --- LEVEL 3: INSTITUTIONAL SERVICES & SPECIALIZED TRIAGE ---
        else if (matchesWord(q, "mri") || matchesWord(q, "ct scan") || matchesWord(q, "xray") || matchesWord(q, "ultrasound") || matchesWord(q, "radiology")) {
            assessment = safetyPrefix + "Diagnostic imaging protocol identified.";
            severity = "MODERATE";
            specialist = "Radiologist";
            action = "Navigate to /dashboard/booking?mode=service&category=Diagnostic%20Services.";
            service = "Diagnostic Services";
        } else if (matchesWord(q, "surgery") || matchesWord(q, "operation") || matchesWord(q, "surgical") || matchesWord(q, "pre-op")) {
            assessment = safetyPrefix + "Surgical intervention requirement identified.";
            severity = "HIGH";
            specialist = "Surgeon";
            action = "Navigate to /dashboard/booking?mode=service&category=Surgery%20Booking.";
            service = "Surgery Booking";
        } else if (matchesWord(q, "blood in urine") || matchesWord(q, "kidney") || matchesWord(q, "pee") || matchesWord(q, "bladder") || matchesWord(q, "urination")) {
            assessment = safetyPrefix + "Urological specialty symptoms detected.";
            severity = "HIGH";
            specialist = "Urologist";
            action = "Book a consultation with a Urologist.";
            service = "General Clinical";
        } else if (matchesWord(q, "diabetes") || matchesWord(q, "diabetis") || matchesWord(q, "sugar") || matchesWord(q, "thirsty") || matchesWord(q, "insulin") || matchesWord(q, "urine") || matchesWord(q, "glucose") || matchesWord(q, "ketones") || matchesWord(q, "400")) {
            assessment = safetyPrefix + "Metabolic crisis or glycemic signals identified.";
            severity = "HIGH";
            specialist = "Diabetologist";
            action = "Seek urgent Diabetologist consultation.";
            service = "General Clinical";
        } else if (matchesWord(q, "yellow") || matchesWord(q, "jaundice") || matchesWord(q, "liver") || matchesWord(q, "hepatitis") || matchesWord(q, "pale stool")) {
            assessment = safetyPrefix + "Hepatobiliary dysfunction signals detected.";
            severity = "HIGH";
            specialist = "Hepatologist";
            action = "Seek evaluation within 24 hours.";
            service = "General Clinical";
        } else if (matchesWord(q, "stomach") || matchesWord(q, "abdominal") || matchesWord(q, "vomiting") || matchesWord(q, "digestion") || matchesWord(q, "gut")) {
            assessment = safetyPrefix + "Gastrointestinal symptoms identified.";
            severity = "HIGH";
            specialist = "Gastroenterologist";
            action = "Book a consultation with a Gastroenterologist.";
            service = "General Clinical";
        } else if (matchesWord(q, "lupus") || matchesWord(q, "butterfly rash") || matchesWord(q, "rheumatology") || matchesWord(q, "joint pain") || matchesWord(q, "arthritis")) {
            assessment = safetyPrefix + "Rheumatological or systemic autoimmune signals detected.";
            severity = "HIGH";
            specialist = "Rheumatologist";
            action = "Book a consultation with a Rheumatologist.";
            service = "General Clinical";
        } else if (matchesWord(q, "skin") || matchesWord(q, "rash") || matchesWord(q, "itching") || matchesWord(q, "mole") || matchesWord(q, "dermatology")) {
            assessment = safetyPrefix + "Dermatological signals identified.";
            severity = "HIGH";
            specialist = "Dermatologist";
            action = "Book a consultation with a Dermatologist.";
            service = "General Clinical";
        } else if (matchesWord(q, "child") || matchesWord(q, "pediatric") || matchesWord(q, "infant") || matchesWord(q, "baby")) {
            assessment = safetyPrefix + "Pediatric clinical signals identified.";
            severity = "HIGH";
            specialist = "Pediatrician";
            action = "Seek evaluation at a Pediatric node.";
            service = "General Clinical";
        } else if (matchesWord(q, "weight loss") || matchesWord(q, "lump") || matchesWord(q, "tumor") || matchesWord(q, "cancer") || matchesWord(q, "lymph")) {
            assessment = safetyPrefix + "Persistent systemic symptoms identified.";
            severity = "HIGH";
            specialist = "Oncologist";
            action = "Book a diagnostic consultation.";
            service = "General Clinical";
        } else if (matchesWord(q, "vision") || matchesWord(q, "eye") || matchesWord(q, "flashes")) {
            assessment = safetyPrefix + "Ophthalmological symptoms identified.";
            severity = "HIGH";
            specialist = "Ophthalmologist";
            action = "Seek evaluation within 24 hours.";
            service = "General Clinical";
        }
        else if (matchesWord(q, "ear") || matchesWord(q, "hearing") || matchesWord(q, "sore throat") || matchesWord(q, "sinus") || matchesWord(q, "tonsil")) {
            assessment = safetyPrefix + "ENT symptoms detected.";
            severity = "MODERATE";
            specialist = "Otolaryngologist (ENT Specialist)";
            action = "Book an appointment with an ENT specialist.";
            service = "General Clinical";
        } else if (matchesWord(q, "joint") || matchesWord(q, "knee") || matchesWord(q, "shoulder") || matchesWord(q, "broken") || matchesWord(q, "arm") || matchesWord(q, "hip")) {
            assessment = safetyPrefix + "Musculoskeletal signals identified.";
            severity = "MODERATE";
            specialist = "Orthopedic Surgeon";
            action = "Book a consultation in the Orthopedic node.";
            service = "General Clinical";
        }
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

    private boolean matchesWord(String text, String target) {
        if (text == null || target == null) return false;
        // Use word boundary matching to prevent substring collisions (e.g., 'research' matching 'ear')
        return text.matches(".*\\b" + target.toLowerCase() + "\\b.*");
    }

    private boolean isError(String res) {
        return res == null || res.toLowerCase().contains("error") || res.toLowerCase().contains("sorry") || res.length() < 10;
    }
}
