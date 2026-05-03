package com.health.medisync.service;

import com.health.medisync.model.*;
import com.health.medisync.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Lazy;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiService {

    private final DoctorRepository doctorRepository;
    private final HospitalRepository hospitalRepository;
    private final AiQueryLogRepository aiQueryLogRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorService doctorService;
    private final GroqAiService groqAiService;
    
    private static final Map<String, String> sessionSummaries = new HashMap<>();

    public AiService(DoctorRepository doctorRepository, 
                     HospitalRepository hospitalRepository,
                     AiQueryLogRepository aiQueryLogRepository,
                     PrescriptionRepository prescriptionRepository,
                     AppointmentRepository appointmentRepository,
                     @Lazy DoctorService doctorService,
                     GroqAiService groqAiService) {
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
        this.aiQueryLogRepository = aiQueryLogRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.appointmentRepository = appointmentRepository;
        this.doctorService = doctorService;
        this.groqAiService = groqAiService;
    }

    public String generateResponse(String query, String userEmail, List<String> roles) {
        String lowerQuery = query.toLowerCase().trim();
        boolean isDoctor = roles != null && roles.stream().anyMatch(r -> r.equalsIgnoreCase("ROLE_DOCTOR"));
        boolean isHospitalAdmin = roles != null && roles.stream().anyMatch(r -> r.equalsIgnoreCase("ROLE_HOSPITAL_ADMIN"));

        if (isDoctor || isHospitalAdmin) return generateProfessionalResponse(lowerQuery, userEmail);

        // --- POLYGLOT DETECTION ---
        String language = detectLanguage(query);

        // 1. Emergency Detection
        if (isEmergency(lowerQuery)) {
            return translate("🚨 **CRITICAL EMERGENCY DETECTED**\n\nPlease visit the nearest ER or call 108/911 immediately.", language);
        }

        // 2. Prescription Logic
        if (userEmail != null && (lowerQuery.contains("medicine") || lowerQuery.contains("prescription") || lowerQuery.contains("மருந்து") || lowerQuery.contains("दवा"))) {
            List<Prescription> active = prescriptionRepository.findByPatientEmailAndIsActiveTrue(userEmail);
            if (!active.isEmpty()) {
                String meds = active.stream().map(Prescription::getMedicineName).collect(Collectors.joining(", "));
                return translate("💊 **Active Meds:** " + meds + "\n\nCheck your Medical History for details.", language);
            }
        }

        // 3. Detailed Symptom Analysis
        String specialty = mapSymptomToSpecialty(lowerQuery);
        if (specialty != null) {
            String advice = getGeneralAdvice(specialty);
            List<Doctor> specialists = doctorRepository.findAll().stream()
                .filter(d -> d.isApproved() && d.getSpecialization().toLowerCase().contains(specialty))
                .collect(Collectors.toList());

            StringBuilder sb = new StringBuilder();
            sb.append("### 🏥 ").append(translate("Specialist Recommendation", language)).append("\n");
            sb.append(translate("For " + specialty.toUpperCase() + " issues, " + advice, language)).append("\n\n");

            if (!specialists.isEmpty()) {
                sb.append("**").append(translate("Available Specialists:", language)).append("**\n");
                for (Doctor d : specialists.stream().limit(2).collect(Collectors.toList())) {
                    sb.append("- **Dr. ").append(d.getName()).append("** (").append(d.getSpecialization()).append(")\n");
                }
            } else {
                sb.append("⚠️ ").append(translate("Note: We currently don't have an approved " + specialty + " specialist. Please consult a General Physician.", language));
            }
            return sb.toString();
        }

        // --- NEURAL REASONING FALLBACK (Groq Llama-3.3-70b) ---
        try {
            String prompt = "You are the MediSync Clinical Assistant. " +
                "User Role: " + (isDoctor ? "Doctor" : "Patient") + ". " +
                "Language: " + language + ". " +
                "Context: You are integrated into a Hospital Operating System. " +
                "Query: " + query;
            
            String neuralResponse = groqAiService.getCompletion(prompt);
            if (neuralResponse != null && !neuralResponse.contains("error")) {
                return neuralResponse;
            }
        } catch (Exception e) {
            System.err.println("NEURAL_HUB_ERROR: " + e.getMessage());
        }

        // 5. Default Greeting (If Neural fails)
        return translate("Hello! I am your MediSync Clinical Concierge. How can I help you today?", language);
    }

    private String detectLanguage(String query) {
        // Tamil Range: \u0B80-\u0BFF
        if (query.matches(".*[\\u0B80-\\u0BFF].*")) return "tamil";
        // Hindi/Sanskrit (Devanagari) Range: \u0900-\u097F
        if (query.matches(".*[\\u0900-\\u097F].*")) return "hindi";
        // Telugu Range: \u0C00-\u0C7F
        if (query.matches(".*[\\u0C00-\\u0C7F].*")) return "telugu";
        return "english";
    }

    private String translate(String text, String lang) {
        if ("tamil".equals(lang)) {
            if (text.contains("Hello")) return "வணக்கம்! நான் உங்கள் MediSync மருத்துவ உதவியாளர். நான் உங்களுக்கு எப்படி உதவ முடியும்?";
            if (text.contains("Specialist Recommendation")) return "மருத்துவ நிபுணர் பரிந்துரை";
            if (text.contains("Active Meds")) return "தற்போதைய மருந்துகள்";
            if (text.contains("ER")) return "🚨 **அவசரநிலை!** தயவுசெய்து உடனடியாக மருத்துவமனைக்குச் செல்லவும்.";
            if (text.contains("dental")) return "பல் தொடர்பான பிரச்சனைகளுக்கு, சூடான அல்லது குளிர்ந்த உணவைத் தவிர்க்கவும்.";
            if (text.contains("cardiology")) return "இதயத் துடிப்பைக் கண்காணித்து, கடினமான வேலைகளைத் தவிர்க்கவும்.";
            if (text.contains("approved")) return "தற்போது இந்த பிரிவில் மருத்துவர்கள் இல்லை. பொது மருத்துவரை அணுகவும்.";
            return "உங்களுக்கு உதவ நான் தயாராக உள்ளேன். உங்கள் அறிகுறிகளை விவரிக்கவும்.";
        }
        if ("hindi".equals(lang)) {
            if (text.contains("Hello")) return "नमस्ते! मैं आपका MediSync क्लिनिकल कंसीयज हूँ। मैं आपकी कैसे मदद कर सकता हूँ?";
            return "मैं आपकी मदद के लिए यहाँ हूँ। कृपया अपने लक्षणों के बारे में बताएं।";
        }
        return text;
    }

    private String getGeneralAdvice(String specialty) {
        switch (specialty) {
            case "dental": return "it is important to avoid very hot or cold food.";
            case "cardiology": return "avoid strenuous activity.";
            default: return "a clinical evaluation is recommended.";
        }
    }

    private String generateProfessionalResponse(String query, String email) {
        return "Greetings, Doctor. I am your Clinical Operational Intelligence module.";
    }

    private String mapSymptomToSpecialty(String query) {
        // English + Tamil + Hindi Keywords
        if (query.contains("tooth") || query.contains("teeth") || query.contains("பல்") || query.contains("दांत")) return "dental";
        if (query.contains("heart") || query.contains("chest") || query.contains("இதயம்") || query.contains("दिल")) return "cardiology";
        if (query.contains("fever") || query.contains("cold") || query.contains("காய்ச்சல்") || query.contains("बुखार") || query.contains("வலி") || query.contains("pain")) return "general physician";
        return null;
    }

    private boolean isEmergency(String query) {
        return query.contains("stroke") || query.contains("cannot breathe") || query.contains("blood");
    }

    public String getLatestBrief(String email) {
        return sessionSummaries.getOrDefault(email, "No AI context.");
    }
}
