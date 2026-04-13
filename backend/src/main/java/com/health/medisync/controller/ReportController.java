package com.health.medisync.controller;

import com.health.medisync.model.Report;
import com.health.medisync.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    public ResponseEntity<List<Report>> getMyReports(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(reportService.getMyReports(username));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadReport(@RequestParam("file") MultipartFile file, Authentication authentication) {
        try {
            String username = authentication.getName();
            return ResponseEntity.ok(reportService.uploadReport(username, file));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage() != null ? e.getMessage() : "Failed to upload file"));
        }
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadReport(@PathVariable Long id, Authentication authentication) {
        String username = authentication.getName();
        Report report = reportService.getReportForDownload(username, id);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + report.getFileName() + "\"")
                .header(HttpHeaders.CONTENT_TYPE, report.getFileType())
                .body(report.getFileData());
    }

    @PostMapping("/{id}/reanalyze")
    public ResponseEntity<?> reanalyzeReport(@PathVariable Long id, Authentication authentication) {
        try {
            String username = authentication.getName();
            return ResponseEntity.ok(reportService.reanalyzeReport(id, username));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<?> updateDoctorNotes(@PathVariable Long id, @RequestBody java.util.Map<String, String> payload, Authentication authentication) {
        try {
            String username = authentication.getName();
            String notes = payload.get("notes");
            return ResponseEntity.ok(reportService.updateDoctorNotes(id, notes, username));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }
}
