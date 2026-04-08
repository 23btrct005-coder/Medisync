package com.health.medisync.model;

import java.time.LocalDate;

public class MedicalRecordRequest {
    private String diagnosis;
    private String prescription;
    private LocalDate date;

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public String getPrescription() { return prescription; }
    public void setPrescription(String prescription) { this.prescription = prescription; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
}
