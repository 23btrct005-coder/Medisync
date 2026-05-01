package com.health.medisync.repository;

import com.health.medisync.model.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {
    List<MedicalRecord> findByPatientId(Long patientId);
    List<MedicalRecord> findByPatientIdOrderByDateDesc(Long patientId);
    List<MedicalRecord> findByPatientIdAndDiagnosisContainingIgnoreCase(Long patientId, String query);
}
