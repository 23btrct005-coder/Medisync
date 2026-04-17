package com.health.medisync.model;

import jakarta.persistence.*;

@Entity
@Table(name = "access_requests")
public class AccessRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false)
    private String status; // PENDING, ACCEPTED, REJECTED

    @Column(columnDefinition = "TEXT")
    private String patientMessage;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPatientMessage() { return patientMessage; }
    public void setPatientMessage(String patientMessage) { this.patientMessage = patientMessage; }
}
