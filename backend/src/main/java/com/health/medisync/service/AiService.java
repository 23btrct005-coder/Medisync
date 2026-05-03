package com.health.medisync.service;

import com.health.medisync.model.Doctor;
import com.health.medisync.model.Hospital;
import com.health.medisync.model.AiQueryLog;
import com.health.medisync.model.Prescription;
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
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final AppointmentService appointmentService;
    private final AiQueryLogRepository aiQueryLogRepository;
    private final PrescriptionRepository prescriptionRepository;
    
    private static final Map<String, String> sessionSummaries = new HashMap<>();

    public AiService(DoctorRepository doctorRepository, 
                     HospitalRepository hospitalRepository,
                     AppointmentRepository appointmentRepository,
                     PatientRepository patientRepository,
                     @Lazy AppointmentService appointmentService,
                     AiQueryLogRepository aiQueryLogRepository,
                     PrescriptionRepository prescriptionRepository) {
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.appointmentService = appointmentService;
        this.aiQueryLogRepository = aiQueryLogRepository;
        this.prescriptionRepository = prescriptionRepository;
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

        // 2. Community Outbreak Alert
        if (lowerQuery.contains("outbreak") || lowerQuery.contains("fever") || lowerQuery.contains("flu")) {
            List<AiQueryLog> recentLogs = aiQueryLogRepository.findAll();
            long feverCount = recentLogs.stream().filter(l -> l.getQueryText().contains("fever")).count();
            if (feverCount > 5) {
                return "⚠️ **SEASONAL HEALTH ALERT** ⚠️\n\nMy predictive engine detected a high volume of 'Fever' queries in your area recently. \n\n" +
                       "**ADVICE:**\n" +
                       "- Wear a mask in crowded places.\n" +
                       "- Stay hydrated.\n" +
                       "- If you feel symptomatic, I can book a General Physician for you.";
            }
        }

        // 3. Prescription Explainer
        if (patientEmail != null && (lowerQuery.contains("prescription") || lowerQuery.contains("medicine") || lowerQuery.contains("tablet"))) {
            List<Prescription> active = prescriptionRepository.findByPatientEmailAndIsActiveTrue(patientEmail);
            if (!active.isEmpty()) {
                StringBuilder sb = new StringBuilder("### 💊 Your Medication Explainer\n\n");
                for (Prescription p : active) {
                    sb.append("**").append(p.getMedicineName()).append("** (").append(p.getDosage()).append(")\n");
                    sb.append("- **Frequency:** ").append(p.getFrequency()).append("\n");
                    sb.append("- **Purpose:** Prescribed by Dr. ").append(p.getDoctor() != null ? p.getDoctor().getName() : "your physician")
                      .append(".\n");
                    sb.append("- **Instructions:** ").append(p.getInstructions() != null ? p.getInstructions() : "Follow doctor's advice.").append("\n\n");
                }
                sb.append("**Pro Tip:** Set reminders to never miss a dose!");
                return sb.toString();
            }
        }

        List<Doctor> allDoctors = doctorRepository.findAll();
        List<Hospital> allHospitals = hospitalRepository.findAll();

        // 4. Competitive Comparison (FIXED: removed non-existent getConsultationTimings)
        if (lowerQuery.contains("compare") || lowerQuery.contains("versus") || lowerQuery.contains("vs")) {
            StringBuilder sb = new StringBuilder("### 📊 Institutional Comparison Matrix\n\n");
            for (Hospital h : allHospitals.stream().limit(3).collect(Collectors.toList())) {
                sb.append("**").append(h.getName()).append("**\n");
                sb.append("- 🏥 Type: ").append(h.getHospitalType() != null ? h.getHospitalType() : "General").append("\n");
                sb.append("- 🕒 Hours: ").append(h.getWorkingHours() != null ? h.getWorkingHours() : "24/7 Support").append("\n");
                sb.append("- 🧪 Services: ").append(h.getServices() != null ? h.getServices() : "Diagnostic").append("\n\n");
            }
            return sb.toString();
        }

        // 5. Symptom Analysis
        String mappedSpecialty = mapSymptomToSpecialty(lowerQuery);
        String riskLevel = calculateRisk(lowerQuery);
        logQuery(query, mappedSpecialty);

        if (mappedSpecialty != null) {
            List<Doctor> specialists = allDoctors.stream()
                .filter(d -> d.isApproved() && (d.getSpecialization().toLowerCase().contains(mappedSpecialty)))
                .collect(Collectors.toList());

            if (!specialists.isEmpty()) {
                StringBuilder sb = new StringBuilder("### 🏥 Clinical Recommendation\n");
                sb.append("**RISK LEVEL:** ").append(riskLevel).append("\n\n");
                
                String brief = "AI RISK [" + riskLevel + "]: Patient reported " + mappedSpecialty + " issues.";
                sessionSummaries.put(patientEmail, brief);

                for (Doctor d : specialists.stream().limit(2).collect(Collectors.toList())) {
                    sb.append("👨‍⚕️ **Dr. ").append(d.getName()).append("** (").append(d.getSpecialization()).append(")\n");
                    sb.append("   [Book Now](/dashboard/booking?doctorId=").append(d.getId()).append(")\n\n");
                }
                return sb.toString();
            }
        }

        return "Hello! I am your MediSync Clinical Concierge. I can explain your **Prescriptions**, alert you to **Seasonal Outbreaks**, and help with **Symptom Mapping**. How can I help you today?";
    }

    private String calculateRisk(String query) {
        if (query.contains("severe") || query.contains("chest")) return "HIGH";
        if (query.contains("pain") || query.contains("fever")) return "MEDIUM";
        return "LOW";
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
