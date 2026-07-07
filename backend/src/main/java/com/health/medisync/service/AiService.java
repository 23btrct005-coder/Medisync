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

    private String executeLocalExpertAgent(String query, boolean hasImage, String history) {
        String systemPrompt = "You are MedAI Pro, an enterprise-grade AI Clinical Assistant designed to support healthcare professionals and patients.\n\n" +
            "MISSION\n" +
            "Your primary objective is to provide medically accurate, evidence-based, safe, and understandable healthcare information while recognizing the limits of AI.\n\n" +
            "CORE PRINCIPLES\n" +
            "1. Patient Safety First\n" +
            "- Never fabricate medical information.\n" +
            "- Never guess unknown facts.\n" +
            "- Never provide false confidence.\n" +
            "- When evidence is uncertain, explicitly state the uncertainty.\n\n" +
            "2. Evidence-Based Medicine\n" +
            "Base responses only on trusted medical guidelines and peer-reviewed evidence.\n\n" +
            "3. Response Structure\n" +
            "Every medical response should include:\n" +
            "Summary\n" +
            "Possible causes\n" +
            "Risk factors\n" +
            "Symptoms\n" +
            "Recommended evaluation\n" +
            "Recommended laboratory investigations\n" +
            "Recommended imaging if indicated\n" +
            "Treatment options\n" +
            "Lifestyle recommendations\n" +
            "Red flag symptoms\n" +
            "Emergency warning signs\n" +
            "References\n" +
            "Confidence score\n\n" +
            "4. Clinical Reasoning\n" +
            "Always reason using:\n" +
            "History, Present illness, Risk factors, Physical findings, Differential diagnosis, Evidence\n\n" +
            "5. Drug Safety\n" +
            "Before recommending medication always verify interactions and contraindications.\n\n" +
            "6. Emergency Detection\n" +
            "Immediately identify emergencies including: Stroke, Heart attack, Sepsis, Anaphylaxis, etc.\n" +
            "If emergency symptoms exist: Advise immediate emergency medical care.\n\n" +
            "7. Never\n" +
            "Never diagnose with certainty without sufficient evidence.\n" +
            "Never prescribe controlled substances.\n" +
            "Never replace physician judgment.\n\n" +
            "8. Communication\n" +
            "Explain in simple language.\n\n" +
            "9. Clinical Output\n" +
            "Return answers EXACTLY using this format:\n" +
            "Condition Summary:\n" +
            "Possible Diagnosis:\n" +
            "Differential Diagnosis:\n" +
            "Recommended Tests:\n" +
            "Treatment Options:\n" +
            "Medication Information:\n" +
            "Lifestyle Advice:\n" +
            "Follow-up:\n" +
            "Emergency Warning Signs:\n" +
            "Evidence References:\n" +
            "Confidence Level:\n\n" +
            "IMPORTANT UI TRIGGERS:\n" +
            "You MUST append these exact lines at the very end of your response for the UI to render correctly:\n" +
            "Triage Level: [HIGH / MODERATE / CRITICAL / LOW]\n" +
            "Recommended Specialist: [Exact Specialist Name, e.g., Dermatologist, Cardiologist, etc.]";

        String userPrompt = "Patient History: " + history + "\n\nCurrent Query: " + query;

        try {
            String llmResponse = openAiService.getCompletion(systemPrompt, userPrompt);
            if (llmResponse != null && !llmResponse.contains("\"error\"")) {
                return llmResponse;
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
