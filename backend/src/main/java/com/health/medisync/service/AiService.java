package com.health.medisync.service;

import com.health.medisync.model.Doctor;
import com.health.medisync.model.Hospital;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.HospitalRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AiService {

    private final DoctorRepository doctorRepository;
    private final HospitalRepository hospitalRepository;

    public AiService(DoctorRepository doctorRepository, HospitalRepository hospitalRepository) {
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
    }

    public String generateResponse(String query) {
        String lowerQuery = query.toLowerCase();

        // 1. Gather Clinical Context
        List<Doctor> allDoctors = doctorRepository.findAll();
        List<Hospital> allHospitals = hospitalRepository.findAll();

        // 2. Intelligence Layer: Heuristic Matching (Phase 1: Local Knowledge)
        
        // Handle "Nearby" / "Hospital" queries
        if (lowerQuery.contains("hospital") || lowerQuery.contains("near") || lowerQuery.contains("where")) {
            StringBuilder sb = new StringBuilder("I found the following medical institutions in our network:\n\n");
            for (Hospital h : allHospitals) {
                sb.append("🏥 **").append(h.getName()).append("**\n");
                sb.append("   Location: ").append(h.getAddress()).append(", ").append(h.getCity()).append("\n");
                if (h.getServices() != null && !h.getServices().isEmpty()) {
                    sb.append("   Services: ").append(h.getServices()).append("\n");
                }
                sb.append("\n");
            }
            return sb.toString();
        }

        // Handle "Doctor" / "Specialist" / "ENT" / "Heart" etc.
        if (lowerQuery.contains("doctor") || lowerQuery.contains("specialist") || lowerQuery.contains("find") || lowerQuery.contains("help")) {
            List<Doctor> matches = allDoctors.stream()
                .filter(d -> d.getApproved())
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

    private String extractKeyword(String query) {
        // Simple keyword extractor for prototype intelligence
        String[] keywords = {"ent", "cardio", "dental", "skin", "eye", "bone", "fever", "pain", "scan", "mri"};
        for (String k : keywords) {
            if (query.contains(k)) return k;
        }
        return "your concern";
    }
}
