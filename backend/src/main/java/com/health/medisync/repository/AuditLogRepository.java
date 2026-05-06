package com.health.medisync.repository;

import com.health.medisync.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByTargetPatientIdOrderByCreatedAtDesc(Long patientId);
    List<AuditLog> findByPerformerIdOrderByCreatedAtDesc(Long performerId);
    List<AuditLog> findByHospitalIdOrderByCreatedAtDesc(Long hospitalId);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    void deleteByPerformerId(Long performerId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    void deleteByTargetPatientId(Long patientId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    void deleteByHospitalId(Long hospitalId);
}
