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
    private final GroqAiService groqAiService;
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
                     GroqAiService groqAiService,
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
        this.groqAiService = groqAiService;
        this.telemetryRepository = telemetryRepository;
    }

    public String generateResponse(String query, List<Map<String, String>> history, String userEmail, List<String> roles, String location, String imageData) {
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
                });

                telemetryRepository.findByPatientIdOrderByCreatedAtDesc(u.getId()).stream().findFirst().ifPresent(t -> {
                    clinicalHistory.append("Recent Vitals: ")
                        .append("BP: ").append(t.getBloodPressureSystolic()).append("/").append(t.getBloodPressureDiastolic()).append(", ")
                        .append("Pulse: ").append(t.getHeartRate()).append(" bpm, ")
                        .append("Temp: ").append(t.getTemperature()).append("C. ");
                });

                List<Prescription> historyMeds = prescriptionRepository.findByPatientEmailAndIsActiveTrue(userEmail);
                if (!historyMeds.isEmpty()) {
                    clinicalHistory.append("Clinical History: ")
                        .append(historyMeds.stream().map(Prescription::getMedicineName).distinct().collect(Collectors.joining(", ")))
                        .append(". ");
                }
            }
        }

        String hospitalList = hospitalRepository.findAll().stream()
            .map(h -> "- " + h.getName() + " (" + h.getLocation() + ") [ID: " + h.getId() + "]")
            .collect(Collectors.joining("\n"));

        String doctorList = doctorRepository.findAll().stream()
            .filter(Doctor::isApproved)
            .map(d -> "- Dr. " + d.getName() + " (" + d.getSpecialization() + ") [ID: " + d.getId() + "] at " + (d.getHospitalEntity() != null ? d.getHospitalEntity().getName() : (d.getHospital() != null ? d.getHospital() : "Independent")))
            .collect(Collectors.joining("\n"));

        StringBuilder historyContext = new StringBuilder();
        if (history != null) {
            for (Map<String, String> msg : history) {
                historyContext.append(msg.get("role").toUpperCase()).append(": ").append(msg.get("text")).append("\n");
            }
        }

        String prompt = "### ADVANCED MEDICAL TRIAGE SYSTEM — PRODUCTION GRADE HEALTHCARE AI\n\n" +
                "PRIMARY OBJECTIVE:\n" +
                "Act as a professional healthcare AI assistant capable of intelligent symptom analysis, emergency detection, follow-up questioning, and actionable medical guidance.\n\n" +
                "GLOBAL RESPONSE RULES:\n" +
                "- Keep responses concise and mobile-friendly (100–180 words maximum).\n" +
                "- NEVER generate essay-style responses. Use clean bullet-point formatting only.\n" +
                "- Sound like a real hospital intake assistant or calm physician assistant.\n" +
                "- Maintain professional, empathetic communication. Use patient-friendly wording.\n" +
                "- NEVER expose internal reasoning, confidence scores, AI logic, or technical terminology like 'Confidence Engine' or 'Differential Diagnosis'.\n" +
                "- Avoid excessive medical certainty without enough information.\n\n" +
                "RESPONSE STRUCTURE:\n" +
                "- Clinical Assessment\n" +
                "- Severity Estimate (Mild, Moderate, High, Emergency)\n" +
                "- Follow-Up Questions (Ask 3–5 clinically relevant questions)\n" +
                "- Immediate Recommendations\n" +
                "- Suggested Department\n" +
                "- Recommended Action\n\n" +
                "FOLLOW-UP QUESTION ENGINE:\n" +
                "For every symptom, collect: Duration, Severity, Location, Associated symptoms, Aggravating/Relieving factors, and Medical History.\n" +
                "- CHEST PAIN: Spread to arm/jaw/neck? Shortness of breath or sweating? Sharp, heavy, or pressure? Sudden start?\n" +
                "- STOMACH PAIN: Exact location? Vomiting, diarrhea, or fever? After eating? Constant or cramp-like?\n" +
                "- FEVER: Current temperature? Cough, sore throat, or body aches? Duration? Taken any medication?\n" +
                "- HEADACHE: Sudden or gradual? Nausea or light sensitivity? Vision changes? Location?\n" +
                "- COUGH: Dry or mucus? Fever or breathing difficulty? Duration? Worse at night?\n" +
                "- SHORTNESS OF BREATH: Sudden start? Chest pain or wheezing? Worse while walking or resting? Asthma history?\n" +
                "- ANXIETY/STRESS: Duration? Sleeping properly? Increased stress recently? Panic episodes?\n" +
                "- VOMITING: Frequency? Able to keep fluids down? Fever or stomach pain? Blood in vomit?\n" +
                "- DIARRHEA: Daily loose stools count? Dehydration signs? Blood in stool? Outside food recently?\n" +
                "- PREGNANCY: Weeks pregnant? Bleeding or severe pain? Fetal movement? Similar symptoms before?\n" +
                "- PEDIATRIC: Child's age? Eating/drinking normally? Breathing difficulty or lethargy? Fever response?\n" +
                "- DIABETES: Sugar level? Regular medication? Dizziness or excessive thirst? Missed insulin?\n\n" +
                "EMERGENCY DETECTION & RESPONSE:\n" +
                "Immediately escalate for: Chest pain, Breathing difficulty, Stroke symptoms, Severe bleeding, Seizures, Unconsciousness, Severe allergic reactions, Suicidal thoughts, Blood vomiting.\n" +
                "- Response: Prioritize immediate action. Reduce follow-ups. Recommend emergency care quickly. Advise against self-driving.\n\n" +
                "MEDICAL LANGUAGE RULES:\n" +
                "- Use: 'Mild infection', 'Digestive irritation', 'Trapped gas', 'Stomach discomfort', 'Viral illness', 'Breathing difficulty'.\n" +
                "- Avoid: 'Differential diagnosis', 'Colonic spasms', 'Gas entrapment', 'Systemic immune response'.\n\n" +
                "MENTAL HEALTH RULES:\n" +
                "- Detect anxiety, stress, panic, burnout, or sadness. Respond supportively and contextually. NEVER use generic resets. Escalate for self-harm.\n\n" +
                "BOOKING LOGIC:\n" +
                "- Recommend booking only when medically appropriate. Suggested department must match symptom category.\n\n" +
                "### INSTITUTIONAL RESOURCE REGISTRY:\n" +
                "HOSPITALS:\n" + hospitalList + "\n" +
                "DOCTORS:\n" + doctorList + "\n\n" +
                "### PATIENT CONTEXT:\n" +
                "CURRENT DATE: " + currentDate + " | TIME: " + currentTime + "\n" +
                "PATIENT PROFILE: " + clinicalHistory.toString() + "\n" +
                "GEOLOCATION: " + (location != null ? location : "Unknown") + "\n\n" +
                "### CONVERSATION LOGS:\n" + (historyContext.length() > 0 ? historyContext.toString() : "No previous interaction history.") + "\n\n" +
                "### PATIENT QUERY:\n" + query;

        String neuralResponse = null;
        try {
            List<Map<String, Object>> parts = new ArrayList<>();
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);
            parts.add(textPart);

            if (imageData != null && !imageData.isEmpty()) {
                Map<String, Object> imagePart = new HashMap<>();
                Map<String, String> inlineData = new HashMap<>();
                inlineData.put("mime_type", "image/png");
                inlineData.put("data", imageData);
                imagePart.put("inline_data", inlineData);
                parts.add(imagePart);
            }

            neuralResponse = geminiAiService.getCompletion(parts);
            
            // AUTOMATIC FAILOVER: If Gemini fails (leaked key, etc.), use Groq as secondary clinical engine
            if (neuralResponse == null || neuralResponse.contains("error") || neuralResponse.contains("403") || neuralResponse.contains("404")) {
                System.out.println("AI_ENGINE_FAILOVER: Primary (Gemini) failed. Escalating to Secondary (Groq Llama-3.3-70b)...");
                neuralResponse = groqAiService.getCompletion(prompt);
            }

            if (neuralResponse != null && !neuralResponse.contains("error")) {
                if (userEmail != null) sessionSummaries.put(userEmail, neuralResponse.length() > 200 ? neuralResponse.substring(0, 200) + "..." : neuralResponse);
                return neuralResponse;
            }
        } catch (Exception e) { e.printStackTrace(); }
        
        return "### ⚠️ Clinical Sync Interrupted\n- **Status**: API credentials for Gemini have been flagged as reported/leaked by Google.\n- **Recommended Action**: Please update the `GOOGLE_API_KEY` in your `.env` file with a fresh key from Google AI Studio.\n- **Interim**: I am attempting to use the secondary Groq engine for basic triage.";
    }

    public String getLatestBrief(String email) {
        return sessionSummaries.getOrDefault(email, "No AI context.");
    }
}
