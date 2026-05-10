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

    private final MedicalSafetyValidator safetyValidator;
    private final IntentRouterService intentRouter;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

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
                     TelemetryRepository telemetryRepository,
                     MedicalSafetyValidator safetyValidator,
                     IntentRouterService intentRouter) {
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
        this.safetyValidator = safetyValidator;
        this.intentRouter = intentRouter;
        this.objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
    }

    public String generateResponse(String query, List<Map<String, Object>> history, String userEmail, List<String> roles, String location, String imageData) {
        String currentTime = java.time.LocalTime.now().toString();
        String currentDate = java.time.LocalDate.now().toString();
        
        String intent = intentRouter.classifyIntent(query);
        String intentPrompt = intentRouter.getPromptTemplate(intent);

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

        String prompt = "### MEDISYNC ENTERPRISE CLINICAL COPILOT (V6.0)\n\n" +
                "ROLE: You are an enterprise-grade clinical intelligence engine. You must respond ONLY in structured JSON.\n\n" +
                "INTENT CONTEXT: " + intentPrompt + "\n" +
                "PATIENT ID: " + currentPatientId + " | NAME: " + currentPatientName + "\n\n" +
                "JSON SCHEMA (STRICT COMPLIANCE REQUIRED):\n" +
                "{\n" +
                "  \"sessionId\": \"string\",\n" +
                "  \"intent\": \"string\",\n" +
                "  \"triageLevel\": \"LOW | MODERATE | HIGH | CRITICAL\",\n" +
                "  \"confidenceScore\": 0.0 to 1.0,\n" +
                "  \"requiresAmbulance\": boolean,\n" +
                "  \"clinicalAssessment\": \"string\",\n" +
                "  \"possibleConditions\": [\"string\"],\n" +
                "  \"riskIndicators\": [\"string\"],\n" +
                "  \"recommendedSpecialist\": \"string\",\n" +
                "  \"suggestedNextSteps\": [\"string\"],\n" +
                "  \"followUpQuestions\": [\"string\"],\n" +
                "  \"emergencyWarning\": \"string\",\n" +
                "  \"abnormalFindings\": [\"string\"],\n" +
                "  \"explanation\": \"string (medically detailed why this matters)\",\n" +
                "  \"safetyFlags\": [\"string\"]\n" +
                "}\n\n" +
                "### INSTITUTIONAL REGISTRY:\n" +
                "HOSPITALS:\n" + hospitalList + "\n" +
                "DOCTORS:\n" + doctorList + "\n\n" +
                "### CLINICAL CONTEXT:\n" +
                "DATE: " + currentDate + " | TIME: " + currentTime + "\n" +
                "PROFILE: " + clinicalHistory.toString() + "\n" +
                "LOCATION: " + (location != null ? location : "Unknown") + "\n\n" +
                "### INTERACTION LOGS:\n" + (historyContext.length() > 0 ? historyContext.toString() : "Initial consultation.") + "\n\n" +
                "MANDATORY: DO NOT return any text outside the JSON object. NO markdown formatting.\n" +
                "### PATIENT QUERY:\n" + query;

        String rawResponse = null;
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

            rawResponse = geminiAiService.getCompletion(parts);
            if (rawResponse == null || rawResponse.contains("error")) {
                rawResponse = groqAiService.getCompletion(prompt);
            }

            // CLEANUP: Ensure only JSON is parsed
            if (rawResponse != null) {
                int start = rawResponse.indexOf("{");
                int end = rawResponse.lastIndexOf("}");
                if (start != -1 && end != -1) {
                    rawResponse = rawResponse.substring(start, end + 1);
                }
                
                ClinicalAiResponse structuredResponse = objectMapper.readValue(rawResponse, ClinicalAiResponse.class);
                structuredResponse.setIntent(intent);
                structuredResponse = safetyValidator.validate(structuredResponse);
                
                return objectMapper.writeValueAsString(structuredResponse);
            }
            
            return "{\"error\": \"Clinical reasoning interrupted\"}";
        } catch (Exception e) { 
            e.printStackTrace(); 
            return "{\"error\": \"System failure in reasoning engine\"}";
        }
    }

    public String getLatestBrief(String email) {
        return sessionSummaries.getOrDefault(email, "No AI context.");
    }
}
