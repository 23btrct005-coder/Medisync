package com.health.medisync.utils;

import java.util.HashMap;
import java.util.Map;

public class GeographicalMappingUtils {

    private static final Map<String, String> STATE_CODES = new HashMap<>();
    private static final Map<String, String> DISTRICT_CODES = new HashMap<>();

    static {
        // State Mappings
        STATE_CODES.put("TAMIL NADU", "TN");
        STATE_CODES.put("KARNATAKA", "KA");
        STATE_CODES.put("MAHARASHTRA", "MH");
        STATE_CODES.put("KERALA", "KL");
        STATE_CODES.put("ANDHRA PRADESH", "AP");
        STATE_CODES.put("TELANGANA", "TS");
        STATE_CODES.put("DELHI", "DL");
        STATE_CODES.put("GUJARAT", "GJ");
        STATE_CODES.put("WEST BENGAL", "WB");
        STATE_CODES.put("UTTAR PRADESH", "UP");
        // Add more as needed

        // District Mappings (Example for Tamil Nadu)
        DISTRICT_CODES.put("DHARMAPURI", "29");
        DISTRICT_CODES.put("CHENNAI", "01");
        DISTRICT_CODES.put("COIMBATORE", "37");
        DISTRICT_CODES.put("MADURAI", "58");
        // Add more as needed
    }

    public static String getStateCode(String stateName) {
        if (stateName == null || stateName.trim().isEmpty()) return "XX";
        String code = STATE_CODES.get(stateName.trim().toUpperCase());
        if (code != null) return code;
        
        // Fallback: Use first two letters
        String clean = stateName.trim().replaceAll("[^a-zA-Z]", "");
        if (clean.length() >= 2) return clean.substring(0, 2).toUpperCase();
        return "ZZ";
    }

    public static String getDistrictCode(String districtName) {
        if (districtName == null || districtName.trim().isEmpty()) return "00";
        String code = DISTRICT_CODES.get(districtName.trim().toUpperCase());
        if (code != null) return code;

        // Fallback: Use hash-based numeric code if not in mapping to keep it numeric
        int hash = Math.abs(districtName.trim().toUpperCase().hashCode() % 99);
        return String.format("%02d", hash);
    }
}
