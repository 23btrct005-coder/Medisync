package com.health.medisync.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class GeographicalMappingUtils {

    private static final Map<String, String> STATE_CODES = new HashMap<>();
    private static Map<String, Map<String, String>> RTO_DATABASE = new HashMap<>();

    static {
        // --- Full Indian State Mappings ---
        STATE_CODES.put("TAMILNADU", "TN");
        STATE_CODES.put("KARNATAKA", "KA");
        STATE_CODES.put("KERALA", "KL");
        STATE_CODES.put("ANDHRAPRADESH", "AP");
        STATE_CODES.put("TELANGANA", "TS");
        STATE_CODES.put("MAHARASHTRA", "MH");
        STATE_CODES.put("GUJARAT", "GJ");
        STATE_CODES.put("RAJASTHAN", "RJ");
        STATE_CODES.put("MADHYAPRADESH", "MP");
        STATE_CODES.put("UTTARPRADESH", "UP");
        STATE_CODES.put("BIHAR", "BR");
        STATE_CODES.put("WESTBENGAL", "WB");
        STATE_CODES.put("ODISHA", "OR");
        STATE_CODES.put("PUNJAB", "PB");
        STATE_CODES.put("HARYANA", "HR");
        STATE_CODES.put("HIMACHALPRADESH", "HP");
        STATE_CODES.put("UTTARAKHAND", "UK");
        STATE_CODES.put("DELHI", "DL");
        STATE_CODES.put("ASSAM", "AS");
        STATE_CODES.put("GOA", "GA");
        STATE_CODES.put("CHHATTISGARH", "CG");
        STATE_CODES.put("JHARKHAND", "JH");
        STATE_CODES.put("MANIPUR", "MN");
        STATE_CODES.put("MEGHALAYA", "ML");
        STATE_CODES.put("MIZORAM", "MZ");
        STATE_CODES.put("NAGALAND", "NL");
        STATE_CODES.put("SIKKIM", "SK");
        STATE_CODES.put("TRIPURA", "TR");
        STATE_CODES.put("PUDUCHERRY", "PY");

        // Load RTO Database from JSON
        try (InputStream is = GeographicalMappingUtils.class.getResourceAsStream("/rto_codes.json")) {
            if (is != null) {
                ObjectMapper mapper = new ObjectMapper();
                RTO_DATABASE = mapper.readValue(is, Map.class);
                System.out.println("[RTO] Successfully loaded RTO database with " + RTO_DATABASE.size() + " states.");
            } else {
                System.err.println("[RTO] Error: rto_codes.json not found in classpath!");
            }
        } catch (Exception e) {
            System.err.println("[RTO] Error loading RTO database: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public static String getStateCode(String stateName) {
        if (stateName == null || stateName.trim().isEmpty()) return "XX";
        
        // Normalize: Remove spaces, dots, and convert to uppercase
        String normalized = stateName.trim().toUpperCase().replaceAll("[\\s.]", "");
        
        // Direct Map check
        if (STATE_CODES.containsKey(normalized)) {
            return STATE_CODES.get(normalized);
        }
        
        // If it's already a 2-letter code, return it
        if (normalized.length() == 2 && normalized.matches("[A-Z]{2}")) {
            return normalized;
        }

        // Fallback: Use first two letters of normalized string
        if (normalized.length() >= 2) return normalized.substring(0, 2);
        return "ZZ";
    }

    public static String getDistrictCode(String stateName, String districtName) {
        if (districtName == null || districtName.trim().isEmpty()) return "00";
        
        String stateCode = getStateCode(stateName);
        String normalizedDistrict = districtName.trim().toUpperCase().replaceAll("[^A-Z0-9]", "");
        
        // Look up in RTO Database
        if (RTO_DATABASE.containsKey(stateCode)) {
            Map<String, String> stateDistricts = RTO_DATABASE.get(stateCode);
            
            // Exact match on normalized name
            if (stateDistricts.containsKey(normalizedDistrict)) {
                return stateDistricts.get(normalizedDistrict);
            }
            
            // Fuzzy match: check if any key is contained within the normalized input or vice versa
            for (Map.Entry<String, String> entry : stateDistricts.entrySet()) {
                String key = entry.getKey();
                if (normalizedDistrict.contains(key) || key.contains(normalizedDistrict)) {
                    return entry.getValue();
                }
            }
        }

        // Fallback: Use a stable numeric code based on name hash
        int hash = Math.abs(normalizedDistrict.hashCode() % 99);
        return String.format("%02d", hash);
    }
}
