package com.health.medisync.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "telemetry")
public class Telemetry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;

    private Double heartRate; // bpm
    private Double bloodPressureSystolic;
    private Double bloodPressureDiastolic;
    private Double temperature; // C
    private Double spo2; // %
    private Double respiratoryRate; // breaths/min

    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }
    public Double getHeartRate() { return heartRate; }
    public void setHeartRate(Double heartRate) { this.heartRate = heartRate; }
    public Double getBloodPressureSystolic() { return bloodPressureSystolic; }
    public void setBloodPressureSystolic(Double v) { this.bloodPressureSystolic = v; }
    public Double getBloodPressureDiastolic() { return bloodPressureDiastolic; }
    public void setBloodPressureDiastolic(Double v) { this.bloodPressureDiastolic = v; }
    public Double getTemperature() { return temperature; }
    public void setTemperature(Double v) { this.temperature = v; }
    public Double getSpo2() { return spo2; }
    public void setSpo2(Double v) { this.spo2 = v; }
    public Double getRespiratoryRate() { return respiratoryRate; }
    public void setRespiratoryRate(Double v) { this.respiratoryRate = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
