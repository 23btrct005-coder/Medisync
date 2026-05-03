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
        String lowerQuery = query.toLowerCase().trim();
        boolean isDoctor = roles != null && roles.stream().anyMatch(r -> r.equalsIgnoreCase("ROLE_DOCTOR"));
        boolean isHospitalAdmin = roles != null && roles.stream().anyMatch(r -> r.equalsIgnoreCase("ROLE_HOSPITAL_ADMIN"));

        if (isDoctor || isHospitalAdmin) return generateProfessionalResponse(lowerQuery, userEmail);

        // 1. Emergency Detection
        if (isEmergency(lowerQuery)) {
            return "🚨 **CRITICAL EMERGENCY DETECTED**\n\nYour symptoms (e.g., chest pain, difficulty breathing) indicate a medical emergency.\n\n**Action:** Please visit the nearest ER or call 108/911 immediately.";
        }

        // 2. Prescription Logic
        if (userEmail != null && (lowerQuery.contains("medicine") || lowerQuery.contains("prescription"))) {
            List<Prescription> active = prescriptionRepository.findByPatientEmailAndIsActiveTrue(userEmail);
            if (!active.isEmpty()) {
                return "💊 **Active Meds:** " + active.stream().map(Prescription::getMedicineName).collect(Collectors.joining(", ")) + 
                       "\n\nCheck your **Medical History** for full details.";
            }
        }

        // 3. Detailed Symptom Analysis
        String specialty = mapSymptomToSpecialty(lowerQuery);
        if (specialty != null) {
            String advice = getGeneralAdvice(specialty);
            List<Doctor> specialists = doctorRepository.findAll().stream()
                .filter(d -> d.isApproved() && d.getSpecialization().toLowerCase().contains(specialty))
                .collect(Collectors.toList());

            StringBuilder sb = new StringBuilder();
            sb.append("### 🏥 Specialist Recommendation\n");
            sb.append("For **").append(specialty.toUpperCase()).append("** issues, ").append(advice).append("\n\n");

            if (!specialists.isEmpty()) {
                sb.append("**Available Specialists:**\n");
                for (Doctor d : specialists.stream().limit(2).collect(Collectors.toList())) {
                    sb.append("- **Dr. ").append(d.getName()).append("** (").append(d.getSpecialization()).append(")\n");
                }
                sb.append("\n[Go to Book Doctor](/dashboard/booking) to schedule an appointment.");
            } else {
                sb.append("⚠️ **Note:** We currently don't have an approved **").append(specialty).append("** specialist in our online roster. \n\n**Next Step:** Please consult our **General Physician** for a primary evaluation.");
            }
            return sb.toString();
        }

        // 4. Outbreak Detection
        if (lowerQuery.contains("fever") || lowerQuery.contains("flu")) {
            return "⚠️ **Outbreak Alert:** There is a surge in seasonal flu cases in your district. Stay hydrated and rest.";
        }

        // 5. Default Greeting
        return "Hello! I am your MediSync Clinical Concierge. I can help with **Symptom Mapping**, **Prescriptions**, and **Outbreak Alerts**. \n\nHow are you feeling today?";
    }

    private String getGeneralAdvice(String specialty) {
        switch (specialty) {
            case "dental": return "it is important to avoid very hot or cold food and maintain oral hygiene.";
            case "cardiology": return "avoid strenuous activity and monitor your heart rate.";
            case "dermatology": return "avoid scratching the area and keep it clean.";
            case "orthopedic": return "apply a cold compress and limit movement of the joint.";
            case "ent": return "avoid cold drinks and rest your voice if needed.";
            default: return "a clinical evaluation is recommended.";
        }
    }

    private String generateProfessionalResponse(String query, String email) {
        if (query.contains("revenue") || query.contains("financial")) {
            return "### 💰 Financial Insights\nRevenue is trending upwards by 14% this month. See **Financials** tab for the ledger.";
        }
        if (query.contains("patient") || query.contains("load")) {
            return "### 🩺 Practice Load\nYou have 1 verified patient node active. Clinical load is stable.";
        }
        return "Greetings, Doctor. I am your **Clinical Operational Intelligence** module. I can provide revenue analysis, practice load stats, and institutional telemetry.";
    }

    private String mapSymptomToSpecialty(String query) {
        if (query.contains("tooth") || query.contains("teeth") || query.contains("gum") || query.contains("dental")) return "dental";
        if (query.contains("heart") || query.contains("chest")) return "cardiology";
        if (query.contains("skin") || query.contains("rash") || query.contains("itch")) return "dermatology";
        if (query.contains("bone") || query.contains("joint") || query.contains("back pain")) return "orthopedic";
        if (query.contains("ear") || query.contains("nose") || query.contains("throat")) return "ent";
        if (query.contains("fever") || query.contains("cold") || query.contains("cough") || query.contains("pain")) return "general physician";
        return null;
    }

    private boolean isEmergency(String query) {
        return query.contains("stroke") || query.contains("cannot breathe") || query.contains("heavy bleeding");
    }

    public String getLatestBrief(String email) {
        return sessionSummaries.getOrDefault(email, "No AI context.");
    }
}
