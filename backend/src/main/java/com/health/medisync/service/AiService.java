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

        String prompt = "### MEDISYNC COPILOT — ELITE CLINICAL & PORTAL INTELLIGENCE\n\n" +
                "PRIMARY OBJECTIVE:\n" +
                "You are the MediSync Copilot. You serve as the bridge between patient health and the MediSync digital ecosystem. You are a Board-Certified Clinical Physician and a MediSync Technical Expert.\n\n" +
                "DOMAIN 1: CLINICAL REASONING (HEALTH QUESTIONS):\n" +
                "1. QUESTION-FIRST BEHAVIOR: For vague symptoms, ask clarifying questions first.\n" +
                "2. DYNAMIC TRIAGE: Use [LOW | MODERATE | HIGH | CRITICAL].\n" +
                "3. REGISTRY GROUNDING: ONLY recommend hospitals/doctors from the INSTITUTIONAL REGISTRY below.\n\n" +
                "DOMAIN 2: PORTAL OPERATIONS (MEDISYNC QUESTIONS):\n" +
                "If the user asks about using the app, guide them to these routes:\n" +
                "- Booking Appointments: Navigate to '/dashboard/booking'. You can book by Doctor or Service (MRI, Blood Bank, etc.).\n" +
                "- Medical Reports: View clinical history and test results at '/dashboard/reports'.\n" +
                "- Profile & Vitals: Update gender, age, and health metrics at '/dashboard/profile'.\n" +
                "- Active Appointments: Manage scheduled visits at '/dashboard/appointments'.\n" +
                "- Medications: Check active prescriptions at '/dashboard/medications'.\n" +
                "- AI Image Analysis: Upload documents using the paperclip icon in this chat.\n\n" +
                "RESPONSE STRUCTURE (STRICT 8-HEADER PROTOCOL):\n" +
                "1. Copilot Assessment: (Diagnostic summary OR Portal navigation help)\n" +
                "2. Possible Conditions / Features: (Medical list OR Portal features explanation)\n" +
                "3. Risk Indicators / Instructions: (Clinical red flags OR Step-by-step app instructions)\n" +
                "4. Triage Level: [LOW | MODERATE | HIGH | CRITICAL]\n" +
                "5. Recommended specialist / Node: (e.g., Cardiologist OR 'Booking Module')\n" +
                "6. Suggested Next Steps: (Actionable medical OR portal action with route/link).\n" +
                "7. Follow-up Questions: (Clarifying health questions OR 'Do you need help navigating?')\n" +
                "8. Emergency Warning / Portal Tip: (Clinical warning OR Pro-tip for using MediSync)\n\n" +
                "GLOBAL RULES:\n" +
                "- NO markdown symbols. Use clean text.\n" +
                "- Ground ALL facility mentions in the registry provided.\n\n" +
                "### INSTITUTIONAL REGISTRY:\n" +
                "HOSPITALS:\n" + limitedHospitalList + "\n" +
                "DOCTORS:\n" + limitedDoctorList + "\n\n" +
                "### CLINICAL & SYSTEM CONTEXT:\n" +
                "DATE: " + currentDate + " | TIME: " + currentTime + "\n" +
                "PATIENT PROFILE: " + clinicalHistory.toString() + "\n" +
                "LOCATION: " + (location != null ? location : "Unknown") + "\n\n" +
                "### INTERACTION LOGS:\n" + (historyContext.length() > 0 ? historyContext.toString() : "Copilot initialized.") + "\n\n" +
                "### USER QUERY:\n" + query;

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
        String assessment = "I am the MediSync Copilot. Our neural reasoning node is currently in backup mode. ";
        String severity = "LOW";
        String specialist = "MediSync Support";
        String action = "Please re-submit your query or navigate to our help section.";
        String service = "General Support";

        // Portal Help Logic
        if (q.contains("book") || q.contains("appointment") || q.contains("slot")) {
            assessment += "I can help you with booking. Please navigate to the 'Booking' portal.";
            action = "Navigate to '/dashboard/booking' to select a physician or service.";
            service = "General Clinical";
        } else if (q.contains("report") || q.contains("test") || q.contains("result")) {
            assessment += "Medical reports are stored in our secure clinical vault.";
            action = "Navigate to '/dashboard/reports' to view or download your results.";
            service = "Medical Reports";
        } else if (q.contains("profile") || q.contains("vitals") || q.contains("age")) {
            assessment += "You can update your personal clinical profile in the settings.";
            action = "Navigate to '/dashboard/profile' to update your age, gender, and metrics.";
            service = "Profile Management";
        } else if (q.contains("blood") || q.contains("donor")) {
            // Health Help Logic
            assessment += "Your request for Blood Bank services has been prioritized.";
            severity = "HIGH";
            specialist = "Hematologist";
            action = "Navigate to '/dashboard/booking?mode=service&service=Blood+Bank' for coordination.";
            service = "Blood Bank";
        } else if (q.contains("scan") || q.contains("mri") || q.contains("ct") || q.contains("head") || q.contains("brain") || q.contains("stomach") || q.contains("abdomen")) {
            boolean isAbdomen = q.contains("stomach") || q.contains("abdomen");
            assessment += (isAbdomen ? "Abdominal" : "Imaging") + " request detected via Copilot failover.";
            severity = "HIGH";
            specialist = isAbdomen ? "Gastroenterologist" : "Radiologist";
            action = "Secure an imaging slot via '/dashboard/booking'.";
            service = isAbdomen ? "Ultrasound / सोनोग्राफी" : "MRI Scan";
        } else if (q.contains("emergency") || q.contains("pain") || q.contains("heart") || q.contains("chest")) {
            assessment += "CRITICAL: Potential emergency signal detected. Copilot Emergency Bypass active.";
            severity = "CRITICAL";
            specialist = "Emergency Specialist";
            action = "Locate the nearest Emergency & Trauma Care node in the MediSync registry.";
            service = "Emergency & Trauma Care";
        }

        return "1. Copilot Assessment: " + assessment + (hasImage ? " (Image sync pending)" : "") + "\n" +
               "2. Possible Conditions / Features: Clinical reasoning interrupted. Portal features remain active.\n" +
               "3. Risk Indicators / Instructions: Connectivity interrupted. Please follow the portal routes provided.\n" +
               "4. Triage Level: " + severity + "\n" +
               "5. Recommended specialist / Node: " + specialist + "\n" +
               "6. Suggested Next Steps: " + action + " Use the booking node for " + service + ".\n" +
               "7. Follow-up Questions: Do you need help navigating to specific sections? Can you describe your symptoms further?\n" +
               "8. Emergency Warning / Portal Tip: " + (severity.equals("CRITICAL") ? "IMMEDIATE ATTENTION REQUIRED" : "Pro-tip: You can upload old reports via the paperclip icon.");
    }

    public String getLatestBrief(String email) {
        return sessionSummaries.getOrDefault(email, "No AI context.");
    }
}
