package com.health.medisync.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/admin/diagnose")
public class PinpointDiagnosticController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static String lastError = "No errors captured yet.";

    public static void setLastError(String error) {
        lastError = error;
    }

    @GetMapping("/blackbox")
    public String getLastError() {
        return lastError;
    }

    @GetMapping("/data")
    public List<Map<String, Object>> dumpData() {
        return jdbcTemplate.queryForList("SELECT id, name, profile_picture_url FROM doctors LIMIT 5");
    }

    @GetMapping("/whoami")
    public Map<String, Object> whoami() {
        Map<String, Object> results = new LinkedHashMap<>();
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (auth != null) {
            results.put("authenticated", auth.isAuthenticated());
            results.put("principal", auth.getName());
            results.put("authorities", auth.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .toList());
        } else {
            results.put("authenticated", false);
            results.put("principal", "anonymousUser");
        }
        
        results.put("user_context_id", com.health.medisync.security.UserContext.getCurrentUserId());
        results.put("user_context_role", com.health.medisync.security.UserContext.getCurrentUserRole());
        
        return results;
    }

    @GetMapping("/pinpoint")
    public Map<String, Object> pinpoint() {
        Map<String, Object> results = new LinkedHashMap<>();
        
        String[] columns = {
            "id", "user_id", "name", "gender", "date_of_birth", "age", "email", "phone", 
            "alternate_phone", "specialization", "medical_degree", "additional_certifications", 
            "college", "medical_license_number", "hospital", "years_of_experience", 
            "consultation_fee", "online_consultation_fee", "offline_consultation_fee", 
            "clinic_address", "working_days", "consultation_timings", "online_consultation", 
            "approved", "appointments_enabled", "razorpay_account_id", "profile_picture_url"
        };

        for (String col : columns) {
            try {
                jdbcTemplate.queryForList("SELECT " + col + " FROM doctors LIMIT 1");
                results.put(col, "OK");
            } catch (Exception e) {
                results.put(col, "FAILED: " + e.getMessage());
            }
        }

        // Environment Check
        results.put("_env_supabase_url", System.getenv("SUPABASE_URL") != null ? "PRESENT" : "MISSING");
        String key = System.getenv("SUPABASE_SERVICE_ROLE_KEY");
        results.put("_env_supabase_key", key != null ? "PRESENT (len=" + key.length() + ")" : "MISSING");

        return results;
    }
}
