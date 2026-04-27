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
        AuditLog log = new AuditLog();
        log.setPerformerId(performerId);
        log.setPerformerName(performerName);
        log.setAction(action);
        log.setTargetPatientId(targetPatientId);
        log.setDetails(details);
        auditLogRepository.save(log);
    }

    public List<AuditLog> getPatientAuditLogs(Long patientId) {
        return auditLogRepository.findByTargetPatientIdOrderByCreatedAtDesc(patientId);
    }
}
