package com.health.medisync.service;

import com.health.medisync.model.Doctor;
import com.health.medisync.model.User;
import com.health.medisync.model.Patient;
import com.health.medisync.model.Report;
import com.health.medisync.repository.ReportRepository;
import com.health.medisync.repository.UserRepository;
import com.health.medisync.repository.DoctorRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;

@Service
public class ReportService {
    private final ReportRepository reportRepository;
    private final PatientService patientService;
    private final GroqAiService groqAiService;
    private final OpenAiService openAiService;
    private final MonaiService monaiService;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;

    public ReportService(ReportRepository reportRepository, PatientService patientService, 
                         GroqAiService groqAiService, OpenAiService openAiService, 
                         MonaiService monaiService, 
                         UserRepository userRepository, DoctorRepository doctorRepository) {
        this.reportRepository = reportRepository;
        this.patientService = patientService;
        this.groqAiService = groqAiService;
        this.openAiService = openAiService;
        this.monaiService = monaiService;
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
    }

    public Report uploadReport(String username, MultipartFile file) throws Exception {
        Patient patient = patientService.getPatientProfile(username);

        Report report = new Report();
        report.setPatient(patient);
        report.setFileName(file.getOriginalFilename());
        report.setFileType(file.getContentType());
        report.setFileData(file.getBytes());
        report.setUploadDate(LocalDate.now());

        performClinicalAnalysis(report, patient);

        return reportRepository.save(report);
    }

    public void performClinicalAnalysis(Report report, Patient patient) {
        byte[] fileData = report.getFileData();
        String contentType = report.getFileType();
        String fileName = report.getFileName();
        String patientName = patient.getName();
        int patientAge = patient.getAge() != null ? patient.getAge() : 0;

        // 1. High-Accuracy Master Reasoning (Powered by OpenAI GPT-4o)
        String openAiAnalysis = null;
        try {
            openAiAnalysis = openAiService.analyzeReport(fileData, contentType, patientName, patientAge);
        } catch (Exception e) {
            System.err.println("OpenAI hard failure: " + e.getMessage());
        }

        if (openAiAnalysis != null) {
            if (openAiAnalysis.contains("ERROR_PROFILE_MISMATCH")) {
                report.setClinicalReasoning("SECURITY BLOCK: This document belongs to a different patient.");
            } else {
                report.setClinicalReasoning(openAiAnalysis);
            }
        } else {
            // Failover to Groq Llama 3.3 for Deep Reasoning
            System.out.println("DEBUG: OpenAI unavailable or rate-limited. Falling back to Groq for Master Reasoning...");
            try {
                String groqFailover = groqAiService.analyzeReport(fileData, contentType, patientName, patientAge);
                if (groqFailover != null && groqFailover.contains("ERROR_PROFILE_MISMATCH")) {
                    report.setClinicalReasoning("SECURITY BLOCK: This document belongs to a different patient.");
                } else {
                    report.setClinicalReasoning(groqFailover != null ? groqFailover : "Clinical reasoning is temporarily unavailable across all providers.");
                }
            } catch (Exception e) {
                report.setClinicalReasoning("AI services are currently busy. Please try again later.");
            }
        }

        // 2. High-Speed Clinical Summary (Powered by Groq Llama 3.3)
        try {
            String groqSummary = groqAiService.analyzeReport(fileData, contentType, patientName, patientAge);
            if (groqSummary != null && groqSummary.contains("ERROR_PROFILE_MISMATCH")) {
                report.setAiSummary("Security Block: Profile mismatch detected.");
            } else {
                report.setAiSummary(groqSummary);
            }
        } catch (Exception e) {
            System.err.println("Groq analysis failed: " + e.getMessage());
        }

        // 3. Advanced Vision Analysis using MONAI (for specialized radiology metrics)
        if (contentType != null && contentType.startsWith("image/")) {
            try {
                Map<String, Object> monaiResults = monaiService.analyzeXray(fileData, fileName);
                if (monaiResults != null) {
                    report.setMonaiDiagnosis((String) monaiResults.get("diagnosis"));
                    if (monaiResults.containsKey("confidence")) {
                        report.setMonaiConfidence(Double.valueOf(monaiResults.get("confidence").toString()));
                    }
                }
            } catch (Exception e) {
                System.err.println("MONAI analysis failed: " + e.getMessage());
            }
        }
    }

    public Report reanalyzeReport(Long reportId, String username) {
        User user = userRepository.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Report report = reportRepository.findById(reportId)
            .orElseThrow(() -> new RuntimeException("Report not found"));

        // Only doctors or the patient themselves can trigger re-analysis
        if (!"ROLE_DOCTOR".equals(user.getRole()) && !report.getPatient().getUser().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized: You cannot re-analyze this report.");
        }

        performClinicalAnalysis(report, report.getPatient());
        return reportRepository.save(report);
    }

    public Report updateDoctorNotes(Long reportId, String notes, String username) {
        User user = userRepository.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!"ROLE_DOCTOR".equals(user.getRole())) {
            throw new RuntimeException("Unauthorized: Only doctors can add clinical notes.");
        }

        Report report = reportRepository.findById(reportId)
            .orElseThrow(() -> new RuntimeException("Report not found"));
            
        report.setDoctorNotes(notes);
        return reportRepository.save(report);
    }

    public List<Report> getMyReports(String username) {
        Patient patient = patientService.getPatientProfile(username);
        return reportRepository.findByPatientId(patient.getId());
    }

    public Report getReportForDownload(String username, Long id) {
        User user = userRepository.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Report report = reportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Report not found"));

        if ("ROLE_PATIENT".equals(user.getRole())) {
            Patient patient = patientService.getPatientProfile(username);
            if (!report.getPatient().getId().equals(patient.getId())) {
                throw new RuntimeException("Unauthorized access: This report does not belong to you.");
            }
        } else if ("ROLE_DOCTOR".equals(user.getRole())) {
            Doctor doctor = doctorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Doctor profile not found"));
            
            boolean isLinked = report.getPatient().getDoctors().stream()
                .anyMatch(d -> d.getId().equals(doctor.getId()));
            
            if (!isLinked) {
                throw new RuntimeException("Unauthorized access: You are not linked to this patient.");
            }
        } else {
            throw new RuntimeException("Unauthorized access");
        }
        
        return report;
    }

    public void deleteReport(Long id, String username) {
        Report report = reportRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Report not found"));

        if (!report.getPatient().getUser().getUsername().equals(username)) {
            throw new RuntimeException("Unauthorized: You do not own this report.");
        }

        reportRepository.delete(report);
    }
}
