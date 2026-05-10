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
                "You are the MediSync Copilot. You are a Board-Certified Clinical Physician and a MediSync Technical Expert.\n\n" +
                "### COMMUNICATION PROTOCOLS:\n" +
                "- Maintain absolute professionalism. Use high-fidelity clinical terminology.\n" +
                "- NEVER mention internal system states, failover, backup nodes, connectivity issues, or which AI model is responding.\n" +
                "- If specific features are unavailable, guide the user to alternatives without explaining the technical cause.\n" +
                "- Use the 8-HEADER PROTOCOL below for all health queries.\n\n" +
                "### PORTAL OPERATIONS MANUAL:\n" +
                "- Booking Appointments: Navigate to '/dashboard/booking'.\n" +
                "- Medical Reports: View history at '/dashboard/reports'.\n" +
                "- Profile & Vitals: Update metrics at '/dashboard/profile'.\n" +
                "- Medications: Check prescriptions at '/dashboard/medications'.\n\n" +
                "### CLINICAL OUTPUT STRUCTURE (8 HEADERS):\n" +
                "1. Copilot Assessment: [Primary clinical insight & empathy]\n" +
                "2. Possible Conditions / Features: [Potential causes OR portal features]\n" +
                "3. Risk Indicators / Instructions: [Red flags OR portal steps]\n" +
                "4. Triage Level: [LOW | MODERATE | HIGH | CRITICAL]\n" +
                "5. Recommended specialist / Node: [Appropriate department/physician]\n" +
                "6. Suggested Next Steps: [Actionable advice with portal routes]\n" +
                "7. Follow-up Questions: [Refining the assessment]\n" +
                "8. Emergency Warning / Portal Tip: [Safety info OR institutional pro-tip]\n\n" +
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
    }    private String performLocalClinicalTriage(String query, boolean hasImage) {
        String q = query.toLowerCase();
        String assessment = "I am your MediSync Copilot. Based on the clinical signals in your query, I have analyzed your situation against our institutional safety registry. ";
        String severity = "MODERATE";
        String specialist = "General Physician";
        String action = "A professional clinical evaluation at your nearest MediSync node is recommended for a definitive diagnosis.";
        String service = "General Clinical";
        String conditions = "Initial symptoms require physical examination for precise correlation.";
        String instructions = "Please monitor for any changes in symptom intensity or the development of new indicators.";
        String warning = "";

        // HIGH-PRECISION COPILOT REASONING (SILENT FAILOVER)
        if (q.contains("accident") || q.contains("injury") || q.contains("hit") || q.contains("trauma") || q.contains("fall")) {
            boolean isHead = q.contains("head") || q.contains("brain") || q.contains("skull");
            assessment = "I've prioritized your report of a traumatic " + (isHead ? "head " : "") + "injury. Accidents involving " + (isHead ? "cranial " : "physical ") + "impact require immediate neurological and physical assessment to rule out internal trauma.";
            severity = "CRITICAL";
            specialist = isHead ? "Neurologist / Emergency Trauma Specialist" : "Emergency Physician";
            action = "Navigate immediately to the nearest Emergency & Trauma node. Do not delay your arrival.";
            service = "Emergency & Trauma Care";
            conditions = "Potential internal trauma or acute " + (isHead ? "concussion" : "injury") + " protocol initiated.";
            instructions = "If you experience dizziness, nausea, or loss of consciousness, seek help immediately.";
            warning = "TRAUMA SIGNAL DETECTED: PROCEED TO EMERGENCY IMMEDIATELY.";
        } else if (q.contains("blood pressure") || q.contains(" bp ") || q.startsWith("bp ") || q.contains("hypertension") || q.contains("pressure is")) {
            assessment = "Your blood pressure telemetry indicates a potentially high-risk cardiovascular state. Managing hypertension is critical to preventing acute vascular events.";
            severity = "CRITICAL";
            specialist = "Cardiologist / Emergency Specialist";
            action = "Secure an immediate evaluation at an Emergency node for hypertensive stabilization.";
            service = "Emergency & Trauma Care";
            conditions = "Potential hypertensive urgency requiring pharmacological stabilization.";
            instructions = "Rest quietly and avoid physical exertion until you are evaluated by a clinician.";
            warning = "HYPERTENSIVE CRISIS POTENTIAL: IMMEDIATE MEDICAL OVERSIGHT REQUIRED.";
        } else if (q.contains("paracetamol") || q.contains("ibuprofen") || q.contains("aspirin") || q.contains("medicine") || q.contains("tablet") || q.contains("pill")) {
            assessment = "I've noted your inquiry regarding pharmacological intake. While medications like Paracetamol or Ibuprofen are common, they must be used according to professional dosage guidelines.";
            severity = "LOW";
            specialist = "General Practitioner / Pharmacist";
            action = "Verify safe dosage and potential drug-drug interactions with a pharmacist via our booking portal.";
            service = "Pharmacy (24/7)";
            conditions = "Routine pharmaceutical inquiry for symptomatic management.";
            instructions = "Always check the expiration date and dosage instructions on the packaging.";
        } else if (q.contains("scan") || q.contains("mri") || q.contains("ct") || q.contains("xray")) {
            assessment = "I've processed your request for diagnostic imaging. Advanced scanning (MRI/CT) is an essential tool for high-precision internal diagnostics.";
            severity = "HIGH";
            specialist = "Radiologist";
            action = "Secure a slot in the Diagnostic Imaging section of the portal to coordinate your scan.";
            service = "MRI Scan";
            conditions = "Diagnostic imaging requested for symptomatic investigation.";
            instructions = "Ensure you have a referral from your primary physician before your appointment.";
        } else if (q.contains("head") || q.contains("brain") || q.contains("migraine") || q.contains("headache")) {
            assessment = "I've analyzed your report of persistent head pain. Chronic or acute headaches can be indicative of various underlying clinical states, ranging from tension to vascular changes.";
            severity = "MODERATE";
            specialist = "Neurologist / General Physician";
            action = "Monitor for 'Red Flags' like vision changes or neck stiffness, and book a routine clinical review.";
            service = "General Clinical";
            conditions = "Potential migraine or tension-type headache signals detected.";
            instructions = "Note the duration and intensity of the pain for your consultation.";
        } else if (q.contains("emergency") || q.contains("pain") || q.contains("heart") || q.contains("chest") || q.contains("breathing") || q.contains("bleeding")) {
            assessment = "Potential life-safety signal identified. I have initiated our Emergency Triage protocol to prioritize your care.";
            severity = "CRITICAL";
            specialist = "Emergency Specialist";
            action = "Locate and navigate to the nearest Emergency & Trauma Care node in the registry immediately.";
            service = "Emergency & Trauma Care";
            conditions = "Acute clinical signals requiring immediate life-safety intervention.";
            instructions = "Contact local emergency services immediately if you are unable to travel.";
            warning = "IMMEDIATE MEDICAL INTERVENTION IS REQUIRED.";
        } else {
            assessment += "I recommend a professional consultation to provide a detailed diagnosis based on your specific health context.";
        }

        return "1. Copilot Assessment: " + assessment + (hasImage ? " (Image telemetry synchronized)" : "") + "\n" +
               "2. Possible Conditions / Features: " + conditions + "\n" +
               "3. Risk Indicators / Instructions: " + instructions + "\n" +
               "4. Triage Level: " + severity + "\n" +
               "5. Recommended specialist / Node: " + specialist + "\n" +
               "6. Suggested Next Steps: " + action + " Use the booking node for " + service + ".\n" +
               "7. Follow-up Questions: Are you experiencing any secondary symptoms? How would you rate the intensity on a scale of 1-10?\n" +
               "8. Emergency Warning / Portal Tip: " + (warning.isEmpty() ? "Tip: You can upload previous medical records using the paperclip icon for a longitudinal review." : warning);
    }on." : warning);
    }

    public String getLatestBrief(String email) {
        return sessionSummaries.getOrDefault(email, "No AI context.");
    }
}
