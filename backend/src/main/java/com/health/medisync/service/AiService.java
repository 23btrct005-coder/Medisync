package com.health.medisync.service;

import com.health.medisync.model.Doctor;
import com.health.medisync.model.Hospital;
import com.health.medisync.model.AiQueryLog;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.HospitalRepository;
import com.health.medisync.repository.AppointmentRepository;
import com.health.medisync.repository.PatientRepository;
import com.health.medisync.repository.AiQueryLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Lazy;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiService {

    private final DoctorRepository doctorRepository;
    private final HospitalRepository hospitalRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final AppointmentService appointmentService;
    private final AiQueryLogRepository aiQueryLogRepository;
    
    private static final Map<String, String> sessionSummaries = new HashMap<>();

    public AiService(DoctorRepository doctorRepository, 
                     HospitalRepository hospitalRepository,
                     AppointmentRepository appointmentRepository,
                     PatientRepository patientRepository,
                     @Lazy AppointmentService appointmentService,
                     AiQueryLogRepository aiQueryLogRepository) {
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.appointmentService = appointmentService;
        this.aiQueryLogRepository = aiQueryLogRepository;
    }

    public String generateResponse(String query, String patientEmail) {
        String lowerQuery = query.toLowerCase();

        // 1. Emergency Detection
        if (isEmergency(lowerQuery)) {
            return "🚨 **CRITICAL EMERGENCY DETECTED** 🚨\n\nYour symptoms suggest a potentially life-threatening situation. \n\n" +
                   "**RISK LEVEL: CRITICAL**\n" +
                   "**ACTIONS REQUIRED:**\n" +
                   "1. Call Emergency Services (108/911) immediately.\n" +
                   "2. Head to the nearest ER room.\n\n" +
                   "**FOLLOW-UP:** Mandatory hospital visit.";
        }

        List<Doctor> allDoctors = doctorRepository.findAll();
        List<Hospital> allHospitals = hospitalRepository.findAll();

        // 2. Competitive Comparison Engine
        if (lowerQuery.contains("compare") || lowerQuery.contains("versus") || lowerQuery.contains("vs")) {
            StringBuilder sb = new StringBuilder("### 📊 Institutional Comparison Matrix\n\n");
            for (Hospital h : allHospitals.stream().limit(3).collect(Collectors.toList())) {
                sb.append("**").append(h.getName()).append("**\n");
                sb.append("- 💰 Fee: ₹").append(h.getConsultationTimings() != null ? "High Quality" : "Standard").append("\n");
                sb.append("- 🏥 Type: ").append(h.getHospitalType()).append("\n");
                sb.append("- 🧪 Services: ").append(h.getServices() != null ? h.getServices() : "Standard Diagnostic").append("\n");
                sb.append("- 🛡️ Insurance: ").append(h.getInsuranceProviders() != null ? "Supported" : "Cash Only").append("\n\n");
            }
            return sb.toString();
        }

        // 3. Symptom to Specialty Mapping & Risk Profiling
        String mappedSpecialty = mapSymptomToSpecialty(lowerQuery);
        String riskLevel = calculateRisk(lowerQuery);
        logQuery(query, mappedSpecialty);

        if (mappedSpecialty != null) {
            List<Doctor> specialists = allDoctors.stream()
                .filter(d -> d.isApproved() && (d.getSpecialization().toLowerCase().contains(mappedSpecialty)))
                .collect(Collectors.toList());

            if (!specialists.isEmpty()) {
                StringBuilder sb = new StringBuilder("### 🏥 Clinical Recommendation\n");
                sb.append("**DETECTED SPECIALTY:** ").append(mappedSpecialty.toUpperCase()).append("\n");
                sb.append("**HEALTH RISK:** ").append(riskLevel).append("\n\n");
                
                String brief = "AI RISK [" + riskLevel + "]: Patient reported " + mappedSpecialty + " issues. Query: '" + query + "'.";
                sessionSummaries.put(patientEmail, brief);

                sb.append("Recommended Experts:\n\n");
                for (Doctor d : specialists.stream().limit(2).collect(Collectors.toList())) {
                    sb.append("👨‍⚕️ **Dr. ").append(d.getName()).append("**\n");
                    sb.append("   [Book Now](/dashboard/booking?doctorId=").append(d.getId()).append(")\n\n");
                }
                
                sb.append("**NEXT STEP:** ").append(getFollowUpAdvice(mappedSpecialty));
                return sb.toString();
            }
        }

        // 4. Financial Intelligence
        if (lowerQuery.contains("insurance") || lowerQuery.contains("cost")) {
            return "I am scanning our financial network. Most hospitals in our network accept **ICICI, LIC, and Star Health**. \n\n" +
                   "General consultation fees range from **₹500 to ₹1500**. For a precise quote, please specify a hospital name.";
        }

        return "Hello! I am your MediSync Clinical Brain. I can help with **Symptom Analysis**, **Hospital Comparisons**, and **Emergency Triage**. How are you feeling today?";
    }

    private String calculateRisk(String query) {
        if (query.contains("severe") || query.contains("blood") || query.contains("chest") || query.contains("vision")) return "HIGH";
        if (query.contains("pain") || query.contains("fever") || query.contains("swelling")) return "MEDIUM";
        return "LOW";
    }

    private String getFollowUpAdvice(String specialty) {
        if (specialty.equals("cardiology")) return "Complete cardiac screening within 48 hours.";
        if (specialty.equals("dental")) return "Dental checkup within 1 week.";
        return "Monitor symptoms for 24 hours and consult if pain persists.";
    }

    private String mapSymptomToSpecialty(String query) {
        if (query.contains("heart") || query.contains("chest")) return "cardiology";
        if (query.contains("tooth") || query.contains("gum")) return "dental";
        if (query.contains("skin") || query.contains("rash")) return "dermatology";
        if (query.contains("bone") || query.contains("joint")) return "orthopedic";
        if (query.contains("ear") || query.contains("nose")) return "ent";
        if (query.contains("fever") || query.contains("cold")) return "general physician";
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
        String[] emergencies = {"stroke", "cannot breathe", "chest pain", "unconscious", "stroke", "poison"};
        for (String e : emergencies) {
            if (query.contains(e)) return true;
        }
        return false;
    }

    public String getLatestBrief(String email) {
        return sessionSummaries.getOrDefault(email, "No clinical context available.");
    }
}
