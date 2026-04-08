package com.health.medisync.service;

import com.health.medisync.model.Patient;
import com.health.medisync.model.Report;
import com.health.medisync.repository.ReportRepository;
import org.springframework.stereotype.Service;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;

@Service
public class ReportService {
    private final ReportRepository reportRepository;
    private final PatientService patientService;
    private final GroqAiService aiService;

    public ReportService(ReportRepository reportRepository, PatientService patientService, GroqAiService aiService) {
        this.reportRepository = reportRepository;
        this.patientService = patientService;
        this.aiService = aiService;
    }

    public Report uploadReport(String username, MultipartFile file) throws Exception {
        Patient patient = patientService.getPatientProfile(username);

        Report report = new Report();
        report.setPatient(patient);
        report.setFileName(file.getOriginalFilename());
        report.setFileType(file.getContentType());
        report.setFileData(file.getBytes());
        report.setUploadDate(LocalDate.now());

        // Analyze using Groq AI Vision
        String aiSummary = aiService.analyzeReport(file.getBytes(), file.getContentType(), patient.getName(), patient.getAge() != null ? patient.getAge() : 0);
        if (aiSummary != null && aiSummary.contains("ERROR_PROFILE_MISMATCH")) {
            throw new RuntimeException("Security Block: The Name on the uploaded document does not match your profile. Uploads for other patients are prohibited.");
        }        
        report.setAiSummary(aiSummary);

        return reportRepository.save(report);
    }

    public List<Report> getMyReports(String username) {
        Patient patient = patientService.getPatientProfile(username);
        return reportRepository.findByPatientId(patient.getId());
    }

    public Report getReportForDownload(String username, Long id) {
        Patient patient = patientService.getPatientProfile(username);
        Report report = reportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Report not found"));
            
        if (!report.getPatient().getId().equals(patient.getId())) {
            throw new RuntimeException("Unauthorized access to report");
        }
        return report;
    }
}
