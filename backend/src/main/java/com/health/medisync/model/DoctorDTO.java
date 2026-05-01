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

    // Institutional Sync Fields
    private String consultationFee;
    private String workingDays;
    private String college;
    private String consultationTimings;
    private Double onlineConsultationFee;
    private Double offlineConsultationFee;
    private Boolean onlineConsultation;
    private String clinicAddress;
    private Double averageRating;
    private Long ratingCount;
    private String upiId;
    private String razorpayAccountId;

    // Admin Only Fields
    private String staffId;
    private String joiningDate;
    private String salary;
    private String contractType;

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
        this.hospital = d.getHospitalEntity() != null ? d.getHospitalEntity().getName() : d.getHospital();
        this.yearsOfExperience = d.getYearsOfExperience();
        this.profilePictureUrl = d.getProfilePictureUrl();
        this.approved = d.isApproved();
        
        // Populate Institutional Sync Fields
        this.consultationFee = d.getConsultationFee();
        this.workingDays = d.getWorkingDays();
        this.consultationTimings = d.getConsultationTimings();
        this.college = d.getCollege();
        this.onlineConsultationFee = d.getOnlineConsultationFee();
        this.offlineConsultationFee = d.getOfflineConsultationFee();
        this.onlineConsultation = d.getOnlineConsultation();
        this.clinicAddress = d.getClinicAddress();
        
        // Admin Fields
        this.staffId = d.getStaffId();
        this.joiningDate = d.getJoiningDate();
        this.salary = d.getSalary();
        this.contractType = d.getContractType();
        this.upiId = d.getUpiId();
        this.razorpayAccountId = d.getRazorpayAccountId();
    }

    // Getters and Setters
    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }

    public String getRazorpayAccountId() { return razorpayAccountId; }
    public void setRazorpayAccountId(String razorpayAccountId) { this.razorpayAccountId = razorpayAccountId; }

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

    public String getConsultationFee() { return consultationFee; }
    public void setConsultationFee(String consultationFee) { this.consultationFee = consultationFee; }

    public String getWorkingDays() { return workingDays; }
    public void setWorkingDays(String workingDays) { this.workingDays = workingDays; }

    public String getCollege() { return college; }
    public void setCollege(String college) { this.college = college; }

    public String getConsultationTimings() { return consultationTimings; }
    public void setConsultationTimings(String consultationTimings) { this.consultationTimings = consultationTimings; }

    public Double getOnlineConsultationFee() { return onlineConsultationFee; }
    public void setOnlineConsultationFee(Double onlineConsultationFee) { this.onlineConsultationFee = onlineConsultationFee; }

    public Double getOfflineConsultationFee() { return offlineConsultationFee; }
    public void setOfflineConsultationFee(Double offlineConsultationFee) { this.offlineConsultationFee = offlineConsultationFee; }

    public Boolean getOnlineConsultation() { return onlineConsultation; }
    public void setOnlineConsultation(Boolean onlineConsultation) { this.onlineConsultation = onlineConsultation; }

    public String getClinicAddress() { return clinicAddress; }
    public void setClinicAddress(String clinicAddress) { this.clinicAddress = clinicAddress; }

    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public Long getRatingCount() { return ratingCount; }
    public void setRatingCount(Long ratingCount) { this.ratingCount = ratingCount; }

    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }

    public String getJoiningDate() { return joiningDate; }
    public void setJoiningDate(String joiningDate) { this.joiningDate = joiningDate; }

    public String getSalary() { return salary; }
    public void setSalary(String salary) { this.salary = salary; }

    public String getContractType() { return contractType; }
    public void setContractType(String contractType) { this.contractType = contractType; }
}
