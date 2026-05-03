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

    public String generateResponse(String query, String userEmail, List<String> roles, String location) {
        String lowerQuery = query.toLowerCase().trim();
        boolean isDoctor = roles != null && roles.stream().anyMatch(r -> r.equalsIgnoreCase("ROLE_DOCTOR"));
        boolean isHospitalAdmin = roles != null && roles.stream().anyMatch(r -> r.equalsIgnoreCase("ROLE_HOSPITAL_ADMIN"));

        if (isDoctor || isHospitalAdmin) return generateProfessionalResponse(lowerQuery, userEmail);

        // --- POLYGLOT DETECTION ---
        String language = detectLanguage(query);

        // 1. Emergency Detection (High Precision)
        if (isEmergency(lowerQuery)) {
            return translate("🚨 **CRITICAL EMERGENCY DETECTED**\n\n- Visit the nearest ER immediately.\n- Call 108 or 911 now.\n- Do not wait for further AI analysis.", language);
        }

        // 2. Prescription Logic
        if (userEmail != null && (lowerQuery.contains("medicine") || lowerQuery.contains("prescription") || lowerQuery.contains("மருந்து") || lowerQuery.contains("दवा"))) {
            List<Prescription> active = prescriptionRepository.findByPatientEmailAndIsActiveTrue(userEmail);
            if (!active.isEmpty()) {
                String meds = active.stream().map(Prescription::getMedicineName).collect(Collectors.joining(", "));
                return translate("💊 **Active Prescriptions:**\n- " + meds + "\n\n### 📝 Note\n- Check your Medical History for full dosage details.", language);
            }
        }

        // 3. Symptom to Specialist Mapping
        String specialty = mapSymptomToSpecialty(lowerQuery);
        if (specialty != null) {
            String advice = getGeneralAdvice(specialty);
            List<Doctor> specialists = doctorRepository.findAll().stream()
                .filter(d -> d.isApproved() && d.getSpecialization().toLowerCase().contains(specialty))
                .collect(Collectors.toList());

            StringBuilder sb = new StringBuilder();
            sb.append("### 🏥 ").append(translate("Clinical Recommendation", language)).append("\n");
            sb.append("- ").append(translate("For " + specialty.toUpperCase() + " issues: " + advice, language)).append("\n");

            if (!specialists.isEmpty()) {
                sb.append("\n### 👨‍⚕️ ").append(translate("Approved Specialists", language)).append("\n");
                for (Doctor d : specialists.stream().limit(2).collect(Collectors.toList())) {
                    sb.append("- **Dr. ").append(d.getName()).append("** (").append(d.getSpecialization()).append(")\n");
                }
            }
            return sb.toString();
        }

        // 4. Real-time Context Extraction (Temporal + Clinical)
        String currentTime = java.time.LocalTime.now().toString();
        String currentDate = java.time.LocalDate.now().toString();
        String appointmentContext = "None";
        if (userEmail != null) {
            List<Appointment> todayAppts = appointmentRepository.findByPatientEmail(userEmail).stream()
                .filter(a -> a.getAppointmentDate().isEqual(LocalDate.now()))
                .collect(Collectors.toList());
            if (!todayAppts.isEmpty()) {
                appointmentContext = todayAppts.stream()
                    .map(a -> "- Dr. " + a.getDoctor().getName() + " at " + a.getTimeSlot())
                    .collect(Collectors.joining("\n"));
            }
        }

        // --- NEURAL REASONING (Telemetry + Temporal Augmented) ---
        try {
            List<Doctor> allDoctors = doctorRepository.findByApprovedTrue();
            String doctorList = allDoctors.stream()
                .map(d -> "- Dr. " + d.getName() + " (" + d.getSpecialization() + ")")
                .collect(Collectors.joining("\n"));

            List<Hospital> allHospitals = hospitalRepository.findAll();
            String hospitalList = allHospitals.stream()
                .map(h -> "- " + h.getName() + " (" + (h.getAddress() != null ? h.getAddress() : "Active Node") + ")")
                .collect(Collectors.joining("\n"));

            String prompt = "You are the MediSync Real-time Clinical Assistant. " +
                "System Time: " + currentTime + " (" + currentDate + "). " +
                "User Role: " + (isDoctor ? "Doctor" : "Patient") + ". " +
                "User's TODAY Schedule:\n" + appointmentContext + "\n" +
                "Current Location (Telemetry): " + (location != null ? location : "Unknown") + ". " +
                "Language: " + language + ". " +
                "STRICT RESPONSE RULES:\n" +
                "1. NO PARAGRAPHS. NO GREETINGS. NO DISCLAIMERS.\n" +
                "2. ONLY answer what the user asked. Be extremely concise.\n" +
                "3. Use Markdown headers (###) and Bullet Points (-) for EVERYTHING.\n" +
                "4. NAVIGATION: Always provide a detailed street address when mentioning a hospital or facility.\n" +
                "5. GROUNDING - APPROVED HOSPITALS:\n" + hospitalList + "\n" +
                "6. GROUNDING - APPROVED DOCTORS:\n" + doctorList + "\n" +
                "7. If a user asks about a hospital or doctor NOT in the lists above, say 'I couldn't find that in our current clinical network.'\n\n" +
                "Query: " + query;
            
            String neuralResponse = groqAiService.getCompletion(prompt);
            if (neuralResponse != null && !neuralResponse.contains("error")) {
                return neuralResponse;
            }
        } catch (Exception e) {
            System.err.println("NEURAL_HUB_ERROR: " + e.getMessage());
        }

        return translate("### 🤖 Clinical Status\n- I am here to help.\n- Please describe your clinical query in detail.", language);
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
        // High-precision emergency detection (Avoid false positives for 'blood bank' or 'blood test')
        if (query.contains("blood bank") || query.contains("blood test") || query.contains("blood group")) return false;
        
        return query.contains("stroke") || 
               query.contains("cannot breathe") || 
               query.contains("unconscious") || 
               query.contains("heart attack") ||
               query.contains("heavy bleeding") ||
               query.contains("choking");
    }

    public String getLatestBrief(String email) {
        return sessionSummaries.getOrDefault(email, "No AI context.");
    }
}
