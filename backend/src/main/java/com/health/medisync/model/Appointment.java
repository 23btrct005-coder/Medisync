package com.health.medisync.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "appointments")
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    @JsonIgnoreProperties({"appointments", "password", "specialization", "bio"})
    private Doctor doctor;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"appointments", "prescriptions", "records", "password"})
    private Patient patient;

    private LocalDate appointmentDate;
    private String timeSlot; // e.g., "10:00 AM"

    @Enumerated(EnumType.STRING)
    private ConsultationType consultationType;

    @Enumerated(EnumType.STRING)
    private AppointmentStatus status = AppointmentStatus.PENDING;

    private Double amount;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    
    private String meetLink;
    private boolean meetNotified = false;
    
    private String patientUpiId;
    private String transactionId;
    
    @Column(columnDefinition = "TEXT")
    private String aiClinicalBrief; // Summary from AI Concierge

    @Transient
    private boolean rated;

    private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();

    public enum ConsultationType { ONLINE, OFFLINE }
    public enum AppointmentStatus { PENDING, BOOKED, FAILED, EXPIRED, COMPLETED, CANCELLED, AWAITING_VERIFICATION }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public LocalDate getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }

    public String getTimeSlot() { return timeSlot; }
    public void setTimeSlot(String timeSlot) { this.timeSlot = timeSlot; }

    public ConsultationType getConsultationType() { return consultationType; }
    public void setConsultationType(ConsultationType consultationType) { this.consultationType = consultationType; }

    public AppointmentStatus getStatus() { return status; }
    public void setStatus(AppointmentStatus status) { this.status = status; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }

    public java.time.LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(java.time.LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getMeetLink() { return meetLink; }
    public void setMeetLink(String meetLink) { this.meetLink = meetLink; }

    public boolean isMeetNotified() { return meetNotified; }
    public void setMeetNotified(boolean meetNotified) { this.meetNotified = meetNotified; }

    public String getPatientUpiId() { return patientUpiId; }
    public void setPatientUpiId(String patientUpiId) { this.patientUpiId = patientUpiId; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public boolean isRated() { return rated; }
    public void setRated(boolean rated) { this.rated = rated; }

    public String getAiClinicalBrief() { return aiClinicalBrief; }
    public void setAiClinicalBrief(String aiClinicalBrief) { this.aiClinicalBrief = aiClinicalBrief; }
}
