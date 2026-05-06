package com.health.medisync.repository;

import com.health.medisync.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByTargetPatientIdOrderByCreatedAtDesc(Long patientId);
    List<AuditLog> findByPerformerIdOrderByCreatedAtDesc(Long performerId);
    List<AuditLog> findByHospitalIdOrderByCreatedAtDesc(Long hospitalId);
    void deleteByPerformerId(Long performerId);
    void deleteByTargetPatientId(Long patientId);
    void deleteByHospitalId(Long hospitalId);
}
