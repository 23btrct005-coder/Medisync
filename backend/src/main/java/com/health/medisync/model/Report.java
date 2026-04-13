package com.health.medisync.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "reports")
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    private String fileName;
    private String fileType;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "file_data")
    private byte[] fileData;
    
    private LocalDate uploadDate;

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    private String monaiDiagnosis;
    private Double monaiConfidence;

    @Column(columnDefinition = "TEXT")
    private String geminiSummary;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public byte[] getFileData() { return fileData; }
    public void setFileData(byte[] fileData) { this.fileData = fileData; }

    public LocalDate getUploadDate() { return uploadDate; }
    public void setUploadDate(LocalDate uploadDate) { this.uploadDate = uploadDate; }

    public String getAiSummary() { return aiSummary; }
    public void setAiSummary(String aiSummary) { this.aiSummary = aiSummary; }

    public String getMonaiDiagnosis() { return monaiDiagnosis; }
    public void setMonaiDiagnosis(String monaiDiagnosis) { this.monaiDiagnosis = monaiDiagnosis; }

    public Double getMonaiConfidence() { return monaiConfidence; }
    public void setMonaiConfidence(Double monaiConfidence) { this.monaiConfidence = monaiConfidence; }

    public String getGeminiSummary() { return geminiSummary; }
    public void setGeminiSummary(String geminiSummary) { this.geminiSummary = geminiSummary; }
}
