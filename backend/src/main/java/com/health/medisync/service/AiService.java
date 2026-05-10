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

            // ELITE DUAL-PRIMARY REASONING: Gemini & OpenAI Load-Balanced Loop
            boolean hasImage = imageData != null && imageData.contains(",");
            String base64Data = null;
            String mimeType = null;
            
            if (hasImage) {
                String[] partsArray = imageData.split(",");
                mimeType = partsArray[0].split(":")[1].split(";")[0];
                base64Data = partsArray[1];

                Map<String, Object> imagePart = new HashMap<>();
                Map<String, String> inlineData = new HashMap<>();
                inlineData.put("mime_type", mimeType);
                inlineData.put("data", base64Data);
                imagePart.put("inline_data", inlineData);
                parts.add(imagePart);
            }

            // Randomly pick primary node to ensure both are 'Primary'
            boolean startWithGemini = new java.util.Random().nextBoolean();
            System.out.println("COPILOT_NODE_ROUTING: " + (startWithGemini ? "Gemini 1.5 Flash" : "OpenAI GPT-4o") + " selected as lead intelligence node.");

            if (startWithGemini) {
                neuralResponse = geminiAiService.getCompletion(parts);
                if (neuralResponse == null || neuralResponse.contains("error") || neuralResponse.contains("403")) {
                    System.err.println("Gemini Lead Interrupted. Failing over to OpenAI GPT-4o Primary Backup...");
                    neuralResponse = openAiService.getCompletion(prompt, base64Data, mimeType);
                }
            } else {
                neuralResponse = openAiService.getCompletion(prompt, base64Data, mimeType);
                if (neuralResponse == null || neuralResponse.contains("error") || neuralResponse.contains("403")) {
                    System.err.println("OpenAI Lead Interrupted. Failing over to Gemini 1.5 Flash Primary Backup...");
                    neuralResponse = geminiAiService.getCompletion(parts);
                }
            }
            
            // AUTOMATIC SECONDARY FAILOVER: Groq Llama-3.3-70b
            if (neuralResponse == null || neuralResponse.contains("error")) {
                System.err.println("All Primary Intelligence Nodes Interrupted. Failing over to Groq...");
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
        String assessment = "I am your MediSync Copilot. While I coordinate with our specialized neural nodes, I've analyzed your query using our institutional safety protocol. ";
        String severity = "MODERATE";
        String specialist = "General Physician";
        String action = "Please proceed to the nearest MediSync node for an initial evaluation.";
        String service = "General Clinical";
        String warning = "None identified during backup sync.";

        // HIGH-PRECISION INTENT MAPPING
        if (q.contains("blood") || q.contains("donor")) {
            assessment += "I've prioritized your request for Blood Bank services.";
            severity = "HIGH";
            specialist = "Hematologist";
            action = "Navigate to '/dashboard/booking?mode=service&service=Blood+Bank' for coordination.";
            service = "Blood Bank";
        } else if (q.contains("scan") || q.contains("mri") || q.contains("ct") || q.contains("xray")) {
            assessment += "Imaging request detected. I'm preparing the diagnostic node for your arrival.";
            severity = "HIGH";
            specialist = "Radiologist";
            action = "Secure a slots in the Diagnostic Imaging section via '/dashboard/booking'.";
            service = "MRI Scan";
        } else if (q.contains("head") || q.contains("brain") || q.contains("migraine") || q.contains("headache")) {
            boolean isSevere = q.contains("severe") || q.contains("worst") || q.contains("injury") || q.contains("hit");
            if (isSevere) {
                assessment += "CRITICAL: Severe cranial signal detected. Immediate assessment is mandatory.";
                severity = "CRITICAL";
                specialist = "Neurologist / ER";
                action = "Locate the nearest Emergency node immediately.";
                service = "Emergency & Trauma Care";
                warning = "IMMEDIATE EVALUATION REQUIRED FOR SEVERE HEAD PAIN.";
            } else {
                assessment += "I've noted your headache symptoms. Monitoring and professional evaluation are recommended.";
                severity = "LOW";
                specialist = "General Practitioner";
                action = "Monitor for 'Red Flags' (vision changes, fever, neck stiffness). Book a routine consult.";
                service = "General Clinical";
            }
        } else if (q.contains("stomach") || q.contains("abdomen") || q.contains("gut")) {
            assessment += "Abdominal discomfort protocol active. I'm mapping you to our gastrointestinal node.";
            severity = "MODERATE";
            specialist = "Gastroenterologist";
            action = "Secure a slot for a clinical evaluation or ultrasound via '/dashboard/booking'.";
            service = "Ultrasound / सोनोग्राफी";
        } else if (q.contains("emergency") || q.contains("pain") || q.contains("heart") || q.contains("chest") || q.contains("breathing")) {
            assessment += "CRITICAL: Emergency signal detected. Copilot Bypass active.";
            severity = "CRITICAL";
            specialist = "Emergency Specialist";
            action = "Locate the nearest Emergency & Trauma Care node in the registry.";
            service = "Emergency & Trauma Care";
            warning = "LIFE-THREATENING SYMPTOMS REQUIRE IMMEDIATE INTERVENTION.";
        } else if (q.contains("book") || q.contains("appointment")) {
            assessment += "I can help you navigate our booking system.";
            severity = "LOW";
            action = "Navigate to '/dashboard/booking' to choose your physician or service.";
            service = "General Clinical";
        } else {
            assessment += "I've analyzed your health query and recommend a professional consultation for further clarity.";
        }

        return "1. Copilot Assessment: " + assessment + (hasImage ? " (Visual telemetry analysis in progress)" : "") + "\n" +
               "2. Possible Conditions / Features: Clinical reasoning in failover mode. Portal navigation active.\n" +
               "3. Risk Indicators / Instructions: Connectivity transiently interrupted. Follow the suggested portal routes.\n" +
               "4. Triage Level: " + severity + "\n" +
               "5. Recommended specialist / Node: " + specialist + "\n" +
               "6. Suggested Next Steps: " + action + " Use the booking node for " + service + ".\n" +
               "7. Follow-up Questions: Can you specify the severity? Are you experiencing any vision changes or nausea?\n" +
               "8. Emergency Warning / Portal Tip: " + warning + " Tip: Update your health vitals in 'Profile' for better accuracy.";
    }

    public String getLatestBrief(String email) {
        return sessionSummaries.getOrDefault(email, "No AI context.");
    }
}
