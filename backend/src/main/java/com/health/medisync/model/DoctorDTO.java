package com.health.medisync.model;

public class DoctorDTO {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String specialization;
    private String medicalDegree;
    private String medicalLicenseNumber;
    private String hospital;
    private Integer yearsOfExperience;
    private String profilePictureUrl;
    private boolean approved;

    // Constructors
    public DoctorDTO() {}

    public DoctorDTO(Doctor d) {
        this.id = d.getId();
        this.name = d.getName();
        this.email = d.getEmail();
        this.phone = d.getPhone();
        this.specialization = d.getSpecialization();
        this.medicalDegree = d.getMedicalDegree();
        this.medicalLicenseNumber = d.getMedicalLicenseNumber();
        this.hospital = d.getHospital();
        this.yearsOfExperience = d.getYearsOfExperience();
        this.profilePictureUrl = d.getProfilePictureUrl();
        this.approved = d.isApproved();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getMedicalDegree() { return medicalDegree; }
    public void setMedicalDegree(String medicalDegree) { this.medicalDegree = medicalDegree; }

    public String getMedicalLicenseNumber() { return medicalLicenseNumber; }
    public void setMedicalLicenseNumber(String medicalLicenseNumber) { this.medicalLicenseNumber = medicalLicenseNumber; }

    public String getHospital() { return hospital; }
    public void setHospital(String hospital) { this.hospital = hospital; }

    public Integer getYearsOfExperience() { return yearsOfExperience; }
    public void setYearsOfExperience(Integer yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public boolean isApproved() { return approved; }
    public void setApproved(boolean approved) { this.approved = approved; }
}
