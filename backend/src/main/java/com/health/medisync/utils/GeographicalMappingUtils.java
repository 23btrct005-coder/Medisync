package com.health.medisync.utils;

import java.util.HashMap;
import java.util.Map;

public class GeographicalMappingUtils {

    private static final Map<String, String> STATE_CODES = new HashMap<>();
    private static final Map<String, String> DISTRICT_CODES = new HashMap<>();

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

        // --- District Mappings (Expansion) ---
        // Tamil Nadu
        DISTRICT_CODES.put("CHENNAI", "01");
        DISTRICT_CODES.put("DHARMAPURI", "29");
        DISTRICT_CODES.put("ERODE", "09");
        DISTRICT_CODES.put("COIMBATORE", "37");
        DISTRICT_CODES.put("MADURAI", "58");
        DISTRICT_CODES.put("SALEM", "22");
        DISTRICT_CODES.put("TRICHY", "15");
        DISTRICT_CODES.put("TIRUCHIRAPPALLI", "15");
        DISTRICT_CODES.put("VELLORE", "04");
        // Add more as needed
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

    public static String getDistrictCode(String districtName) {
        if (districtName == null || districtName.trim().isEmpty()) return "00";
        
        String normalized = districtName.trim().toUpperCase().replaceAll("[\\s.]", "");
        
        if (DISTRICT_CODES.containsKey(normalized)) {
            return DISTRICT_CODES.get(normalized);
        }

        // Fallback: Use a stable numeric code based on name hash
        int hash = Math.abs(normalized.hashCode() % 99);
        return String.format("%02d", hash);
    }
}
