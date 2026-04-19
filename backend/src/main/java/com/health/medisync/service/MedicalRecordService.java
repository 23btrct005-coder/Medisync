package com.health.medisync.service;

import com.health.medisync.model.MedicalRecord;
import com.health.medisync.model.Patient;
import com.health.medisync.repository.MedicalRecordRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MedicalRecordService {
    private final MedicalRecordRepository recordRepository;
    private final PatientService patientService;

    public MedicalRecordService(MedicalRecordRepository recordRepository, PatientService patientService) {
        this.recordRepository = recordRepository;
        this.patientService = patientService;
    }

    public List<MedicalRecord> getMyRecords(String username, String search) {
        System.out.println("DEBUG: Fetching medical records for user: " + username);
        // PatientService.getPatientProfile already handles findByUserUsernameIgnoreCase and normalization
        Patient patient = patientService.getPatientProfile(username);
        
        if (patient == null) {
            System.err.println("ERROR: No patient profile found for record fetch: " + username);
            return List.of(); // Return empty instead of crashing
        }

        if (search != null && !search.trim().isEmpty()) {
            System.out.println("DEBUG: Searching records with query: " + search);
            return recordRepository.findByPatientIdAndDiagnosisContainingIgnoreCase(patient.getId(), search);
        }
        return recordRepository.findByPatientId(patient.getId());
    }
}
