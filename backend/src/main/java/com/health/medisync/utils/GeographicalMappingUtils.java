package com.health.medisync.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class GeographicalMappingUtils {

    private static Map<String, String> STATE_CODE_TO_NAME = new HashMap<>();
    private static Map<String, String> STATE_NAME_TO_CODE = new HashMap<>();
    private static Map<String, Map<String, String>> MAPPINGS = new HashMap<>();
    private static Map<String, java.util.List<String>> DISPLAY_DATA = new HashMap<>();

    static {
        // Load RTO Database from JSON
        try (InputStream is = GeographicalMappingUtils.class.getResourceAsStream("/rto_codes.json")) {
            if (is != null) {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> rawData = mapper.readValue(is, Map.class);
                
                STATE_CODE_TO_NAME = (Map<String, String>) rawData.get("states");
                MAPPINGS = (Map<String, Map<String, String>>) rawData.get("mappings");
                DISPLAY_DATA = (Map<String, java.util.List<String>>) rawData.get("display");
                
                // Build reverse state map for lookups
                for (Map.Entry<String, String> entry : STATE_CODE_TO_NAME.entrySet()) {
                    STATE_NAME_TO_CODE.put(entry.getValue().toUpperCase().replaceAll("[\\s.]", ""), entry.getKey());
                }
                
                System.out.println("[RTO] Successfully loaded enriched RTO database.");
            } else {
                System.err.println("[RTO] Error: rto_codes.json not found in classpath!");
            }
        } catch (Exception e) {
            System.err.println("[RTO] Error loading RTO database: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public static Map<String, java.util.List<String>> getGeographyData() {
        return DISPLAY_DATA;
    }

    public static String getStateCode(String stateName) {
        if (stateName == null || stateName.trim().isEmpty()) return "XX";
        
        String normalized = stateName.trim().toUpperCase().replaceAll("[\\s.]", "");
        
        if (STATE_NAME_TO_CODE.containsKey(normalized)) {
            return STATE_NAME_TO_CODE.get(normalized);
        }
        
        if (normalized.length() == 2 && normalized.matches("[A-Z]{2}")) {
            return normalized;
        }

        if (normalized.length() >= 2) return normalized.substring(0, 2);
        return "ZZ";
    }

    public static String getDistrictCode(String stateName, String... potentialNames) {
        String stateCode = getStateCode(stateName);
        
        for (String name : potentialNames) {
            if (name == null || name.trim().isEmpty()) continue;
            
            String normalized = name.trim().toUpperCase().replaceAll("[^A-Z0-9]", "");
            
            // Look up in Mappings
            if (MAPPINGS.containsKey(stateCode)) {
                Map<String, String> stateDistricts = MAPPINGS.get(stateCode);
                
                if (stateDistricts.containsKey(normalized)) {
                    return stateDistricts.get(normalized);
                }
                
                for (Map.Entry<String, String> entry : stateDistricts.entrySet()) {
                    String key = entry.getKey();
                    if (normalized.contains(key) || key.contains(normalized)) {
                        return entry.getValue();
                    }
                }
            }
        }

        for (String name : potentialNames) {
            if (name != null && !name.trim().isEmpty()) {
                String normalized = name.trim().toUpperCase().replaceAll("[^A-Z0-9]", "");
                int hash = Math.abs(normalized.hashCode() % 99);
                return String.format("%02d", hash);
            }
        }

        return "00";
    }
}
