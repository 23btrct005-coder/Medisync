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
    private final GeminiAiService geminiAiService;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final ReportRepository reportRepository;
    private final TelemetryRepository telemetryRepository;
    
    private static final Map<String, String> sessionSummaries = new HashMap<>();

    public AiService(DoctorRepository doctorRepository, 
                     HospitalRepository hospitalRepository,
                     AiQueryLogRepository aiQueryLogRepository,
                     PrescriptionRepository prescriptionRepository,
                     AppointmentRepository appointmentRepository,
                     @Lazy DoctorService doctorService,
                     UserRepository userRepository,
                     PatientRepository patientRepository,
                     ReportRepository reportRepository,
                     GeminiAiService geminiAiService,
                     TelemetryRepository telemetryRepository) {
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
        this.aiQueryLogRepository = aiQueryLogRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.appointmentRepository = appointmentRepository;
        this.doctorService = doctorService;
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.reportRepository = reportRepository;
        this.geminiAiService = geminiAiService;
        this.telemetryRepository = telemetryRepository;
    }

    public String generateResponse(String query, List<Map<String, String>> history, String userEmail, List<String> roles, String location, String imageData) {
        String lowerQuery = query.toLowerCase().trim();
        boolean isDoctor = roles != null && roles.stream().anyMatch(r -> r.equalsIgnoreCase("ROLE_DOCTOR"));
        boolean isHospitalAdmin = roles != null && roles.stream().anyMatch(r -> r.equalsIgnoreCase("ROLE_HOSPITAL_ADMIN"));

        if (isDoctor || isHospitalAdmin) return generateProfessionalResponse(lowerQuery, userEmail);

        // --- POLYGLOT DETECTION ---
        String language = detectLanguage(query);

        // 1. Real-time Context Extraction (Temporal + Clinical History)
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
                    
                    // --- ENHANCED LIFESTYLE & BIOMETRIC DATA ---
                    if (p.getBloodGroup() != null) clinicalHistory.append("Blood Group: ").append(p.getBloodGroup()).append(". ");
                    if (p.getWeight() != null) clinicalHistory.append("Weight: ").append(p.getWeight()).append(". ");
                    if (p.getHeight() != null) clinicalHistory.append("Height: ").append(p.getHeight()).append(". ");
                    if (p.getSmokingStatus() != null) clinicalHistory.append("Smoking: ").append(p.getSmokingStatus()).append(". ");
                    if (p.getAlcoholStatus() != null) clinicalHistory.append("Alcohol: ").append(p.getAlcoholStatus()).append(". ");
                    if (p.getFamilyMedicalHistory() != null) clinicalHistory.append("Family History: ").append(p.getFamilyMedicalHistory()).append(". ");
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
                // --- INTEGRATE TELEMETRY (PROACTIVE SAFETY LOOP) ---
                List<com.health.medisync.model.Telemetry> telemetry = telemetryRepository.findTop5ByPatientIdOrderByCreatedAtDesc(u.getId());
                if (!telemetry.isEmpty()) {
                    clinicalHistory.append("Recent Vitals: ");
                    telemetry.forEach(t -> {
                        clinicalHistory.append(String.format("[%s: HR %s, SpO2 %s%%] ", 
                            t.getCreatedAt(), t.getHeartRate(), t.getSpo2()));
                        if (t.getHeartRate() > 100 || t.getSpo2() < 95) {
                            clinicalHistory.append("!! ANOMALY DETECTED !! ");
                        }
                    });
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
                "1. **DETAILED POINT-BASED POLICY**: NEVER use paragraphs. Provide the response entirely in clear, detailed bullet points using standard dashes (-). Highlight important terms using `**bold**`. Maintain a warm, user-friendly tone. The ONLY other markdown allowed is the strictly required `[` and `]` for BOOK NOW links.\n" +
                "2. **SMART SYMPTOM ANALYSIS**: You MUST perform a high-depth triage. For any symptom description, you are FORBIDDEN from giving a final recommendation in the first turn. You MUST first ask 3-4 clinical follow-up questions (age, duration, pain location, associated symptoms) to narrow down the diagnosis.\n" +
                "3. **EMERGENCY DETECTION**: If emergency keywords (chest pain, breathing difficulty, severe bleeding) are detected, skip triage and immediately trigger EMERGENCY MODE. Recommend the nearest hospital and suggest ambulance support.\n" +
                "4. **MEDICATION ASSISTANT**: Explain dosages, timings, and side effects in simple language. If asked to remind, use `AGENT_ACTION: {\"action\": \"add_reminder\", \"params\": {\"medicine\": \"NAME\", \"time\": \"HH:MM\"}}`.\n" +
                "5. **MEDICAL REPORT SYNTHESIS**: Analyze uploaded images/PDFs of reports. Highlight abnormal values and explain medical terms simply with recommended next steps.\n" +
                "6. **PATIENT HEALTH MEMORY**: Actively utilize the provided 'Patient Profile Tracking' and 'CONVERSATION LOGS' to personalize the experience.\n" +
                "7. **EMOTION & SENTIMENT AWARENESS**: Detect anxiety, stress, or fear in the user's tone and respond with professional clinical empathy.\n" +
                "8. **ACTION ORIENTATION**: If a user asks 'what should I do' or 'suggest a doctor', you MUST provide a concrete next step (e.g., 'Book a General Physician') and a [BOOK NOW] link immediately, even if triage is ongoing. Provide a preliminary severity estimate (Low, Medium, High) based on current data.\n" +
                "9. **TRIAGE QUALITY**: Provide value by explaining the *reasoning* behind your triage. Never give a one-line response. However, ensure the reasoning leads directly to an ACTIONABLE step.\n" +
                "10. **MULTILINGUAL SYNTHESIS**: Respond in the user's detected language (English, Hindi, Kannada, Tamil, Telugu, Malayalam) with high clinical accuracy.\n" +
                "11. **RELEVANT GROUNDING**: Only reference patient history if strictly relevant. Acute conditions (like fever) lose relevance after 14 days; chronic conditions are permanent.\n" +
                "12. **AUTONOMOUS SCHEDULING**: If high-risk, propose a booking using: `AGENT_ACTION: {\"action\": \"book_appointment\", \"params\": {\"doctorId\": ID, \"date\": \"YYYY-MM-DD\", \"slot\": \"HH:MM\", \"type\": \"ONLINE/PHYSICAL\"}}`.\n" +
                "13. **CLOSED-WORLD ASSUMPTION**: ONLY recommend hospitals and doctors listed in the 'INSTITUTIONAL RESOURCE REGISTRY'. NEVER mention external providers.\n" +
                "14. **NO GREETINGS**: Start directly with the clinical analysis.\n" +
                "15. **SINGLE MAP & ACTION**: Provide exactly ONE map and ONE [BOOK NOW] link per response.\n" +
                "16. **PROFESSIONAL PERSONA**: You are a Board-Certified Expert Physician. Tone must be authoritative yet empathetic.\n\n" +
                "### INSTITUTIONAL RESOURCE REGISTRY:\n" +
                "HOSPITALS:\n" + hospitalList + "\n" +
                "DOCTORS:\n" + doctorList + "\n\n" +
                "### CONVERSATION LOGS:\n" + (historyContext.length() > 0 ? historyContext.toString() : "No previous interaction history.") + "\n\n" +
                "### PATIENT QUERY:\n" + query;
            
            List<Map<String, Object>> parts = new ArrayList<>();
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);
            parts.add(textPart);

            if (imageData != null && imageData.contains(",")) {
                String base64Data = imageData.split(",")[1];
                String mimeType = imageData.split(",")[0].split(":")[1].split(";")[0];
                Map<String, Object> imagePart = new HashMap<>();
                Map<String, String> inlineData = new HashMap<>();
                inlineData.put("mime_type", mimeType);
                inlineData.put("data", base64Data);
                imagePart.put("inline_data", inlineData);
                parts.add(imagePart);
            }

            String neuralResponse = geminiAiService.getCompletion(parts);
            
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
        StringBuilder sb = new StringBuilder();
        sb.append("### 📊 ").append("OPERATIONAL INTELLIGENCE BRIEFING\n");
        sb.append("Greetings, Clinician. I am processing your institutional query.\n\n");

        try {
            long totalDoctors = doctorRepository.count();
            long totalHospitals = hospitalRepository.count();
            long pendingAppts = appointmentRepository.findAll().stream().filter(a -> a.getStatus() == null || a.getStatus().name().equalsIgnoreCase("PENDING")).count();

            sb.append("#### 🏥 ").append("Current Network Status\n");
            sb.append("- **Active Institutions:** ").append(totalHospitals).append("\n");
            sb.append("- **Registered Physicians:** ").append(totalDoctors).append("\n");
            sb.append("- **Pending Appointments:** ").append(pendingAppts).append("\n\n");

            sb.append("#### ⚡ ").append("Operational Recommendations\n");
            if (pendingAppts > 10) {
                sb.append("- **Warning:** High appointment backlog detected. Consider optimizing throughput.\n");
            } else {
                sb.append("- **Status:** Clinical throughput is within optimal parameters.\n");
            }
            
            sb.append("\nHow can I assist with your clinical operations today?");
        } catch (Exception e) {
            sb.append("- Error retrieving real-time telemetry: ").append(e.getMessage());
        }

        return sb.toString();
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
