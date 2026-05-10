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

    public String generateResponse(String query, List<Map<String, Object>> history, String userEmail, List<String> roles, String location, String imageData) {
        String currentTime = java.time.LocalTime.now().toString();
        String currentDate = java.time.LocalDate.now().toString();
        final StringBuilder clinicalHistory = new StringBuilder(userEmail != null ? "" : "None");
        String currentPatientId = "UNKNOWN";
        String currentPatientName = "Guest User";
        
        if (userEmail != null) {
            Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(userEmail);
            if (userOpt.isPresent()) {
                User u = userOpt.get();
                Optional<Patient> pOpt = patientRepository.findByUserId(u.getId());
                if (pOpt.isPresent()) {
                    Patient p = pOpt.get();
                    currentPatientId = p.getPatientId() != null ? p.getPatientId() : "TN-MS-" + u.getId();
                    currentPatientName = p.getName() != null ? p.getName() : u.getUsername();
                    
                    clinicalHistory.append("Patient Profile: ")
                        .append(p.getGender() != null ? p.getGender() + ", " : "")
                        .append(p.getAge() != null ? p.getAge() + " years old. " : "");
                }

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
            for (Map<String, Object> msg : history) {
                String role = msg.get("role") != null ? msg.get("role").toString() : "UNKNOWN";
                String text = msg.get("text") != null ? msg.get("text").toString() : "";
                historyContext.append(role.toUpperCase()).append(": ").append(text).append("\n");
            }
        }

        String prompt = "### MEDISYNC MASTER SYSTEM PROMPT: DYNAMIC CLINICAL ROUTER & TRIAGE LOGIC (V5.0)\n\n" +
                "ROLE: You are the MediSync Clinical Concierge. You are the intelligent controller for the 'Secure Clinical Booking' button. Your objective is to bridge user symptoms to the exact hospital pathway.\n\n" +
                "1. CORE DIRECTIVE:\n" +
                "The 'Secure Clinical Booking' button must be DYNAMIC. You must resolve user intent into one of the following pathways and state it clearly.\n\n" +
                "2. TRIAGE FRAMEWORK:\n" +
                "- RISK STRATIFICATION: Assign Triage [CRITICAL | URGENT | ROUTINE].\n" +
                "- IDENTITY LOCKING: All actions bound to Patient ID: " + currentPatientId + " (" + currentPatientName + ").\n\n" +
                "3. ROUTING PATHWAYS (SYSTEM INVENTORY):\n" +
                "- PATHWAY A (SERVICES): Emergency & Trauma Care, Ambulance Services, ICU, NICU, Operation Theatre, CT Scan, X-Ray, MRI, Ultrasound (सोनोग्राफी), Blood Bank, 24/7 Pharmacy.\n" +
                "- PATHWAY B (SPECIALISTS): Radiology (Dr. Amarthya), Orthopedic, Pediatric, Gynecology, ENT, Ophthalmology, Dermatology (Skin), General Surgery, Dental, Physiotherapy.\n\n" +
                "4. EXECUTION PROTOCOL:\n" +
                "- If CRITICAL symptoms (Chest pain, Unconscious, Heavy bleeding) -> LOCK to 'Emergency & Trauma Care'.\n" +
                "- Map button to: medisync-hos.ddns.net/booking/resolve?path={Service_or_Doctor_ID}&triage={Level}&pid=" + currentPatientId + "\n\n" +
                "RESPONSE STRUCTURE (STRICT 8-HEADER PROTOCOL):\n" +
                "1. Initial Assessment: (Direct diagnosis/observation)\n" +
                "2. Possible Conditions: (Medically cautious list)\n" +
                "3. Risk Indicators: (Specific red flags or 'None identified')\n" +
                "4. Triage Level: [CRITICAL | URGENT | ROUTINE]\n" +
                "5. Recommended Specialist: (Match to PATHWAY B if applicable)\n" +
                "6. Suggested Next Steps: (State: 'I have configured your booking for [Service/Doctor] based on your symptoms.')\n" +
                "7. Follow-up Questions: (4-5 clarifying questions)\n" +
                "8. Emergency Warning: (Life-threatening warning or 'None identified')\n\n" +
                "GLOBAL RULES:\n" +
                "- NO markdown symbols (*, #, _). Use clean text.\n" +
                "- BILINGUAL SUPPORT: Use both English and localized terms (e.g., Ultrasound/सोनोग्राफी).\n" +
                "- SECURITY: Remind user: 'Booking encrypted and logged in your Security Ledger'.\n\n" +
                "### INSTITUTIONAL REGISTRY:\n" +
                "HOSPITALS:\n" + hospitalList + "\n" +
                "DOCTORS:\n" + doctorList + "\n\n" +
                "### CLINICAL CONTEXT:\n" +
                "DATE: " + currentDate + " | TIME: " + currentTime + "\n" +
                "PROFILE: " + clinicalHistory.toString() + "\n" +
                "ID: " + currentPatientId + " | NAME: " + currentPatientName + "\n" +
                "LOCATION: " + (location != null ? location : "Unknown") + "\n\n" +
                "### INTERACTION LOGS:\n" + (historyContext.length() > 0 ? historyContext.toString() : "Initial consultation.") + "\n\n" +
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
            
            return "I apologize, but I encountered a clinical reasoning interruption while analyzing the image. Please try providing more details in text or re-uploading a clearer image.";
        } catch (Exception e) { 
            e.printStackTrace(); 
            return "System Error: Unable to reach the clinical reasoning brain. Please check your connection.";
        }
    }

    public String getLatestBrief(String email) {
        return sessionSummaries.getOrDefault(email, "No AI context.");
    }
}
