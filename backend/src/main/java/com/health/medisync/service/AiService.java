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
    private final OpenAiService openAiService;
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
                     OpenAiService openAiService,
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
        this.openAiService = openAiService;
        this.telemetryRepository = telemetryRepository;
    }

    public String generateResponse(String query, List<Map<String, Object>> history, String userEmail, List<String> roles, String location, String imageData) {
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

        // OPTIMIZATION: Limit registry injection to prevent prompt overflow
        String limitedHospitalList = hospitalRepository.findAll().stream().limit(10)
            .map(h -> "- " + h.getName() + " | Address: " + h.getStreet() + ", " + h.getCity() + ", " + h.getState() + " " + h.getPinCode() + " | Maps: " + (h.getGoogleMapsUrl() != null ? h.getGoogleMapsUrl() : "https://www.google.com/maps/search/?api=1&query=" + h.getName().replace(" ", "+")) + " [ID: " + h.getId() + "]")
            .collect(Collectors.joining("\n"));

        String limitedDoctorList = doctorRepository.findAll().stream().filter(Doctor::isApproved).limit(10)
            .map(d -> "- Dr. " + d.getName() + " (" + d.getSpecialization() + ") [ID: " + d.getId() + "] at " + (d.getHospitalEntity() != null ? d.getHospitalEntity().getName() : (d.getHospital() != null ? d.getHospital() : "Independent")))
            .collect(Collectors.joining("\n"));

        StringBuilder historyContext = new StringBuilder();
        if (history != null) {
            for (Map<String, Object> msg : history) {
                String role = msg.get("role") != null ? msg.get("role").toString() : "UNKNOWN";
                String text = msg.get("text") != null ? msg.get("text").toString() : "";
                historyContext.append(role.toUpperCase()).append(": ").append(text).append("\n");
            }
        }

        String prompt = "### MEDISYNC AI CORE — PRODUCTION-GRADE CLINICAL INTELLIGENCE\n\n" +
                "PRIMARY OBJECTIVE:\n" +
                "Provide safe, intelligent, healthcare guidance. Prioritize patient safety. ground responses in clinical caution.\n\n" +
                "CLINICAL REASONING PROTOCOL:\n" +
                "1. QUESTION-FIRST BEHAVIOR: For vague symptoms, DO NOT list possible conditions immediately. FIRST ask clarifying questions about: Location, Severity (1-10), Duration, Onset, and Red Flags.\n" +
                "2. DYNAMIC TRIAGE: Use ONLY [LOW | MODERATE | HIGH | CRITICAL].\n" +
                "3. EMERGENCY PROTOCOL: Any mention of 'Ambulance', 'Emergency', 'Chest Pain', 'Blood Bank', or 'Severe Breathing Difficulty' MUST be triaged as HIGH or CRITICAL immediately.\n" +
                "4. ADAPTIVE HEADERS: If certain, use 'Clinical Assessment'. If vague, use 'Initial Assessment'.\n" +
                "5. STRICT REGISTRY ADHERENCE (MANDATORY): You are FORBIDDEN from suggesting or mentioning any hospital, clinic, or medical facility NOT listed in the INSTITUTIONAL REGISTRY below. Do NOT mention generic emergency numbers like '108' or '112' in the text; instead, provide the GOOGLE MAPS LINK from the registry for the nearest facility. Recommending external facilities not in the list is a CRITICAL FAILURE. If no suitable hospital is in the registry, suggest the 'Nearest MediSync Node'.\n\n" +
                "RESPONSE STRUCTURE (STRICT 8-HEADER PROTOCOL):\n" +
                "1. Initial Assessment: (Or 'Clinical Assessment' if certainty is high)\n" +
                "2. Possible Conditions: (Medically cautious list; state 'Assessment pending further details' if vague)\n" +
                "3. Risk Indicators: (Specific red flags detected or 'None identified')\n" +
                "4. Triage Level: [LOW | MODERATE | HIGH | CRITICAL]\n" +
                "5. Recommended Specialist: (e.g., Gastroenterologist, Cardiologist)\n" +
                "6. Suggested Next Steps: (Specific action. Include Hospital address/Maps link if relevant).\n" +
                "7. Follow-up Questions: (Ask 4-5 high-precision clarifying questions to refine the triage)\n" +
                "8. Emergency Warning: (Explicit life-threatening warning if applicable, otherwise 'None identified')\n\n" +
                "GLOBAL RULES:\n" +
                "- NO markdown symbols (*, #, _). Use only clean text.\n" +
                "- Natural disclaimer: 'This information is for guidance and should not replace evaluation by a licensed healthcare professional.'\n" +
                "- SYMPTOM LOCALIZATION: For any pain, always ask about the exact anatomical location (e.g., upper-right quadrant).\n\n" +
                "### INSTITUTIONAL REGISTRY:\n" +
                "HOSPITALS:\n" + limitedHospitalList + "\n" +
                "DOCTORS:\n" + limitedDoctorList + "\n\n" +
                "### CLINICAL CONTEXT:\n" +
                "DATE: " + currentDate + " | TIME: " + currentTime + "\n" +
                "PROFILE: " + clinicalHistory.toString() + "\n" +
                "LOCATION: " + (location != null ? location : "Unknown") + "\n\n" +
                "### INTERACTION LOGS:\n" + (historyContext.length() > 0 ? historyContext.toString() : "Initial consultation.") + "\n\n" +
                "### PATIENT QUERY:\n" + query;

        String neuralResponse = null;
        try {
            List<Map<String, Object>> parts = new ArrayList<>();
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);
            parts.add(textPart);

            boolean hasImage = imageData != null && imageData.contains(",");
            if (hasImage) {
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
            
            // AUTOMATIC FAILOVER 1: OpenAI GPT-4o
            if (neuralResponse == null || neuralResponse.contains("error") || neuralResponse.contains("403") || neuralResponse.contains("404")) {
                System.err.println("Gemini Node Interrupted. Failing over to OpenAI GPT-4o...");
                neuralResponse = openAiService.getCompletion(prompt);
            }

            // AUTOMATIC FAILOVER 2: Groq Llama-3.3-70b
            if (neuralResponse == null || neuralResponse.contains("error")) {
                System.err.println("OpenAI Node Interrupted. Failing over to Groq...");
                neuralResponse = groqAiService.getCompletion(prompt);
            }

            if (neuralResponse != null && !neuralResponse.contains("error")) {
                if (userEmail != null) sessionSummaries.put(userEmail, neuralResponse.length() > 200 ? neuralResponse.substring(0, 200) + "..." : neuralResponse);
                return neuralResponse;
            }
            
            // HIGH-FIDELITY LOCAL REASONING FAILOVER
            return performLocalClinicalTriage(query, hasImage);
        } catch (Exception e) { 
            System.err.println("CRITICAL_AI_ERROR: " + e.getMessage());
            e.printStackTrace(); 
            return performLocalClinicalTriage(query, imageData != null && imageData.contains(","));
        }
    }

    private String performLocalClinicalTriage(String query, boolean hasImage) {
        String q = query.toLowerCase();
        String assessment = "I apologize, but our neural reasoning node is currently synchronized with backup clinical data. ";
        String severity = "MODERATE";
        String specialist = "General Physician";
        String action = "Please proceed to the nearest MediSync node for evaluation.";
        String service = "General Clinical";

        if (q.contains("blood") || q.contains("donor")) {
            assessment += "Your request for Blood Bank services has been prioritized.";
            severity = "HIGH";
            specialist = "Hematologist";
            action = "Navigate to the institutional Blood Bank node immediately for coordination.";
            service = "Blood Bank";
        } else if (q.contains("scan") || q.contains("mri") || q.contains("ct") || q.contains("head") || q.contains("brain") || q.contains("stomach") || q.contains("abdomen")) {
            boolean isAbdomen = q.contains("stomach") || q.contains("abdomen");
            assessment += (isAbdomen ? "Abdominal" : "Imaging") + " request detected. We are preparing the diagnostic node for your arrival.";
            severity = "HIGH";
            specialist = isAbdomen ? "Gastroenterologist" : "Radiologist";
            action = "Secure a slot in the " + (isAbdomen ? "Ultrasound / Laboratory" : "Diagnostic Imaging / MRI") + " section of the portal.";
            service = isAbdomen ? "Ultrasound / सोनोग्राफी" : "MRI Scan";
        } else if (q.contains("bone") || q.contains("fracture") || q.contains("leg") || q.contains("arm") || q.contains("joint")) {
            assessment += "Orthopedic assessment triggered for potential structural injury.";
            severity = "HIGH";
            specialist = "Orthopedic Surgeon";
            action = "An X-Ray is recommended to rule out fractures. Book via the Radiology node.";
            service = "X-Ray (Routine & Emergency)";
        } else if (q.contains("skin") || q.contains("rash") || q.contains("allergy")) {
            assessment += "Dermatological signal detected. Please avoid applying any unverified clinical ointments.";
            severity = "LOW";
            specialist = "Dermatologist";
            action = "Consult a specialist to determine the etiology of the dermal reaction.";
            service = "Pharmacy (24/7)";
        } else if (q.contains("heart") || q.contains("chest") || q.contains("palpitation")) {
            assessment += "Cardiology protocol active. Cardiovascular monitoring is prioritized.";
            severity = "CRITICAL";
            specialist = "Cardiologist";
            action = "Immediate ECG and vitals check required at the nearest Emergency node.";
            service = "Emergency & Trauma Care";
        } else if (q.contains("emergency") || q.contains("pain") || q.contains("breathing")) {
            assessment += "CRITICAL: Potential emergency signal detected. Clinical bypass active.";
            severity = "CRITICAL";
            specialist = "Emergency Specialist";
            action = "Locate the nearest Emergency & Trauma Care node immediately.";
            service = "Emergency & Trauma Care";
        } else {
            assessment += "Based on your clinical query, a follow-up assessment is recommended.";
        }

        return "1. Initial Assessment: " + assessment + (hasImage ? " (Visual telemetry analysis pending link restoration)" : "") + "\n" +
               "2. Possible Conditions: Clinical sync paused. Symptom correlation required.\n" +
               "3. Risk Indicators: Connectivity transiently interrupted.\n" +
               "4. Triage Level: " + severity + "\n" +
               "5. Recommended Specialist: " + specialist + "\n" +
               "6. Suggested Next Steps: " + action + " Use the booking node for " + service + ".\n" +
               "7. Follow-up Questions: Can you specify the duration? Are you experiencing any acute discomfort?\n" +
               "8. Emergency Warning: " + (severity.equals("CRITICAL") ? "IMMEDIATE ATTENTION REQUIRED" : "None identified during backup sync.");
    }

    public String getLatestBrief(String email) {
        return sessionSummaries.getOrDefault(email, "No AI context.");
    }
}
