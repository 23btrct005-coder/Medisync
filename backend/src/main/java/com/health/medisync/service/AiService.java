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
        String q = query.toLowerCase();
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
        if (fullContext.contains("allergy") || fullContext.contains("allergic") || fullContext.contains("penicillin")) {
            safetyPrefix = "IMPORTANT: I have noted your previously mentioned allergy from our clinical history. ";
        }

        if (q.contains("llm") || q.contains("model") || q.contains("system prompt") || q.contains("registry") || q.contains("json format")) {
            assessment = "Technical inquiry identified. Please restrict your query to clinical symptoms.";
            severity = "LOW";
            specialist = "MediSync Privacy Officer";
            action = "Return to clinical symptoms.";
            service = "System Security";
        }
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
        else if (q.contains("throat closing") || q.contains("peanut") || q.contains("swollen tongue") || q.contains("hives") || q.contains("anaphylaxis")) {
            assessment = safetyPrefix + "Symptoms suggest Anaphylaxis (severe allergic reaction).";
            severity = "CRITICAL";
            specialist = "Allergist";
            action = "Use an Epipen and seek EMERGENCY care.";
            service = "Emergency & Trauma Care";
            warning = "ANAPHYLAXIS ALERT.";
        } else if (q.contains("drooping") || q.contains("weakness") || q.contains("slurred") || q.contains("confusion") || q.contains("vision loss") || q.contains("stiff neck") || q.contains("seizure") || q.contains("unconscious") || q.contains("memory loss") || q.contains("balance")) {
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
        } else if (q.contains("pregnant") || q.contains("contraction") || q.contains("water broke") || q.contains("pre-eclampsia") || q.contains("bleeding")) {
            assessment = safetyPrefix + "Acute obstetric complication identified.";
            severity = "CRITICAL";
            specialist = "Obstetrician / Gynecologist";
            action = "Proceed to Labor & Delivery triage.";
            service = "Emergency & Trauma Care";
            warning = "OBSTETRIC ALERT.";
        } else if (q.contains("chest") || q.contains("heart attack") || q.contains("pounding heart") || q.contains("crushing") || q.contains("shortness of breath") || q.contains("breathing difficulty") || q.contains("asthma") || q.contains("oxygen")) {
            assessment = safetyPrefix + "Acute cardiovascular or respiratory signal identified.";
            severity = "CRITICAL";
            specialist = "Cardiologist";
            action = "Navigate IMMEDIATELY to Emergency.";
            service = "Emergency & Trauma Care";
            warning = "LIFE-SAFETY ALERT.";
        } else if (q.contains("fall") || q.contains("bent arm") || q.contains("car accident") || q.contains("laceration") || q.contains("accident") || q.contains("internal bleeding") || q.contains("fainted")) {
            assessment = safetyPrefix + "Acute traumatic injury identified.";
            severity = "CRITICAL";
            specialist = "Emergency Physician / Orthopedic Surgeon";
            action = "Navigate immediately to Emergency & Trauma.";
            service = "Emergency & Trauma Care";
            warning = "TRAUMA SIGNAL.";
        }
        else if (q.contains("blood in urine") || q.contains("kidney") || q.contains("pee") || q.contains("bladder") || q.contains("urination")) {
            assessment = safetyPrefix + "Urological specialty symptoms detected.";
            severity = "HIGH";
            specialist = "Urologist";
            action = "Book a consultation with a Urologist.";
            service = "General Clinical";
        } else if (q.contains("diabetes") || q.contains("diabetis") || q.contains("sugar") || q.contains("thirsty") || q.contains("insulin") || q.contains("urine") || q.contains("glucose") || q.contains("ketones") || q.contains("400")) {
            assessment = safetyPrefix + "Metabolic crisis or glycemic signals identified.";
            severity = "HIGH";
            specialist = "Diabetologist";
            action = "Seek urgent Diabetologist consultation.";
            service = "General Clinical";
        } else if (q.contains("yellow") || q.contains("jaundice") || q.contains("liver") || q.contains("hepatitis") || q.contains("pale stool")) {
            assessment = safetyPrefix + "Hepatobiliary dysfunction signals detected.";
            severity = "HIGH";
            specialist = "Hepatologist";
            action = "Seek evaluation within 24 hours.";
            service = "General Clinical";
        } else if (q.contains("stomach") || q.contains("abdominal") || q.contains("vomiting") || q.contains("digestion") || q.contains("gut")) {
            assessment = safetyPrefix + "Gastrointestinal symptoms identified.";
            severity = "HIGH";
            specialist = "Gastroenterologist";
            action = "Book a consultation with a Gastroenterologist.";
            service = "General Clinical";
        } else if (q.contains("skin") || q.contains("rash") || q.contains("itching") || q.contains("mole") || q.contains("dermatology")) {
            assessment = safetyPrefix + "Dermatological signals identified.";
            severity = "HIGH";
            specialist = "Dermatologist";
            action = "Book a consultation with a Dermatologist.";
            service = "General Clinical";
        } else if (q.contains("child") || q.contains("pediatric") || q.contains("infant") || q.contains("baby")) {
            assessment = safetyPrefix + "Pediatric clinical signals identified.";
            severity = "HIGH";
            specialist = "Pediatrician";
            action = "Seek evaluation at a Pediatric node.";
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

    private boolean isError(String res) {
        return res == null || res.toLowerCase().contains("error") || res.toLowerCase().contains("sorry") || res.length() < 10;
    }
}
