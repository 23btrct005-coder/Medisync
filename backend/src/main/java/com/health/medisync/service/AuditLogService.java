package com.health.medisync.service;

import com.health.medisync.model.AuditLog;
import com.health.medisync.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class AuditLogService {
    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void log(Long performerId, String performerName, String action, Long targetPatientId, String details) {
        log(performerId, performerName, action, targetPatientId, null, details);
    }

    @Transactional
    public void log(Long performerId, String performerName, String action, Long targetPatientId, Long hospitalId, String details) {
        AuditLog log = new AuditLog();
        log.setPerformerId(performerId);
        log.setPerformerName(performerName);
        log.setAction(action);
        log.setTargetPatientId(targetPatientId);
        log.setHospitalId(hospitalId);
        log.setDetails(details);
        auditLogRepository.save(log);
    }

    public List<AuditLog> getPatientAuditLogs(Long patientId) {
        return auditLogRepository.findByTargetPatientIdOrderByCreatedAtDesc(patientId);
    }

    public List<AuditLog> getHospitalAuditLogs(Long hospitalId) {
        return auditLogRepository.findByHospitalIdOrderByCreatedAtDesc(hospitalId);
    }
}
