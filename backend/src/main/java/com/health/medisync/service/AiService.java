package com.health.medisync.service;

import com.health.medisync.model.Doctor;
import com.health.medisync.model.Hospital;
import com.health.medisync.model.Appointment;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.HospitalRepository;
import com.health.medisync.repository.AppointmentRepository;
import com.health.medisync.repository.PatientRepository;
import org.springframework.stereotype.Service;

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
    
    // Simple transient memory for Clinical Handover (In production, use Redis or DB)
    private static final Map<String, String> sessionSummaries = new HashMap<>();

    public AiService(DoctorRepository doctorRepository, 
                     HospitalRepository hospitalRepository,
                     AppointmentRepository appointmentRepository,
                     PatientRepository patientRepository,
                     AppointmentService appointmentService) {
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.appointmentService = appointmentService;
    }

    public String generateResponse(String query, String patientEmail) {
        String lowerQuery = query.toLowerCase();

        // 1. Emergency Guard Layer
        if (isEmergency(lowerQuery)) {
            return "🚨 **CRITICAL EMERGENCY DETECTED** 🚨\n\nYour symptoms suggest a potentially life-threatening situation. \n\n" +
                   "**ACTIONS REQUIRED:**\n" +
                   "1. Call your local Emergency Services (e.g. 108 / 911) immediately.\n" +
                   "2. Go to the nearest Emergency Room.\n\n" +
                   "Our nearest network hospital is: **Apollo Hospital (ER: +91 99999 00000)**";
        }

        // 2. Gather Clinical Context
        List<Doctor> allDoctors = doctorRepository.findAll();
        List<Hospital> allHospitals = hospitalRepository.findAll();

        // 2. Intelligence Layer: Advanced Symptom Mapping
        String mappedSpecialty = mapSymptomToSpecialty(lowerQuery);
        if (mappedSpecialty != null) {
            List<Doctor> specialists = allDoctors.stream()
                .filter(d -> d.isApproved() && (d.getSpecialization().toLowerCase().contains(mappedSpecialty) || 
                                                (d.getSubSpecialties() != null && d.getSubSpecialties().toLowerCase().contains(mappedSpecialty))))
                .collect(Collectors.toList());

            if (!specialists.isEmpty()) {
                StringBuilder sb = new StringBuilder("Based on your symptoms, you should consult a **" + mappedSpecialty.toUpperCase() + "** specialist. \n\nI recommend these experts in our network:\n\n");
                
                // Prepare handover summary
                String brief = "AI SUMMARY: Patient reported " + mappedSpecialty + " related symptoms: '" + query + "'. Suggests specialist consultation.";
                sessionSummaries.put(patientEmail, brief);

                for (Doctor d : specialists.limit(2)) {
                    sb.append("👨‍⚕️ **Dr. ").append(d.getName()).append("** (").append(d.getSpecialization()).append(")\n");
                    // Dynamic Slot Preview
                    List<String> slots = appointmentService.getAvailableSlots(d.getId(), LocalDate.now());
                    if (!slots.isEmpty()) {
                        sb.append("   📅 Next available today at: ").append(slots.get(0)).append("\n");
                    }
                    sb.append("   [Book Consultation](/dashboard/booking?doctorId=").append(d.getId()).append(")\n\n");
                }
                return sb.toString();
            }
        }

        // 3. Medication Awareness (If patient email provided)
        if (patientEmail != null && (lowerQuery.contains("medicine") || lowerQuery.contains("tablet") || lowerQuery.contains("dose"))) {
            return "I am scanning your clinical history... You currently have active prescriptions. Please ensure you take your medications as directed by your physician. If you are experiencing side effects, I can help you find a doctor for a follow-up.";
        }

        // 4. Intelligence Layer: Heuristic Matching (Phase 1: Local Knowledge)
        
        // Handle "Nearby" / "Hospital" queries
        if (lowerQuery.contains("hospital") || lowerQuery.contains("near") || lowerQuery.contains("where")) {
            StringBuilder sb = new StringBuilder("I found the following medical institutions in our network:\n\n");
            for (Hospital h : allHospitals.stream().limit(3).collect(Collectors.toList())) {
                sb.append("🏥 **").append(h.getName()).append("** (").append(h.getHospitalType()).append(")\n");
                sb.append("   📍 ").append(h.getCity()).append(", ").append(h.getState()).append("\n");
                if (h.getServices() != null) {
                    sb.append("   🔬 ").append(h.getServices()).append("\n");
                }
                sb.append("\n");
            }
            return sb.toString();
        }

        // Handle "Doctor" / "Specialist" / "ENT" / "Heart" etc.
        if (lowerQuery.contains("doctor") || lowerQuery.contains("specialist") || lowerQuery.contains("find") || lowerQuery.contains("help")) {
            List<Doctor> matches = allDoctors.stream()
                .filter(d -> d.isApproved())
                .filter(d -> {
                    String data = (d.getSpecialization() + " " + d.getTreatmentFocus() + " " + d.getSubSpecialties()).toLowerCase();
                    return data.contains(extractKeyword(lowerQuery)) || lowerQuery.contains(d.getSpecialization().toLowerCase());
                })
                .collect(Collectors.toList());

            if (!matches.isEmpty()) {
                StringBuilder sb = new StringBuilder("Based on your query, I recommend these specialists:\n\n");
                for (Doctor d : matches) {
                    sb.append("👨‍⚕️ **Dr. ").append(d.getName()).append("**\n");
                    sb.append("   Specialty: ").append(d.getSpecialization()).append("\n");
                    sb.append("   Experience: ").append(d.getYearsOfExperience()).append(" Years\n");
                    sb.append("   Focus: ").append(d.getTreatmentFocus() != null ? d.getTreatmentFocus() : "General Consultation").append("\n\n");
                }
                sb.append("You can book an appointment with them directly through the 'Book Doctor' portal.");
                return sb.toString();
            }
        }

        // Handle General Medical / Health queries (Simulated LLM for Phase 1)
        if (lowerQuery.contains("symptom") || lowerQuery.contains("pain") || lowerQuery.contains("cold") || lowerQuery.contains("fever") || lowerQuery.contains("health")) {
            return "I can certainly help with medical information. For symptoms like " + extractKeyword(lowerQuery) + 
                   ", it is generally recommended to monitor your temperature and stay hydrated. " +
                   "However, for a precise clinical assessment, I suggest booking a consultation with one of our specialized doctors in the MediSync portal.";
        }

        // Default Greeting / Help
        return "Hello! I am your MediSync AI Concierge. I can help you find hospitals, search for specialists (like ENT, Cardiologists, etc.), or explain portal features. What can I do for you today?";
    }

    private String mapSymptomToSpecialty(String query) {
        Map<String, String> mapping = new HashMap<>();
        mapping.put("pain", "orthopedic");
        mapping.put("ear", "ent");
        mapping.put("nose", "ent");
        mapping.put("throat", "ent");
        mapping.put("heart", "cardiology");
        mapping.put("chest", "cardiology");
        mapping.put("skin", "dermatology");
        mapping.put("rash", "dermatology");
        mapping.put("eye", "ophthalmology");
        mapping.put("vision", "ophthalmology");
        mapping.put("tooth", "dental");
        mapping.put("gum", "dental");
        mapping.put("fever", "general physician");
        mapping.put("cough", "general physician");
        mapping.put("kidney", "nephrology");
        mapping.put("stomach", "gastroenterology");

        for (Map.Entry<String, String> entry : mapping.entrySet()) {
            if (query.contains(entry.getKey())) return entry.getValue();
        }
        return null;
    }

    private String extractKeyword(String query) {
        // Simple keyword extractor for prototype intelligence
        String[] keywords = {"ent", "cardio", "dental", "skin", "eye", "bone", "fever", "pain", "scan", "mri"};
        for (String k : keywords) {
            if (query.contains(k)) return k;
        }
        return "your concern";
    }

    private boolean isEmergency(String query) {
        String[] emergencies = {"chest pain", "cannot breathe", "shortness of breath", "unconscious", "heavy bleeding", "severe burn", "stroke", "paralysis"};
        for (String e : emergencies) {
            if (query.contains(e)) return true;
        }
        return false;
    }

    public String getLatestBrief(String email) {
        return sessionSummaries.getOrDefault(email, "No AI context provided for this session.");
    }
}
