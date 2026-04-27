package com.health.medisync.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "doctors")
public class Doctor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    // Basic Details
    private String name;
    private String gender;
    private String dateOfBirth;
    private Integer age;

    // Contact
    private String email;
    private String phone;
    private String alternatePhone;

    // Professional Qualifications
    private String specialization;
    private String medicalDegree;
    private String additionalCertifications;
    private String college;

    // License & Verification
    private String medicalLicenseNumber;

    // Work Details
    private String hospital; // Keep for legacy/external compatibility

    @ManyToOne
    @JoinColumn(name = "hospital_id")
    private Hospital hospitalEntity;

    private Integer yearsOfExperience;
    private String consultationFee;
    private Double onlineConsultationFee;
    private Double offlineConsultationFee;
    private String clinicAddress;

    // Availability
    private String workingDays;
    private String consultationTimings;
    private Boolean onlineConsultation;
    private boolean approved = false;
    private Boolean appointmentsEnabled = true;

    // Payment Integration
    private String razorpayAccountId; // For Razorpay Route / Connected Accounts

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAlternatePhone() { return alternatePhone; }
    public void setAlternatePhone(String alternatePhone) { this.alternatePhone = alternatePhone; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getMedicalDegree() { return medicalDegree; }
    public void setMedicalDegree(String medicalDegree) { this.medicalDegree = medicalDegree; }

    public String getAdditionalCertifications() { return additionalCertifications; }
    public void setAdditionalCertifications(String additionalCertifications) { this.additionalCertifications = additionalCertifications; }

    public String getCollege() { return college; }
    public void setCollege(String college) { this.college = college; }

    public String getMedicalLicenseNumber() { return medicalLicenseNumber; }
    public void setMedicalLicenseNumber(String medicalLicenseNumber) { this.medicalLicenseNumber = medicalLicenseNumber; }

    public String getHospital() { return hospital; }
    public void setHospital(String hospital) { this.hospital = hospital; }

    public Integer getYearsOfExperience() { return yearsOfExperience; }
    public void setYearsOfExperience(Integer yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }

    public String getConsultationFee() { return consultationFee; }
    public void setConsultationFee(String consultationFee) { this.consultationFee = consultationFee; }

    public String getWorkingDays() { return workingDays; }
    public void setWorkingDays(String workingDays) { this.workingDays = workingDays; }

    public String getConsultationTimings() { return consultationTimings; }
    public void setConsultationTimings(String consultationTimings) { this.consultationTimings = consultationTimings; }

    public Boolean getOnlineConsultation() { return onlineConsultation; }
    public void setOnlineConsultation(Boolean onlineConsultation) { this.onlineConsultation = onlineConsultation; }

    public boolean isApproved() { return approved; }
    public void setApproved(boolean approved) { this.approved = approved; }


    public Double getOnlineConsultationFee() { return onlineConsultationFee; }
    public void setOnlineConsultationFee(Double onlineConsultationFee) { this.onlineConsultationFee = onlineConsultationFee; }

    public Double getOfflineConsultationFee() { return offlineConsultationFee; }
    public void setOfflineConsultationFee(Double offlineConsultationFee) { this.offlineConsultationFee = offlineConsultationFee; }

    public String getClinicAddress() { return clinicAddress; }
    public void setClinicAddress(String clinicAddress) { this.clinicAddress = clinicAddress; }

    public String getRazorpayAccountId() { return razorpayAccountId; }
    public void setRazorpayAccountId(String razorpayAccountId) { this.razorpayAccountId = razorpayAccountId; }

    public Boolean getAppointmentsEnabled() { return appointmentsEnabled != null ? appointmentsEnabled : true; }
    public void setAppointmentsEnabled(Boolean appointmentsEnabled) { this.appointmentsEnabled = appointmentsEnabled; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public Hospital getHospitalEntity() { return hospitalEntity; }
    public void setHospitalEntity(Hospital hospitalEntity) { this.hospitalEntity = hospitalEntity; }
}
