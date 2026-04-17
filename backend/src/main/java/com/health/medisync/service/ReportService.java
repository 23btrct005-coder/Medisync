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
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class ReportService {
    private final ReportRepository reportRepository;
    private final PatientService patientService;
    private final GroqAiService groqAiService;
    private final OpenAiService openAiService;
    private final MonaiService monaiService;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final NotificationService notificationService;

    public ReportService(ReportRepository reportRepository, PatientService patientService, 
                         GroqAiService groqAiService, OpenAiService openAiService, 
                         MonaiService monaiService, 
                         UserRepository userRepository, DoctorRepository doctorRepository,
                         NotificationService notificationService) {
        this.reportRepository = reportRepository;
        this.patientService = patientService;
        this.groqAiService = groqAiService;
        this.openAiService = openAiService;
        this.monaiService = monaiService;
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.notificationService = notificationService;
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
        String patientName = patient.getName();
        int patientAge = patient.getAge() != null ? patient.getAge() : 0;

        boolean isImage = contentType != null && contentType.startsWith("image/");
        String analysisResult = null;
        String selectedProvider = null;

        // Selection Variation: Choice of AI for Text-based PDFs can vary
        boolean useGroq = !isImage && Math.random() < 0.5;

        try {
            if (isImage || !useGroq) {
                // OpenAI GPT-4o Master Clinical Reasoning
                selectedProvider = "OpenAI GPT-4o";
                analysisResult = openAiService.analyzeReport(fileData, contentType, patientName, patientAge);
                
                // Failover for Text-PDFs from OpenAI to Groq
                if (analysisResult == null && !isImage) {
                    System.out.println("DEBUG: OpenAI failed/busy for Text-PDF. Falling back to Groq...");
                    selectedProvider = "Groq (Failover)";
                    analysisResult = groqAiService.analyzeReport(fileData, contentType, patientName, patientAge);
                }
            } else {
                // Groq High-Speed Clinical Summary
                selectedProvider = "Groq Llama-3";
                analysisResult = groqAiService.analyzeReport(fileData, contentType, patientName, patientAge);

                // Failover for Text-PDFs from Groq to OpenAI
                if (analysisResult == null) {
                    System.out.println("DEBUG: Groq failed/busy. Falling back to OpenAI...");
                    selectedProvider = "OpenAI (Failover)";
                    analysisResult = openAiService.analyzeReport(fileData, contentType, patientName, patientAge);
                }
            }
        } catch (Exception e) {
            System.err.println("Critical AI Dispatch error: " + e.getMessage());
        }

        if (analysisResult != null) {
            String rawResponse = analysisResult.trim();
            String cleanJson = rawResponse;

            try {
                int firstBrace = rawResponse.indexOf('{');
                int lastBrace = rawResponse.lastIndexOf('}');
                if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
                    cleanJson = rawResponse.substring(firstBrace, lastBrace + 1);
                }
            } catch (Exception e) {
                System.err.println("JSON Extraction failed, using trimmed raw response: " + e.getMessage());
            }

            if (cleanJson.contains("ERROR_PROFILE_MISMATCH")) {
                report.setAiSummary("{\"error\": \"SECURITY BLOCK: Profile mismatch detected.\"}");
                report.setClinicalReasoning("Security Block.");
            } else {
                report.setAiSummary(cleanJson);
                report.setDocumentDate(extractDocumentDate(cleanJson, report.getUploadDate()));
                report.setClinicalReasoning("AI Model: " + selectedProvider); // Store the source for clinical auditing
            }
        } else {
            report.setAiSummary("{\"error\": \"Clinical intelligence is momentarily unavailable.\"}");
            report.setDocumentDate(report.getUploadDate());
        }

        // 3. Advanced Vision Analysis using MONAI (remains for specialized radiology if image)
        if (isImage) {
            try {
                Map<String, Object> monaiResults = monaiService.analyzeXray(fileData, report.getFileName());
                if (monaiResults != null && !monaiResults.containsKey("error")) {
                    report.setMonaiDiagnosis((String) monaiResults.get("diagnosis"));
                    if (monaiResults.containsKey("confidence")) {
                        report.setMonaiConfidence(Double.valueOf(monaiResults.get("confidence").toString()));
                    }
                }
            } catch (Exception e) {
                System.err.println("MONAI local failure: " + e.getMessage());
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
        Report updated = reportRepository.save(report);

        // Notify Patient
        notificationService.sendNotification(
            updated.getPatient().getUser().getId(),
            "AI_ANALYSIS",
            "Doctor Updated Clinical Notes",
            "Dr. " + user.getUsername() + " has added new clinical insights to your medical report.",
            "/dashboard/reports",
            "View Report"
        );

        return updated;
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

    private LocalDate extractDocumentDate(String json, LocalDate fallback) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(json);
            JsonNode dateNode = root.path("patient_info").path("date");
            
            if (dateNode.isTextual() && !dateNode.asText().equalsIgnoreCase("null")) {
                String dateStr = dateNode.asText().trim();
                
                // Try common formats
                String[] formats = {
                    "yyyy-MM-dd",
                    "MMMM d, yyyy",
                    "MMMM dd, yyyy",
                    "MMMM d yyyy",
                    "MMMM dd yyyy",
                    "d MMMM yyyy",
                    "dd MMMM yyyy",
                    "dd/MM/yyyy",
                    "MM/dd/yyyy"
                };

                for (String format : formats) {
                    try {
                        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format, Locale.ENGLISH);
                        return LocalDate.parse(dateStr, formatter);
                    } catch (Exception e) {
                        // try next format
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to extract date from AI JSON: " + e.getMessage());
        }
        return fallback;
    }
}
