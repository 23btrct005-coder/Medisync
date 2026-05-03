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
    private final AiQueryLogRepository aiQueryLogRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final DoctorService doctorService;
    
    private static final Map<String, String> sessionSummaries = new HashMap<>();

    public AiService(DoctorRepository doctorRepository, 
                     HospitalRepository hospitalRepository,
                     AiQueryLogRepository aiQueryLogRepository,
                     PrescriptionRepository prescriptionRepository,
                     @Lazy DoctorService doctorService) {
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
        this.aiQueryLogRepository = aiQueryLogRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.doctorService = doctorService;
    }

    public String generateResponse(String query, String patientEmail) {
        String lowerQuery = query.toLowerCase();

        // 1. Emergency Detection (Expanded)
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
        if (patientEmail != null && (lowerQuery.contains("prescription") || lowerQuery.contains("medicine") || lowerQuery.contains("tablet") || lowerQuery.contains("pill"))) {
            List<Prescription> active = prescriptionRepository.findByPatientEmailAndIsActiveTrue(patientEmail);
            if (!active.isEmpty()) {
                StringBuilder sb = new StringBuilder("### 💊 Your Medication Explainer\n\n");
                for (Prescription p : active) {
                    sb.append("**").append(p.getMedicineName()).append("** (").append(p.getDosage()).append(")\n");
                    sb.append("- **Frequency:** ").append(p.getFrequency()).append("\n");
                    sb.append("- **Instructions:** ").append(p.getInstructions() != null ? p.getInstructions() : "Follow doctor's advice.").append("\n\n");
                }
                sb.append("**Pro Tip:** Set reminders to never miss a dose!");
                return sb.toString();
            } else if (lowerQuery.contains("explain") || lowerQuery.contains("what is")) {
                return "I couldn't find any active prescriptions in your records. If you've recently been prescribed medicine, ensure it's logged in your **Health Wallet**.";
            }
        }

        List<Doctor> allDoctors = doctorRepository.findAll();
        List<Hospital> allHospitals = hospitalRepository.findAll();

        // 4. Competitive Comparison
        if (lowerQuery.contains("compare") || lowerQuery.contains("versus") || lowerQuery.contains("vs") || lowerQuery.contains("better")) {
            StringBuilder sb = new StringBuilder("### 📊 Institutional Comparison Matrix\n\n");
            for (Hospital h : allHospitals.stream().limit(3).collect(Collectors.toList())) {
                sb.append("**").append(h.getName()).append("**\n");
                sb.append("- 🏥 Type: ").append(h.getHospitalType() != null ? h.getHospitalType() : "General").append("\n");
                sb.append("- 🕒 Hours: ").append(h.getWorkingHours() != null ? h.getWorkingHours() : "24/7 Support").append("\n");
                sb.append("- 🧪 Services: ").append(h.getServices() != null ? h.getServices() : "Diagnostic").append("\n\n");
            }
            return sb.toString();
        }

        // 5. Symptom Analysis (Upgraded Keywords)
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

                sb.append("Based on your symptoms, you should consult a **").append(mappedSpecialty.toUpperCase()).append("**.\n\n");

                for (Doctor d : specialists.stream().limit(3).collect(Collectors.toList())) {
                    sb.append("👨‍⚕️ **Dr. ").append(d.getName()).append("** (").append(d.getSpecialization()).append(")\n");
                    try {
                        List<String> slots = doctorService.getAvailableSlots(d.getId(), LocalDate.now());
                        if (!slots.isEmpty()) sb.append("   - Next Slot: ").append(slots.get(0)).append("\n");
                    } catch (Exception e) {}
                    sb.append("   [Book Appointment](/dashboard/booking?doctorId=").append(d.getId()).append(")\n\n");
                }
                return sb.toString();
            } else {
                return "I've detected symptoms related to **" + mappedSpecialty + "**, but I couldn't find any matching specialists currently available in our network. \n\n**Advice:** Please consult a General Physician for a primary evaluation.";
            }
        }

        // 6. Generic Interaction / Guidance
        if (lowerQuery.contains("hello") || lowerQuery.contains("hi") || lowerQuery.contains("help")) {
            return "Hello! I am your MediSync Clinical Concierge. I can:\n\n" +
                   "1. 🧪 **Analyze Symptoms**: Tell me how you feel (e.g., 'I have a headache').\n" +
                   "2. 💊 **Explain Meds**: Ask about your active prescriptions.\n" +
                   "3. 🏥 **Compare Hospitals**: Ask to compare institutions.\n" +
                   "4. ⚠️ **Predict Outbreaks**: I'll alert you to local health trends.\n\n" +
                   "How can I assist you today?";
        }

        return "I understand you have a health query. Could you please provide more details about your symptoms so I can recommend the right specialist? (e.g., 'I have tooth pain' or 'My chest feels tight')";
    }

    private String calculateRisk(String query) {
        if (query.contains("severe") || query.contains("chest") || query.contains("breath") || query.contains("blood")) return "HIGH";
        if (query.contains("pain") || query.contains("fever") || query.contains("vomit")) return "MEDIUM";
        return "LOW";
    }

    private String mapSymptomToSpecialty(String query) {
        // Cardiology
        if (query.contains("heart") || query.contains("chest") || query.contains("palpitation")) return "cardiology";
        
        // Dental (Expanded)
        if (query.contains("tooth") || query.contains("teeth") || query.contains("gum") || query.contains("dentist") || query.contains("mouth")) return "dental";
        
        // Dermatology
        if (query.contains("skin") || query.contains("rash") || query.contains("itch") || query.contains("acne")) return "dermatology";
        
        // Orthopedic
        if (query.contains("bone") || query.contains("joint") || query.contains("back pain") || query.contains("fracture")) return "orthopedic";
        
        // ENT
        if (query.contains("ear") || query.contains("nose") || query.contains("throat") || query.contains("hearing")) return "ent";
        
        // Ophthalmology
        if (query.contains("eye") || query.contains("vision") || query.contains("sight")) return "ophthalmology";
        
        // General Physician
        if (query.contains("fever") || query.contains("cold") || query.contains("cough") || query.contains("headache") || query.contains("body pain")) return "general physician";
        
        // Neurology
        if (query.contains("brain") || query.contains("nerve") || query.contains("seizure") || query.contains("dizzy")) return "neurology";
        
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
        String[] emergencies = {"stroke", "cannot breathe", "chest pain", "unconscious", "heavy bleeding", "poison"};
        for (String e : emergencies) {
            if (query.contains(e)) return true;
        }
        return false;
    }

    public String getLatestBrief(String email) {
        return sessionSummaries.getOrDefault(email, "No AI context.");
    }
}
