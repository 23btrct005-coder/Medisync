package com.health.medisync.util;

import java.security.SecureRandom;
import java.util.Random;

/**
 * Utility to generate human-friendly, unique Short Codes for patients.
 * Format: MS-XXXX where X is an alphanumeric character.
 * Excludes ambiguous characters (0, O, 1, I, L) for clinical clarity.
 */
public class PatientIdGenerator {
    
    private static final String CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // No 0, O, 1, I, L
    private static final int CODE_LENGTH = 4;
    private static final Random random = new SecureRandom();

    public static String generate() {
        StringBuilder sb = new StringBuilder("MS-");
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CHARS.charAt(random.nextInt(CHARS.length())));
        }
        return sb.toString();
    }
}
