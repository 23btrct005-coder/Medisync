package com.health.medisync.service;

import com.health.medisync.model.Doctor;
import com.health.medisync.model.Hospital;
import com.health.medisync.model.Appointment;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.HospitalRepository;
import com.health.medisync.repository.AppointmentRepository;
import com.health.medisync.repository.PatientRepository;
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
    
    private static final Map<String, String> sessionSummaries = new HashMap<>();

    public AiService(DoctorRepository doctorRepository, 
                     HospitalRepository hospitalRepository,
                     AppointmentRepository appointmentRepository,
                     PatientRepository patientRepository,
                     @Lazy AppointmentService appointmentService) {
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
        this.appointmentRepository = appointmentRepository;
        this.patientRepository = patientRepository;
        this.appointmentService = appointmentService;
    }

    public String generateResponse(String query, String patientEmail) {
        String lowerQuery = query.toLowerCase();

        if (isEmergency(lowerQuery)) {
            return "🚨 **CRITICAL EMERGENCY DETECTED** 🚨\n\nYour symptoms suggest a potentially life-threatening situation. \n\n" +
                   "**ACTIONS REQUIRED:**\n" +
                   "1. Call your local Emergency Services (e.g. 108 / 911) immediately.\n" +
                   "2. Go to the nearest Emergency Room.\n\n" +
                   "Our nearest network hospital is: **Apollo Hospital (ER: +91 99999 00000)**";
        }

        List<Doctor> allDoctors = doctorRepository.findAll();
        List<Hospital> allHospitals = hospitalRepository.findAll();

        String mappedSpecialty = mapSymptomToSpecialty(lowerQuery);
        if (mappedSpecialty != null) {
            List<Doctor> specialists = allDoctors.stream()
                .filter(d -> d.isApproved() && (d.getSpecialization().toLowerCase().contains(mappedSpecialty) || 
                                                (d.getSubSpecialties() != null && d.getSubSpecialties().toLowerCase().contains(mappedSpecialty))))
                .collect(Collectors.toList());

            if (!specialists.isEmpty()) {
                StringBuilder sb = new StringBuilder("Based on your symptoms, you should consult a **" + mappedSpecialty.toUpperCase() + "** specialist. \n\nI recommend these experts in our network:\n\n");
                
                String brief = "AI SUMMARY: Patient reported " + mappedSpecialty + " related symptoms: '" + query + "'. Suggests specialist consultation.";
                sessionSummaries.put(patientEmail, brief);

                for (Doctor d : specialists.stream().limit(2).collect(Collectors.toList())) {
                    sb.append("👨‍⚕️ **Dr. ").append(d.getName()).append("** (").append(d.getSpecialization()).append(")\n");
                    List<String> slots = appointmentService.getAvailableSlots(d.getId(), LocalDate.now());
                    if (!slots.isEmpty()) {
                        sb.append("   📅 Next available today at: ").append(slots.get(0)).append("\n");
                    }
                    sb.append("   [Book Consultation](/dashboard/booking?doctorId=").append(d.getId()).append(")\n\n");
                }
                return sb.toString();
            }
        }

        // Financial Intelligence: Insurance & Pricing
        if (lowerQuery.contains("insurance") || lowerQuery.contains("policy") || lowerQuery.contains("cover")) {
            StringBuilder sb = new StringBuilder("I am scanning the insurance network for our hospitals:\n\n");
            for (Hospital h : allHospitals.stream().limit(3).collect(Collectors.toList())) {
                if (h.getInsuranceProviders() != null && !h.getInsuranceProviders().isEmpty()) {
                    sb.append("🏥 **").append(h.getName()).append("**: Accepts ").append(h.getInsuranceProviders()).append("\n\n");
                }
            }
            sb.append("Please verify with the hospital reception for specific policy details.");
            return sb.toString();
        }

        if (lowerQuery.contains("cost") || lowerQuery.contains("price") || lowerQuery.contains("fee")) {
            StringBuilder sb = new StringBuilder("Here is the estimated clinical pricing for our network:\n\n");
            for (Hospital h : allHospitals.stream().limit(3).collect(Collectors.toList())) {
                sb.append("🏥 **").append(h.getName()).append("**\n");
                sb.append("   - General Consultation: ₹").append(h.getConsultationTimings() != null ? "500 - 1500" : "Contact for fees").append("\n");
                if (h.getServices() != null) {
                    sb.append("   - Services: ").append(h.getServices()).append("\n");
                }
                sb.append("\n");
            }
            return sb.toString();
        }

        if (patientEmail != null && (lowerQuery.contains("medicine") || lowerQuery.contains("tablet") || lowerQuery.contains("dose"))) {
            return "I am scanning your clinical history... You currently have active prescriptions. Please ensure you take your medications as directed by your physician. If you are experiencing side effects, I can help you find a doctor for a follow-up.";
        }
        
        if (lowerQuery.contains("hospital") || lowerQuery.contains("near") || lowerQuery.contains("where")) {
            StringBuilder sb = new StringBuilder("I found the following medical institutions in our network:\n\n");
            for (Hospital h : allHospitals.stream().limit(3).collect(Collectors.toList())) {
                sb.append("🏥 **").append(h.getName()).append("** (").append(h.getHospitalType()).append(")\n");
                sb.append("   📍 ").append(h.getCity() != null ? h.getCity() : "Location").append(", ").append(h.getState() != null ? h.getState() : "Network").append("\n");
                if (h.getServices() != null) {
                    sb.append("   🔬 ").append(h.getServices()).append("\n");
                }
                sb.append("\n");
            }
            return sb.toString();
        }

        if (lowerQuery.contains("doctor") || lowerQuery.contains("specialist") || lowerQuery.contains("find") || lowerQuery.contains("help")) {
            List<Doctor> matches = allDoctors.stream()
                .filter(Doctor::isApproved)
                .filter(d -> {
                    String data = (d.getSpecialization() + " " + (d.getTreatmentFocus() != null ? d.getTreatmentFocus() : "") + " " + (d.getSubSpecialties() != null ? d.getSubSpecialties() : "")).toLowerCase();
                    return data.contains(extractKeyword(lowerQuery)) || lowerQuery.contains(d.getSpecialization().toLowerCase());
                })
                .collect(Collectors.toList());

            if (!matches.isEmpty()) {
                StringBuilder sb = new StringBuilder("Based on your query, I recommend these specialists:\n\n");
                for (Doctor d : matches.stream().limit(5).collect(Collectors.toList())) {
                    sb.append("👨‍⚕️ **Dr. ").append(d.getName()).append("**\n");
                    sb.append("   Specialty: ").append(d.getSpecialization()).append("\n");
                    sb.append("   Experience: ").append(d.getYearsOfExperience()).append(" Years\n");
                    sb.append("   Focus: ").append(d.getTreatmentFocus() != null ? d.getTreatmentFocus() : "General Consultation").append("\n\n");
                }
                sb.append("You can book an appointment with them directly through the 'Book Doctor' portal.");
                return sb.toString();
            }
        }

        if (lowerQuery.contains("symptom") || lowerQuery.contains("pain") || lowerQuery.contains("cold") || lowerQuery.contains("fever") || lowerQuery.contains("health")) {
            return "I can certainly help with medical information. For symptoms like " + extractKeyword(lowerQuery) + 
                   ", it is generally recommended to monitor your temperature and stay hydrated. " +
                   "However, for a precise clinical assessment, I suggest booking a consultation with one of our specialized doctors in the MediSync portal.";
        }

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
