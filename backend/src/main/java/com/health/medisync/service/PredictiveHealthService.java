package com.health.medisync.service;

import com.health.medisync.model.Patient;
import com.health.medisync.model.Report;
import com.health.medisync.model.MedicalRecord;
import com.health.medisync.repository.ReportRepository;
import com.health.medisync.repository.MedicalRecordRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
public class PredictiveHealthService {

    private final GroqAiService groqAiService;
    private final ReportRepository reportRepository;
    private final MedicalRecordRepository medicalRecordRepository;

    public PredictiveHealthService(GroqAiService groqAiService, 
                                 ReportRepository reportRepository, 
                                 MedicalRecordRepository medicalRecordRepository) {
        this.groqAiService = groqAiService;
        this.reportRepository = reportRepository;
        this.medicalRecordRepository = medicalRecordRepository;
    }

    public String generateHealthRiskPrediction(Patient patient) {
        List<Report> reports = reportRepository.findByPatientId(patient.getId());
        List<MedicalRecord> records = medicalRecordRepository.findByPatientIdOrderByDateDesc(patient.getId());

        StringBuilder context = new StringBuilder();
        context.append("Patient: ").append(patient.getName()).append(" (Age: ").append(patient.getAge()).append(", Gender: ").append(patient.getGender()).append(")\n");
        context.append("Lifestyle: ").append(patient.getSmokingStatus()).append(", ").append(patient.getAlcoholStatus()).append(", ").append(patient.getExerciseFrequency()).append("\n");
        context.append("Medical History: ").append(patient.getMedicalInfo()).append(" | Diseases: ").append(patient.getExistingDiseases()).append("\n\n");

        context.append("Recent Lab/Clinical Reports:\n");
        for (Report r : reports.stream().limit(5).collect(Collectors.toList())) {
            context.append("- ").append(r.getFileName()).append(": ").append(r.getAiSummary()).append("\n");
        }

        context.append("\nRecent Medical Records/Consultations:\n");
        for (MedicalRecord m : records.stream().limit(5).collect(Collectors.toList())) {
            context.append("- ").append(m.getDate()).append(": ").append(m.getDiagnosis()).append(" | ").append(m.getSymptoms()).append("\n");
        }

        String prompt = "As a clinical predictive AI, analyze the following patient data and identify top 3 health risks and actionable recommendations. Return in a concise JSON format with keys 'risks' (list of strings) and 'recommendations' (list of strings).\n\n" + context.toString();

        try {
            return groqAiService.getCompletion("You are a predictive health analyzer.", prompt);
        } catch (Exception e) {
            return "{\"error\": \"Predictive engine currently recalibrating.\"}";
        }
    }
}
