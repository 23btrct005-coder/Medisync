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

            if (!specialists.isEmpty()) {
                StringBuilder sb = new StringBuilder();
                sb.append("### 🏥 ").append(translate("Specialist Recommendation", language)).append("\n");
                sb.append(translate("For " + specialty.toUpperCase() + " issues, " + advice, language)).append("\n\n");
                sb.append("**").append(translate("Available Specialists:", language)).append("**\n");
                for (Doctor d : specialists.stream().limit(2).collect(Collectors.toList())) {
                    sb.append("- **Dr. ").append(d.getName()).append("** (").append(d.getSpecialization()).append(")\n");
                }
                return sb.toString();
            }
        }

        // --- NEURAL REASONING FALLBACK (Groq Llama-3.3-70b) ---
        try {
            // Fetch real clinical data to ground the AI and prevent hallucinations
            List<Doctor> allDoctors = doctorRepository.findByApprovedTrue();
            String doctorList = allDoctors.stream()
                .map(d -> "- Dr. " + d.getName() + " (" + d.getSpecialization() + ")")
                .collect(Collectors.joining("\n"));

            String prompt = "You are the MediSync Clinical Assistant. " +
                "User Role: " + (isDoctor ? "Doctor" : "Patient") + ". " +
                "Language: " + language + ". " +
                "Style: Be highly interactive and use appropriate medical emojis. " +
                "STRICT GROUNDING RULES:\n" +
                "1. ONLY reference the following APPROVED DOCTORS currently in the building:\n" + doctorList + "\n" +
                "2. If a user asks for a doctor or specialist NOT in this list, say 'I couldn't find that specific doctor, but here are our available specialists.'\n" +
                "3. NEVER invent names like 'Dr. Smith' or fake room numbers.\n" +
                "4. If you don't know something about the hospital layout, suggest asking at the Physical Reception ✨.\n\n" +
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
            if (text.contains("Hello")) return "வணக்கம்! நான் உங்கள் MediSync மருத்துவ உதவியாளர். நான் உங்களுக்கு எப்படி உதவ முடியும்? ✨";
            if (text.contains("Specialist Recommendation")) return "மருத்துவ நிபுணர் பரிந்துரை 🩺";
            if (text.contains("Available Specialists")) return "கிடைக்கக்கூடிய மருத்துவர்கள்:";
            if (text.contains("Active Meds")) return "தற்போதைய மருந்துகள் 💊";
            if (text.contains("ER")) return "🚨 **அவசரநிலை!** தயவுசெய்து உடனடியாக மருத்துவமனைக்குச் செல்லவும்.";
            if (text.contains("approved")) return "தற்போது இந்த பிரிவில் மருத்துவர்கள் இல்லை. பொது மருத்துவரை அணுகவும்.";
            return "உங்களுக்கு உதவ நான் தயாராக உள்ளேன். உங்கள் அறிகுறிகளை விவரிக்கவும். 🚑";
        }
        if ("hindi".equals(lang)) {
            if (text.contains("Hello")) return "नमस्ते! मैं आपका MediSync क्लिनिकल कंसीयज हूँ। मैं आपकी कैसे मदद कर सकता हूँ? ✨";
            if (text.contains("Specialist Recommendation")) return "विशेषज्ञ अनुशंसा 🩺";
            if (text.contains("Available Specialists")) return "उपलब्ध डॉक्टर:";
            return "मैं आपकी मदद के लिए यहाँ हूँ। कृपया अपने लक्षणों के बारे में बताएं। 🚑";
        }
        if ("telugu".equals(lang)) {
            if (text.contains("Hello")) return "నమస్కారం! నేను మీ మెడిసింక్ క్లినికల్ అసిస్టెంట్‌ని. మీకు ఎలా సహాయం చేయగలను? ✨";
            if (text.contains("Specialist Recommendation")) return "నిపుణుల సిఫార్సు 🩺";
            return "నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను. దయచేసి మీ లక్షణాలను తెలియజేయండి. 🚑";
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
        // High-precision keywords
        if (query.contains("tooth") || query.contains("teeth") || query.contains("பல்") || query.contains("दांत")) return "dental";
        if (query.contains("heart") || query.contains("chest") || query.contains("இதயம்") || query.contains("दिल")) return "cardiology";
        if (query.contains("brain") || query.contains("nerve") || query.contains("நரம்பு") || query.contains("दिमाग")) return "neurology";
        if (query.contains("child") || query.contains("baby") || query.contains("குழந்தை") || query.contains("बच्चा")) return "pediatrics";
        
        // General symptoms are now handled by Neural Reasoning to avoid false-negatives
        return null;
    }

    private boolean isEmergency(String query) {
        return query.contains("stroke") || query.contains("cannot breathe") || query.contains("blood");
    }

    public String getLatestBrief(String email) {
        return sessionSummaries.getOrDefault(email, "No AI context.");
    }
}
