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
            .map(h -> "- " + h.getName() + " | Address: " + h.getStreet() + ", " + h.getCity() + ", " + h.getState() + " " + h.getPinCode() + " | Maps: " + (h.getGoogleMapsUrl() != null ? h.getGoogleMapsUrl() : "https://www.google.com/maps/search/?api=1&query=" + h.getName().replace(" ", "+")) + " [ID: " + h.getId() + "]")
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

        String prompt = "### MEDISYNC PORTAL — ADVANCED MEDICAL ASSISTANT AI\n\n" +
                "CORE PERSONA:\n" +
                "You are the 'MediSync Medical Assistant AI'. You are a highly intelligent, professional, and empathetic clinical assistant. Your role is INFORMATIONAL only. You are NOT a doctor.\n\n" +
                "MANDATORY DISCLAIMER:\n" +
                "Every response MUST include the sentiment: 'This is not medical advice. Consult a doctor for diagnosis.' (The frontend will handle the specific banner, but your tone must reflect this limitation).\n\n" +
                "CAPABILITIES & RESPONSIBILITIES:\n" +
                "1. SYMPTOM EXPLANATION: Explain medical symptoms in simple, non-intimidating language.\n" +
                "2. REPORT ANALYSIS: If a user mentions a report or uploads an image, summarize the findings clearly.\n" +
                "3. MEDICATION GUIDANCE: Explain common medicines and their side effects (Informational only).\n" +
                "4. RISK DETECTION: Proactively detect emergency symptoms (Chest pain, SOB, Stroke signs, severe bleeding) and warn the user to seek immediate care.\n" +
                "5. INSTITUTIONAL MATCHING: Suggest the correct hospital department or doctor from the provided registry. ALWAYS use the exact hospital names and addresses provided in the database registry below.\n\n" +
                "GLOBAL RESPONSE RULES:\n" +
                "- Keep responses concise (100–180 words maximum).\n" +
                "- NEVER use markdown symbols like '*', '#', or '_' in your final output. Use clean text and spacing only.\n" +
                "- Maintain a 'Medical Assistant' persona: calm, supportive, and informative.\n\n" +
                "RESPONSE STRUCTURE (MANDATORY HEADERS):\n" +
                "1. Clinical Assessment: (Summarize the situation or report findings)\n" +
                "2. Severity Estimate: (Mild, Moderate, High, or Emergency)\n" +
                "3. Follow-Up Questions: (Ask 3-4 relevant questions to narrow down the situation)\n" +
                "4. Immediate Recommendations: (Lifestyle suggestions, rest, or first aid)\n" +
                "5. Suggested Department: (Choose from the institutional registry list)\n" +
                "6. Recommended Action: (Provide the specific next step, including booking a consultation if needed). If recommending a hospital from the registry, ALWAYS include its full address and its Google Maps search link (e.g., https://www.google.com/maps/search/?api=1&query=Hospital+Name) at the end of this section to trigger the live map UI.\n\n" +
                "EMERGENCY PROTOCOL:\n" +
                "If emergency markers are detected (Chest Pain, severe bleeding, breathing difficulty): Set Severity to EMERGENCY and strongly advise calling local emergency services immediately.\n\n" +
                "### INSTITUTIONAL RESOURCE REGISTRY:\n" +
                "SUGGESTED DEPARTMENTS: [Emergency & Trauma Care, Ambulance Services, ICU, NICU, Blood Bank, 24/7 Pharmacy, OPD, X-Ray, MRI Scan, Ultrasound, Physiotherapy, Dental, Orthopedic, Pediatric, Gynecology, ENT, Ophthalmology, Dermatology].\n" +
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

            if (imageData != null && imageData.contains(",")) {
                String[] partsArray = imageData.split(",");
                String mimeType = partsArray[0].split(":")[1].split(";")[0];
                String base64Data = partsArray[1];

                Map<String, Object> imagePart = new HashMap<>();
                Map<String, String> inlineData = new HashMap<>();
                inlineData.put("mime_type", mimeType);
                inlineData.put("data", base64Data);
                imagePart.put("inline_data", inlineData);
                parts.add(imagePart);
            }

            neuralResponse = geminiAiService.getCompletion(parts);
            
            // AUTOMATIC FAILOVER: If Gemini fails, use Groq Llama-3.3-70b
            if (neuralResponse == null || neuralResponse.contains("error") || neuralResponse.contains("403") || neuralResponse.contains("404")) {
                neuralResponse = groqAiService.getCompletion(prompt);
            }

            if (neuralResponse != null && !neuralResponse.contains("error")) {
                if (userEmail != null) sessionSummaries.put(userEmail, neuralResponse.length() > 200 ? neuralResponse.substring(0, 200) + "..." : neuralResponse);
                return neuralResponse;
            }
        } catch (Exception e) { e.printStackTrace(); }
        
        return "### 🧬 MediSync AI Concierge\n- **Status**: Secure Clinical Node active.\n- **Assessment**: I am analyzing your request through the secondary hospital brain.\n- **Action**: Please describe your symptoms (e.g., pain location, duration, or any physical changes) for a detailed triage.";
    }

    public String getLatestBrief(String email) {
        return sessionSummaries.getOrDefault(email, "No AI context.");
    }
}
