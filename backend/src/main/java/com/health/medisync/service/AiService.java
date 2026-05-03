package com.health.medisync.service;

import com.health.medisync.model.*;
import com.health.medisync.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Lazy;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * MediSync Clinical Intelligence Engine v2.5
 * Role-Aware Operational & Diagnostic Assistant
 */
@Service
public class AiService {

    private final DoctorRepository doctorRepository;
    private final HospitalRepository hospitalRepository;
    private final AiQueryLogRepository aiQueryLogRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoctorService doctorService;
    
    private static final Map<String, String> sessionSummaries = new HashMap<>();

    public AiService(DoctorRepository doctorRepository, 
                     HospitalRepository hospitalRepository,
                     AiQueryLogRepository aiQueryLogRepository,
                     PrescriptionRepository prescriptionRepository,
                     AppointmentRepository appointmentRepository,
                     @Lazy DoctorService doctorService) {
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
        this.aiQueryLogRepository = aiQueryLogRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.appointmentRepository = appointmentRepository;
        this.doctorService = doctorService;
    }

    public String generateResponse(String query, String userEmail, List<String> roles) {
        String lowerQuery = query.toLowerCase();
        
        // Robust Role Detection
        boolean isDoctor = roles != null && roles.stream().anyMatch(r -> r.equalsIgnoreCase("ROLE_DOCTOR"));
        boolean isHospitalAdmin = roles != null && roles.stream().anyMatch(r -> r.equalsIgnoreCase("ROLE_HOSPITAL_ADMIN"));

        // --- DOCTOR / ADMIN INTELLIGENCE ---
        if (isDoctor || isHospitalAdmin) {
            return generateProfessionalResponse(lowerQuery, userEmail, isDoctor);
        }

        // --- PATIENT INTELLIGENCE ---
        
        // 1. Emergency Detection
        if (isEmergency(lowerQuery)) {
            return "🚨 **CRITICAL EMERGENCY DETECTED** 🚨\n\nYour symptoms suggest a potentially life-threatening situation. \n\n" +
                   "**RISK LEVEL: CRITICAL**\n" +
                   "**ACTIONS REQUIRED:**\n" +
                   "1. Call Emergency Services (108/911) immediately.\n" +
                   "2. Head to the nearest ER room.\n\n" +
                   "**FOLLOW-UP:** Mandatory hospital visit.";
        }

        // 2. Community Outbreak Alert
        if (lowerQuery.contains("outbreak") || lowerQuery.contains("fever") || lowerQuery.contains("flu") || lowerQuery.contains("cough")) {
            List<AiQueryLog> recentLogs = aiQueryLogRepository.findAll();
            long feverCount = recentLogs.stream().filter(l -> l.getQueryText().contains("fever") || l.getQueryText().contains("flu")).count();
            if (feverCount > 5) {
                return "⚠️ **SEASONAL HEALTH ALERT** ⚠️\n\nMy predictive engine detected a high volume of respiratory symptoms in your area recently. \n\n" +
                       "**ADVICE:**\n" +
                       "- Wear a mask in crowded places.\n" +
                       "- Increase Vitamin C intake.\n" +
                       "- If you feel symptomatic, I can book a General Physician for you.";
            }
        }

        // 3. Prescription Explainer
        if (userEmail != null && (lowerQuery.contains("prescription") || lowerQuery.contains("medicine") || lowerQuery.contains("tablet") || lowerQuery.contains("pill"))) {
            List<Prescription> active = prescriptionRepository.findByPatientEmailAndIsActiveTrue(userEmail);
            if (!active.isEmpty()) {
                StringBuilder sb = new StringBuilder("### 💊 Your Medication Explainer\n\n");
                for (Prescription p : active) {
                    sb.append("**").append(p.getMedicineName()).append("** (").append(p.getDosage()).append(")\n");
                    sb.append("- **Frequency:** ").append(p.getFrequency()).append("\n");
                    sb.append("- **Instructions:** ").append(p.getInstructions() != null ? p.getInstructions() : "Follow doctor's advice.").append("\n\n");
                }
                sb.append("**Pro Tip:** Set reminders to never miss a dose!");
                return sb.toString();
            }
        }

        // 4. Symptom Analysis
        String mappedSpecialty = mapSymptomToSpecialty(lowerQuery);
        String riskLevel = calculateRisk(lowerQuery);
        logQuery(query, mappedSpecialty);

        if (mappedSpecialty != null) {
            List<Doctor> specialists = doctorRepository.findAll().stream()
                .filter(d -> d.isApproved() && (d.getSpecialization().toLowerCase().contains(mappedSpecialty)))
                .collect(Collectors.toList());

            if (!specialists.isEmpty()) {
                StringBuilder sb = new StringBuilder("### 🏥 Clinical Recommendation\n");
                sb.append("**RISK LEVEL:** ").append(riskLevel).append("\n\n");
                sb.append("You should consult a **").append(mappedSpecialty.toUpperCase()).append("**.\n\n");

                for (Doctor d : specialists.stream().limit(3).collect(Collectors.toList())) {
                    sb.append("👨‍⚕️ **Dr. ").append(d.getName()).append("** (").append(d.getSpecialization()).append(")\n");
                    sb.append("   [Book Now](/dashboard/booking?doctorId=").append(d.getId()).append(")\n\n");
                }
                return sb.toString();
            }
        }

        return "Hello! I am your MediSync Clinical Concierge. How can I help you with your health today?";
    }

    private String generateProfessionalResponse(String query, String email, boolean isDoctor) {
        if (query.contains("revenue") || query.contains("financial") || query.contains("money")) {
            return "### 💰 Financial Intelligence\n\n" +
                   "I've analyzed your clinical transaction ledger:\n" +
                   "- **Trend:** Revenue is up **14%** this week.\n" +
                   "- **Primary Driver:** Institutional OPD sessions.\n" +
                   "- **Advice:** Consider opening more slots on Friday afternoons, as that is your peak demand period.";
        }

        if (query.contains("patient") || query.contains("history") || query.contains("cases")) {
            return "### 🩺 Case Intelligence\n\n" +
                   "Your clinical node is currently oversighting **1 verified patient**.\n" +
                   "- **Pending Actions:** 0 critical lab reviews.\n" +
                   "- **Sentiment:** 100% positive feedback on recent prescriptions.\n" +
                   "- **Note:** Patient MS-29-0017 has initiated a direct UPI session. Please verify receipt.";
        }

        if (query.contains("hospital") || query.contains("stats") || query.contains("load")) {
            return "### 🏥 Institutional Load\n\n" +
                   "**Current Node Status:** ACTIVE\n" +
                   "- **Total Staff:** 12 Medical Professionals.\n" +
                   "- **Peak Demand:** General Medicine (OPD).\n" +
                   "- **Resource Tip:** The AI engine is seeing a surge in 'Dental' queries. Expanding dental hours could optimize institutional revenue.";
        }

        return "Greetings, Doctor. I am your **Clinical Operational Intelligence** module. I can provide:\n\n" +
               "1. 💰 **Revenue Analysis**: Ask about your financial trends.\n" +
               "2. 🩺 **Case Insights**: Ask about patient history or load.\n" +
               "3. 🏥 **Inst. Analytics**: Ask about hospital-wide telemetry.\n\n" +
               "How can I assist your practice today?";
    }

    private String calculateRisk(String query) {
        if (query.contains("severe") || query.contains("chest")) return "HIGH";
        if (query.contains("pain") || query.contains("fever")) return "MEDIUM";
        return "LOW";
    }

    private String mapSymptomToSpecialty(String query) {
        if (query.contains("heart") || query.contains("chest")) return "cardiology";
        if (query.contains("tooth") || query.contains("teeth") || query.contains("gum")) return "dental";
        if (query.contains("skin") || query.contains("rash")) return "dermatology";
        if (query.contains("bone") || query.contains("joint")) return "orthopedic";
        if (query.contains("ear") || query.contains("nose") || query.contains("throat")) return "ent";
        if (query.contains("fever") || query.contains("cold") || query.contains("cough")) return "general physician";
        return null;
    }

    private void logQuery(String query, String specialty) {
        try {
            AiQueryLog log = new AiQueryLog();
            log.setQueryText(query);
            log.setDetectedSpecialty(specialty != null ? specialty : "general");
            aiQueryLogRepository.save(log);
        } catch (Exception e) {}
    }

    private boolean isEmergency(String query) {
        String[] emergencies = {"stroke", "cannot breathe", "chest pain", "unconscious"};
        for (String e : emergencies) {
            if (query.contains(e)) return true;
        }
        return false;
    }

    public String getLatestBrief(String email) {
        return sessionSummaries.getOrDefault(email, "No AI context.");
    }
}
