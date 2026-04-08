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
        Patient patient = patientService.getPatientProfile(username);
        if (search != null && !search.trim().isEmpty()) {
            return recordRepository.findByPatientIdAndDiagnosisContainingIgnoreCase(patient.getId(), search);
        }
        return recordRepository.findByPatientId(patient.getId());
    }
}
