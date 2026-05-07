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
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final ReportRepository reportRepository;
    private final GeminiAiService geminiAiService;
    
    private static final Map<String, String> sessionSummaries = new HashMap<>();

    public AiService(DoctorRepository doctorRepository, 
                     HospitalRepository hospitalRepository,
                     AiQueryLogRepository aiQueryLogRepository,
                     PrescriptionRepository prescriptionRepository,
                     AppointmentRepository appointmentRepository,
                     @Lazy DoctorService doctorService,
                     GroqAiService groqAiService,
                     UserRepository userRepository,
                     PatientRepository patientRepository,
                     ReportRepository reportRepository,
                     GeminiAiService geminiAiService) {
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
        this.aiQueryLogRepository = aiQueryLogRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.appointmentRepository = appointmentRepository;
        this.doctorService = doctorService;
        this.groqAiService = groqAiService;
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.reportRepository = reportRepository;
        this.geminiAiService = geminiAiService;
    }

    public String generateResponse(String query, List<Map<String, String>> history, String userEmail, List<String> roles, String location) {
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
            sb.append("### ✅ ").append(translate("Simple Guidance", language)).append("\n");
            sb.append("- ").append(translate(advice, language)).append("\n");

            if (!specialists.isEmpty()) {
                sb.append("\n### 📍 ").append(translate("Nearby Specialists", language)).append("\n");
                for (Doctor d : specialists.stream().limit(1).collect(Collectors.toList())) {
                    sb.append("- **Dr. ").append(d.getName()).append("** (").append(d.getSpecialization()).append(")\n");
                }
            }
            return sb.toString();
        }

        // 4. Real-time Context Extraction (Temporal + Clinical History)
        String currentTime = java.time.LocalTime.now().toString();
        String currentDate = java.time.LocalDate.now().toString();
        final StringBuilder clinicalHistory = new StringBuilder(userEmail != null ? "" : "None");
        
        if (userEmail != null) {
            Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(userEmail);
            if (userOpt.isPresent()) {
                User u = userOpt.get();
                patientRepository.findByUserId(u.getId()).ifPresent(p -> {
                    clinicalHistory.append("Patient Profile: ")
                        .append(p.getGender() != null ? p.getGender() + ", " : "")
                        .append(p.getAge() != null ? p.getAge() + " years old. " : "");
                    
                    if (p.getExistingDiseases() != null) clinicalHistory.append("Conditions: ").append(p.getExistingDiseases()).append(". ");
                    if (p.getAllergies() != null) clinicalHistory.append("Allergies: ").append(p.getAllergies()).append(". ");
                    if (p.getPastSurgeries() != null) clinicalHistory.append("History: ").append(p.getPastSurgeries()).append(". ");
                    if (p.getMedicalInfo() != null) clinicalHistory.append("Notes: ").append(p.getMedicalInfo()).append(". ");
                });

                List<Prescription> activeMeds = prescriptionRepository.findByPatientEmailAndIsActiveTrue(userEmail);
                if (!activeMeds.isEmpty()) {
                    clinicalHistory.append("Active Medications: ")
                        .append(activeMeds.stream().map(Prescription::getMedicineName).collect(Collectors.joining(", ")))
                        .append(". ");
                }
                
                List<Appointment> todayAppts = appointmentRepository.findByPatientId(u.getId()).stream()
                    .filter(a -> a.getAppointmentDate().isEqual(LocalDate.now()))
                    .collect(Collectors.toList());
                if (!todayAppts.isEmpty()) {
                    clinicalHistory.append("Today's Schedule: ")
                        .append(todayAppts.stream().map(a -> "- Dr. " + a.getDoctor().getName() + " at " + a.getTimeSlot()).collect(Collectors.joining("; ")))
                        .append(". ");
                }

                // --- INTEGRATE LATEST REPORT ---
                patientRepository.findByUserId(u.getId()).ifPresent(p -> {
                    List<Report> reports = reportRepository.findByPatientId(p.getId());
                    if (!reports.isEmpty()) {
                        Report latest = reports.stream()
                            .filter(r -> r.getAiSummary() != null && !r.getAiSummary().isEmpty())
                            .sorted((a, b) -> {
                                LocalDate da = a.getDocumentDate() != null ? a.getDocumentDate() : a.getUploadDate();
                                LocalDate db = b.getDocumentDate() != null ? b.getDocumentDate() : b.getUploadDate();
                                return db.compareTo(da);
                            })
                            .findFirst().orElse(null);
                        
                        if (latest != null) {
                            clinicalHistory.append("Latest Report Analysis (")
                                .append(latest.getFileName())
                                .append("): ")
                                .append(latest.getAiSummary())
                                .append(". ");
                        }
                    }
                });
            }
        }

        // --- CONVERSATION HISTORY ---
        StringBuilder historyContext = new StringBuilder();
        if (history != null && !history.isEmpty()) {
            historyContext.append("Previous Conversation Context:\n");
            for (Map<String, String> msg : history) {
                historyContext.append(msg.get("role").toUpperCase()).append(": ").append(msg.get("text")).append("\n");
            }
        }

        // --- NEURAL REASONING (Expert Physician Profile) ---
        try {
            List<Doctor> allDoctors = doctorRepository.findByApprovedTrue();
            String doctorList = allDoctors.stream()
                .map(d -> {
                    String affiliation = d.getHospitalEntity() != null ? "INSTITUTIONAL: " + d.getHospitalEntity().getName() : "PRIVATE PRACTITIONER";
                    String address = d.getClinicAddress() != null ? d.getClinicAddress() : "Consultation Node";
                    String services = (d.getProceduresHandled() != null ? d.getProceduresHandled() : "") + 
                                     (d.getTreatmentFocus() != null ? " | Focus: " + d.getTreatmentFocus() : "");
                    String capacity = d.getServiceCapacity() != null ? " | THROUGHPUT (Concurrent Slots): " + d.getServiceCapacity() : " | Default Capacity: 1";
                    String timings = d.getConsultationTimings() != null ? " | HOURS: " + d.getConsultationTimings() : "";
                    return String.format("- Dr. %s (%s) [%s]%s%s - Address: %s - Services: %s", 
                         d.getName(), d.getSpecialization(), affiliation, capacity, timings, address, services.isEmpty() ? "General Clinical Care" : services);
                })
                .collect(Collectors.joining("\n"));

            List<Hospital> allHospitals = hospitalRepository.findAll();
            String hospitalList = allHospitals.stream()
                .map(h -> {
                    String fullAddress = String.format("%s, %s, %s %s", 
                        h.getStreet() != null ? h.getStreet() : "",
                        h.getCity() != null ? h.getCity() : "",
                        h.getState() != null ? h.getState() : "",
                        h.getPinCode() != null ? h.getPinCode() : "").trim();
                    String capacity = h.getServiceCapacity() != null ? " | INSTITUTIONAL THROUGHPUT: " + h.getServiceCapacity() : "";
                    String timings = h.getConsultationTimings() != null ? " | HOURS: " + h.getConsultationTimings() : "";
                    return String.format("- %s (Type: %s)%s%s - Address: %s - Departments: %s - Clinical Facilities: %s", 
                        h.getName(), 
                        h.getHospitalType() != null ? h.getHospitalType() : "General",
                        capacity, timings,
                        fullAddress.isEmpty() ? h.getLocation() : fullAddress,
                        h.getDepartments() != null ? h.getDepartments() : "General Medicine",
                        h.getServices() != null ? h.getServices() : "Emergency Triage");
                })
                .collect(Collectors.joining("\n"));

            String prompt = "### SYSTEM INSTRUCTION: INSTITUTIONAL CLINICAL INTELLIGENCE ENGINE (ICIE)\n" +
                "You are the MediSync EXPERT CLINICAL PHYSICIAN, a high-fidelity reasoning engine trained on vast medical data.\n" +
                "Current Temporal Context: " + currentTime + " (" + currentDate + ").\n" +
                "Patient Profile Tracking: " + clinicalHistory.toString() + ".\n" +
                "Spatial Awareness: " + (location != null ? location : "Unknown") + ".\n" +
                "Multilingual Synthesis: " + language + ".\n\n" +
                "### CORE PROTOCOLS (STRICT ADHERENCE):\n" +
                "1. **ZERO-PARAGRAPH POLICY**: Use only headers and bullet points. Never use block text.\n" +
                "2. **CLINICAL GROUNDING**: Map every symptom to the specialized institutional resources provided below. Prioritize the patient's existing clinical history (e.g., if history shows Cardiac issues, always cross-reference).\n" +
                "3. **PROFESSIONAL PERSONA**: Maintain a direct, clinical, and authoritative tone. Use medical terminology but keep it accessible.\n" +
                "4. **SPATIAL TRIAGE**: If coordinates are available, only recommend facilities within the synchronized clinical node.\n" +
                "5. **ACTION ORIENTATION**: Provide direct booking links [BOOK NOW]((/dashboard/booking?doctor=NAME)) when a specific provider is relevant.\n" +
                "6. **NO GREETINGS**: Start directly with the clinical analysis.\n\n" +
                "### INSTITUTIONAL RESOURCE REGISTRY:\n" +
                "HOSPITALS:\n" + hospitalList + "\n" +
                "DOCTORS:\n" + doctorList + "\n\n" +
                "### CONVERSATION LOGS:\n" + (historyContext.length() > 0 ? historyContext.toString() : "No previous interaction history.") + "\n\n" +
                "### PATIENT QUERY:\n" + query;
            
            String neuralResponse = geminiAiService.getCompletion(prompt);
            
            // Fallback to Groq if Gemini fails or is rate-limited
            if (neuralResponse == null || neuralResponse.contains("error")) {
                System.err.println("Gemini failed, falling back to Groq...");
                neuralResponse = groqAiService.getCompletion(prompt);
            }

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
        // Kannada Range: \u0CBC-\u0CFF
        if (query.matches(".*[\\u0CBC-\\u0CFF].*")) return "kannada";
        // Malayalam Range: \u0D00-\u0D7F
        if (query.matches(".*[\\u0D00-\\u0D7F].*")) return "malayalam";
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
            case "dental": return "Avoid hot or cold food. See a dentist.";
            case "cardiology": return "Rest and avoid heavy work. See a heart doctor.";
            case "ent": return "Avoid cold drinks and allergens. See an ENT specialist.";
            case "dermatology": return "Avoid scratching and keep area clean. See a dermatologist.";
            default: return "Please visit a doctor for a checkup.";
        }
    }

    private String generateProfessionalResponse(String query, String email) {
        return "Greetings, Doctor. I am your Clinical Operational Intelligence module.";
    }

    private String mapSymptomToSpecialty(String query) {
        // English + Tamil + Hindi Keywords + Expanded Specialties
        if (query.contains("tooth") || query.contains("teeth") || query.contains("பல்") || query.contains("दांत") || query.contains("gum")) return "dental";
        if (query.contains("heart") || query.contains("chest") || query.contains("இதயம்") || query.contains("दिल") || query.contains("bp") || query.contains("cardiac")) return "cardiology";
        if (query.contains("ear") || query.contains("nose") || query.contains("throat") || query.contains("hearing") || query.contains("sinus") || query.contains("tonsil") || query.contains("காது") || query.contains("कान")) return "ent";
        if (query.contains("skin") || query.contains("rash") || query.contains("itch") || query.contains("தோல்") || query.contains("त्वचा")) return "dermatology";
        if (query.contains("bone") || query.contains("joint") || query.contains("fracture") || query.contains("muscle") || query.contains("எலும்பு") || query.contains("हड्डी")) return "orthopedics";
        if (query.contains("eye") || query.contains("vision") || query.contains("blind") || query.contains("கண்") || query.contains("आंख")) return "ophthalmology";
        if (query.contains("child") || query.contains("baby") || query.contains("infant") || query.contains("குழந்தை") || query.contains("बच्चा")) return "pediatrics";
        if (query.contains("fever") || query.contains("cold") || query.contains("காய்ச்சல்") || query.contains("बुखार") || query.contains("வலி") || query.contains("pain") || query.contains("cough")) return "general physician";
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
