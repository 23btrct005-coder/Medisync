package com.health.medisync.service;

import com.health.medisync.model.*;
import com.health.medisync.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Lazy;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
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

    /**
     * ELITE MULTI-AGENT ORCHESTRATOR
     * Orchestrates between specialized agents (Clinical, Visual, Portal) to deliver high-precision guidance.
     */
    public String generateResponse(String email, String query, String imageData, String location, List<Map<String, Object>> history) {
        StringBuilder historyContext = new StringBuilder();
        if (history != null) {
            for (Map<String, Object> msg : history) {
                String role = msg.get("role") != null ? msg.get("role").toString() : "UNKNOWN";
                String text = msg.get("text") != null ? msg.get("text").toString() : "";
                historyContext.append(role.toUpperCase()).append(": ").append(text).append("\n");
            }
        }

        // 1. Gather Institutional Registry Context
        String limitedHospitalList = hospitalRepository.findAll().stream().limit(10)
            .map(h -> "- " + h.getName() + " | Address: " + h.getStreet() + ", " + h.getCity() + ", " + h.getState() + " " + h.getPinCode() + " | Maps: " + (h.getGoogleMapsUrl() != null ? h.getGoogleMapsUrl() : "https://www.google.com/maps/search/?api=1&query=" + h.getName().replace(" ", "+")) + " [ID: " + h.getId() + "]")
            .collect(Collectors.joining("\n"));

        String limitedDoctorList = doctorRepository.findAll().stream().filter(Doctor::isApproved).limit(10)
            .map(d -> "- Dr. " + d.getName() + " (" + d.getSpecialization() + ") [ID: " + d.getId() + "] at " + (d.getHospitalEntity() != null ? d.getHospitalEntity().getName() : (d.getHospital() != null ? d.getHospital() : "Independent")))
            .collect(Collectors.joining("\n"));

        // 2. Gather Patient Clinical Context
        StringBuilder clinicalProfile = new StringBuilder("None");
        if (email != null) {
            userRepository.findByUsernameIgnoreCase(email).ifPresent(u -> {
                clinicalProfile.setLength(0);
                patientRepository.findByUserId(u.getId()).ifPresent(p -> {
                    clinicalProfile.append("Profile: ").append(p.getGender()).append(", ").append(p.getAge()).append("y. ");
                });
                telemetryRepository.findByPatientIdOrderByCreatedAtDesc(u.getId()).stream().findFirst().ifPresent(t -> {
                    clinicalProfile.append("Vitals: BP ").append(t.getBloodPressureSystolic()).append("/").append(t.getBloodPressureDiastolic()).append(", HR ").append(t.getHeartRate()).append(" bpm. ");
                });
            });
        }

        // 3. Orchestration Engine: Neural Loop
        try {
            String result = executeNeuralOrchestration(query, imageData, historyContext.toString(), location, limitedHospitalList, limitedDoctorList, clinicalProfile.toString());
            if (result != null && !isError(result)) {
                if (email != null) sessionSummaries.put(email, result.substring(0, Math.min(result.length(), 200)));
                return result;
            }
            throw new Exception("Neural Sequence Interrupted");
        } catch (Exception e) {
            System.err.println("ORCHESTRATOR_CRITICAL_FAILOVER: " + e.getMessage());
            return executeLocalExpertAgent(query, imageData != null && imageData.contains(","));
        }
    }

    private String executeNeuralOrchestration(String query, String imageData, String history, String location, String hospitals, String doctors, String profile) {
        String prompt = "### MEDISYNC MULTI-AGENT ORCHESTRATOR — ELITE CLINICAL MODE\n\n" +
                "OBJECTIVE: You are the Lead Orchestrator for the MediSync Copilot. You are a Board-Certified Emergency Physician and Institutional Expert.\n\n" +
                "### EMERGENCY VS. REGISTRY DISCERNMENT:\n" +
                "- SYMPTOMS (Chest pain, Heart attack, trauma): IMMEDIATELY prioritize CRITICAL triage and map to Emergency/Cardiology.\n" +
                "- INQUIRIES (Heart specialist, Best doctor, How to book): Prioritize LOW triage and map to specific specialist booking without emergency escalation.\n\n" +
                "### COMMUNICATION PROTOCOLS:\n" +
                "- Tone: Elite, calm, professional. Use high-fidelity clinical terms only for actual clinical situations.\n" +
                "- NO INTERNAL DISCLOSURE: Never mention models, nodes, or technical states.\n\n" +
                "### PORTAL NAVIGATOR:\n" +
                "- Booking: '/dashboard/booking' | Reports: '/dashboard/reports'\n\n" +
                "### 8-HEADER CLINICAL PROTOCOL:\n" +
                "1. Copilot Assessment: [Primary reasoning & board-certified clinical empathy]\n" +
                "2. Possible Conditions / Features: [Differential diagnosis OR portal features]\n" +
                "3. Risk Indicators / Instructions: [Clinical red flags OR operational steps]\n" +
                "4. Triage Level: [LOW | MODERATE | HIGH | CRITICAL]\n" +
                "5. Recommended specialist / Node: [Specific department AND specialist type]\n" +
                "6. Suggested Next Steps: [Actionable advice with MediSync routes]\n" +
                "7. Follow-up Questions: [Refining the assessment]\n" +
                "8. Emergency Warning / Portal Tip: [Safety info OR institutional pro-tip]\n\n" +
                "### CONTEXT:\n" +
                "REGISTRY:\n" + hospitals + "\n" + doctors + "\n" +
                "PATIENT PROFILE: " + profile + "\n" +
                "LOCATION: " + location + "\n" +
                "CHAT HISTORY: " + history + "\n\n" +
                "### USER QUERY: " + query;

        boolean startWithGemini = new java.util.Random().nextBoolean();
        String response;

        if (startWithGemini) {
            response = geminiAiService.getCompletion(createGeminiParts(prompt, imageData));
            if (response == null || isError(response)) response = openAiService.getCompletion(prompt, getBase64(imageData), getMime(imageData));
        } else {
            response = openAiService.getCompletion(prompt, getBase64(imageData), getMime(imageData));
            if (response == null || isError(response)) response = geminiAiService.getCompletion(createGeminiParts(prompt, imageData));
        }

        // Secondary Backup: Groq
        if (response == null || isError(response)) response = groqAiService.getCompletion(prompt);

        return response;
    }

    private String executeLocalExpertAgent(String query, boolean hasImage) {
        String q = query.toLowerCase();
        String assessment = "I am your MediSync Copilot. Based on the clinical signals in your query, I have analyzed your situation against our institutional safety registry. ";
        String severity = "MODERATE";
        String specialist = "General Physician";
        String action = "A professional clinical evaluation at your nearest MediSync node is recommended for a definitive diagnosis.";
        String service = "General Clinical";
        String conditions = "Initial symptoms require physical examination for precise correlation.";
        String instructions = "Please monitor for any changes in symptom intensity or the development of new indicators.";
        String warning = "";

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
        } else if ((q.contains("heart") || q.contains("cardiac") || q.contains("chest") || q.contains("breathing")) && 
                  (q.contains("pain") || q.contains("sharp") || q.contains("attack") || q.contains("emergency") || q.contains("crisis") || q.contains("shortness"))) {
            assessment = "Potential acute cardiovascular or respiratory signal identified. I have initiated our Emergency Triage protocol to prioritize your immediate safety.";
            severity = "CRITICAL";
            specialist = "Cardiologist / Emergency Specialist";
            action = "Locate and navigate to the nearest Emergency & Trauma Care node in the registry immediately. Do not drive yourself.";
            service = "Emergency & Trauma Care";
            conditions = "Acute clinical signals requiring immediate life-safety cardiovascular intervention.";
            instructions = "If symptoms worsen, contact emergency services (Ambulance) immediately.";
            warning = "LIFE-SAFETY SIGNAL DETECTED: SEEK EMERGENCY CARE IMMEDIATELY.";
        } else if (q.contains("heart") || q.contains("cardiac") || q.contains("cardio")) {
            assessment = "I've noted your interest in cardiovascular health services. MediSync provides access to elite cardiologists and diagnostic heart centers.";
            severity = "LOW";
            specialist = "Cardiologist";
            action = "You can view available heart specialists and book a routine consultation via the cardiology node.";
            service = "General Clinical";
            conditions = "Cardiovascular specialist inquiry identified.";
            instructions = "Have your recent vitals or blood reports ready for the consultation.";
        } else if (q.contains("blood pressure") || q.contains(" bp ") || q.startsWith("bp ") || q.contains("hypertension") || q.contains("pressure is")) {
            assessment = "Your blood pressure telemetry indicates a potentially high-risk cardiovascular state. Managing hypertension is critical to preventing acute vascular events.";
            severity = "CRITICAL";
            specialist = "Cardiologist / Emergency Specialist";
            action = "Secure an immediate evaluation at an Emergency node for hypertensive stabilization.";
            service = "Emergency & Trauma Care";
            conditions = "Potential hypertensive urgency requiring pharmacological stabilization.";
            instructions = "Rest quietly and avoid physical exertion until you are evaluated by a clinician.";
            warning = "HYPERTENSIVE CRISIS POTENTIAL: IMMEDIATE MEDICAL OVERSIGHT REQUIRED.";
        } else if (q.contains("skin") || q.contains("rash") || q.contains("itch") || q.contains("hive") || q.contains("allergy") || q.contains("redness") || q.contains("swelling")) {
            assessment = "Your report of skin-related changes, such as a rash or localized irritation, requires a visual dermatological correlation to rule out acute allergic reactions or inflammatory conditions.";
            severity = "MODERATE";
            specialist = "Dermatologist";
            action = "Secure a teledermatology or in-person consultation for a high-resolution skin assessment.";
            service = "General Clinical";
            conditions = "Localized dermatological inflammation or allergic response (Urticaria/Dermatitis).";
            instructions = "Avoid scratching the affected area and monitor for any spreading or systemic symptoms like fever.";
        } else if (q.contains("report") || q.contains("how can i see") || q.contains("view history")) {
            assessment = "You can access your entire medical history, including lab results and previous diagnoses, in the 'Reports' section of your dashboard.";
            severity = "LOW";
            specialist = "MediSync Support";
            action = "Navigate to /dashboard/reports to view your digitized clinical history.";
            service = "General Clinical";
            conditions = "Portal navigation request identified.";
            instructions = "Ensure you are logged in to see your private medical records.";
        } else if (q.contains("paracetamol") || q.contains("ibuprofen") || q.contains("aspirin") || q.contains("medicine") || q.contains("tablet") || q.contains("pill") || q.contains("fever")) {
            assessment = "I've noted your inquiry regarding pharmacological intake or mild fever. While common medications are often used for symptomatic relief, they must follow professional dosage guidelines.";
            severity = "LOW";
            specialist = "General Practitioner / Pharmacist";
            action = "Verify safe dosage and potential drug-drug interactions with a pharmacist via our booking portal.";
            service = "Pharmacy (24/7)";
            conditions = "Routine pharmaceutical or symptomatic inquiry.";
            instructions = "Always check the expiration date and dosage instructions on the packaging.";
        } else if (q.contains("scan") || q.contains("mri") || q.contains("ct") || q.contains("xray")) {
            assessment = "I've processed your request for diagnostic imaging. Advanced scanning (MRI/CT) is an essential tool for high-precision internal diagnostics.";
            severity = "HIGH";
            specialist = "Radiologist";
            action = "Secure a slot in the Diagnostic Imaging section of the portal to coordinate your scan.";
            service = "MRI Scan";
            conditions = "Diagnostic imaging requested for symptomatic investigation.";
            instructions = "Ensure you have a referral from your primary physician before your appointment.";
        } else {
            assessment += "I recommend a professional consultation for clinical clarity.";
            severity = "MODERATE";
        }

        return "1. Copilot Assessment: " + assessment + "\n" +
               "2. Possible Conditions / Features: " + conditions + "\n" +
               "3. Risk Indicators / Instructions: " + instructions + "\n" +
               "4. Triage Level: " + severity + "\n" +
               "5. Recommended specialist / Node: " + specialist + "\n" +
               "6. Suggested Next Steps: " + action + " Use the booking node for " + service + ".\n" +
               "7. Follow-up Questions: Are you experiencing dizziness or nausea?\n" +
               "8. Emergency Warning / Portal Tip: " + (warning.isEmpty() ? "Tip: Access your records in 'Reports'." : warning);
    }

    // --- HELPER UTILITIES ---
    private List<Map<String, Object>> createGeminiParts(String prompt, String imageData) {
        List<Map<String, Object>> parts = new ArrayList<>();
        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", prompt);
        parts.add(textPart);
        if (imageData != null && imageData.contains(",")) {
            Map<String, Object> imagePart = new HashMap<>();
            Map<String, String> inlineData = new HashMap<>();
            inlineData.put("mime_type", getMime(imageData));
            inlineData.put("data", getBase64(imageData));
            imagePart.put("inline_data", inlineData);
            parts.add(imagePart);
        }
        return parts;
    }

    private String getBase64(String data) {
        return (data != null && data.contains(",")) ? data.split(",")[1] : null;
    }

    private String getMime(String data) {
        return (data != null && data.contains(",")) ? data.split(",")[0].split(":")[1].split(";")[0] : null;
    }

    private boolean isError(String res) {
        return res == null || res.contains("error") || res.contains("403") || res.isEmpty();
    }

    public String getLatestBrief(String email) {
        return sessionSummaries.getOrDefault(email, "No AI context.");
    }
}
