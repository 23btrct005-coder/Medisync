package com.health.medisync.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/diagnose")
@PreAuthorize("hasRole('ADMIN')")
public class DiagnosticController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/schema")
    public ResponseEntity<?> diagnoseSchema() {
        Map<String, Object> report = new HashMap<>();
        
        try {
            // 1. Check doctors table columns
            List<Map<String, Object>> columns = jdbcTemplate.queryForList(
                "SELECT column_name, data_type, is_nullable " +
                "FROM information_schema.columns " +
                "WHERE table_name = 'doctors' AND table_schema = 'public'"
            );
            report.put("doctors_columns", columns);

            // 2. Check patients table columns
            List<Map<String, Object>> pColumns = jdbcTemplate.queryForList(
                "SELECT column_name, data_type, is_nullable " +
                "FROM information_schema.columns " +
                "WHERE table_name = 'patients' AND table_schema = 'public'"
            );
            report.put("patients_columns", pColumns);

            // 3. Test a simple select on doctors to see if it fails due to abort
            try {
                List<Map<String, Object>> testSelect = jdbcTemplate.queryForList("SELECT id, name FROM doctors LIMIT 1");
                report.put("test_select_status", "SUCCESS");
            } catch (Exception e) {
                report.put("test_select_status", "FAILED: " + e.getMessage());
            }

            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
