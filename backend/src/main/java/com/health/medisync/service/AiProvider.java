package com.health.medisync.service;

public interface AiProvider {
    /**
     * Performs a clinical analysis on a medical report (PDF or Image).
     * 
     * @param fileData The raw binary data of the file.
     * @param mimeType The MIME type of the file.
     * @param patientName The name of the patient for profile matching.
     * @param patientAge The age of the patient for context.
     * @return A structured analysis or error message.
     */
    String analyzeReport(byte[] fileData, String mimeType, String patientName, int patientAge);
    
    /**
     * Gets the name of the AI provider for UI display.
     */
    String getProviderName();

    /**
     * Performs a general text completion/chat request.
     */
    String getCompletion(String prompt);
}
