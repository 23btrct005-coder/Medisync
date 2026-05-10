package com.health.medisync.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Enterprise JSON Repair Service
 * Fixes malformed or truncated JSON chunks during real-time streaming.
 */
@Service
public class JsonRepairService {

    private final ObjectMapper mapper = new ObjectMapper();

    public String repair(String partialJson) {
        if (partialJson == null || partialJson.isEmpty()) return "{}";
        
        String trimmed = partialJson.trim();
        
        // 1. Basic completion check
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            return trimmed;
        }

        // 2. Attempt to close open braces
        StringBuilder repaired = new StringBuilder(trimmed);
        
        // Count braces
        int openBraces = 0;
        int closeBraces = 0;
        boolean inQuote = false;
        
        for (int i = 0; i < trimmed.length(); i++) {
            char c = trimmed.charAt(i);
            if (c == '\"' && (i == 0 || trimmed.charAt(i-1) != '\\')) {
                inQuote = !inQuote;
            }
            if (!inQuote) {
                if (c == '{') openBraces++;
                if (c == '}') closeBraces++;
            }
        }

        // Close unclosed quotes
        if (inQuote) repaired.append("\"");
        
        // Remove trailing commas
        if (repaired.toString().trim().endsWith(",")) {
            repaired.deleteCharAt(repaired.lastIndexOf(","));
        }

        // Close braces
        while (openBraces > closeBraces) {
            repaired.append("}");
            closeBraces++;
        }

        // Validate
        try {
            mapper.readTree(repaired.toString());
            return repaired.toString();
        } catch (Exception e) {
            // Fallback: If still broken, return a minimal valid object with partial text
            return "{\"isPartial\": true, \"clinicalAssessment\": \"...processing...\"}";
        }
    }

    public String extractJsonFromMarkdown(String text) {
        if (text == null) return "{}";
        Pattern pattern = Pattern.compile("```json\\s*([\\s\\S]*?)\\s*```|(\\{[\\s\\S]*\\})");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return repair(matcher.group(1) != null ? matcher.group(1) : matcher.group(2));
        }
        return repair(text);
    }
}
