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

import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;

@Service
public class ReportService {
    private final ReportRepository reportRepository;
    private final PatientService patientService;
    private final GroqAiService aiService;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;

    public ReportService(ReportRepository reportRepository, PatientService patientService, 
                         GroqAiService aiService, UserRepository userRepository,
                         DoctorRepository doctorRepository) {
        this.reportRepository = reportRepository;
        this.patientService = patientService;
        this.aiService = aiService;
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
        User user = userRepository.findByUsername(username)
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
}
