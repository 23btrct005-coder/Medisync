package com.health.medisync.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long performerId; // User who performed the action

    @Column(nullable = false)
    private String performerName;

    @Column(nullable = false)
    private String action; // ACCESS_VIEW, RECORD_CREATE, REPORT_ANALYZE, INFRA_UPDATE, etc.

    private Long targetPatientId; // Nullable for institutional actions

    private Long hospitalId; // To scope logs to a specific institution

    @Column(columnDefinition = "TEXT")
    private String details;

    private String ipAddress;

    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPerformerId() { return performerId; }
    public void setPerformerId(Long performerId) { this.performerId = performerId; }
    public String getPerformerName() { return performerName; }
    public void setPerformerName(String performerName) { this.performerName = performerName; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public Long getTargetPatientId() { return targetPatientId; }
    public void setTargetPatientId(Long targetPatientId) { this.targetPatientId = targetPatientId; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public Long getHospitalId() { return hospitalId; }
    public void setHospitalId(Long hospitalId) { this.hospitalId = hospitalId; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
