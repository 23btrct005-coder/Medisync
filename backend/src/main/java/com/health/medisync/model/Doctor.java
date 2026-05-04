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

    @OneToOne(cascade = CascadeType.REMOVE)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    // Basic Details
    private String name;
    private String gender;
    private String dateOfBirth;
    private Integer age;

    // Contact
    @Column(unique = true)
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
    private String medicalCouncil; // e.g. Karnataka Medical Council
    private String licenseExpiryDate;
    private String licenseDocumentUrl;
    private Integer registrationYear;
    
    @Column(columnDefinition = "TEXT")
    private String services;

    // Clinical Expertise Depth
    private String subSpecialties; // Comma separated
    private String proceduresHandled;
    private String treatmentFocus;
    private String languagesSpoken;
    private String publications;

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
    private String clinicStreet;
    private String clinicCity;
    private String clinicState;
    private String clinicPinCode;

    // Advanced Availability
    private Integer slotDuration = 15; // default 15 mins
    private Integer slotBuffer = 0; // default 0 mins (gap between slots)
    private Integer maxPatientsPerDay;
    private String breakTimings;
    private String workingDays;
    private String consultationTimings;
    private Boolean onlineConsultation;
    private boolean approved = false;
    private Boolean appointmentsEnabled = true;
    
    @Column(columnDefinition = "TEXT")
    private String absenceDates; // Comma-separated YYYY-MM-DD

    // Institutional Flag
    private boolean institutional = false;
    private String employeeId;
    private String opdRoomNumber;

    // Ratings & Reputation
    private Double rating = 0.0;
    private Integer reviewCount = 0;

    // Payment Integration
    private String razorpayAccountId; // For Razorpay Route / Connected Accounts
    private String upiId; // For direct peer-to-peer clinical payments
    private String preferredPaymentMode = "RAZORPAY"; // RAZORPAY, UPI, or BOTH

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    @Column(columnDefinition = "TEXT")
    private String serviceFees; // JSON mapping serviceName -> fee

    @Column(columnDefinition = "TEXT")
    private String serviceDurations; // JSON mapping serviceName -> duration (mins)

    @Column(columnDefinition = "TEXT")
    private String serviceCapacity; // JSON mapping serviceName -> system/machine count

    // Administrative Fields (Admin Only)
    private String staffId;
    private String joiningDate;
    private String salary;
    private String contractType; // e.g. PERMANENT, VISITING, INTERN
    private Double revenueSharePercentage;

    // Permissions
    private boolean canPrescribe = true;
    private boolean canEditPatientData = false;
    private boolean canAccessReports = true;
    private boolean canManageAppointments = true;

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

    public String getMedicalCouncil() { return medicalCouncil; }
    public void setMedicalCouncil(String medicalCouncil) { this.medicalCouncil = medicalCouncil; }

    public String getLicenseExpiryDate() { return licenseExpiryDate; }
    public void setLicenseExpiryDate(String licenseExpiryDate) { this.licenseExpiryDate = licenseExpiryDate; }

    public String getLicenseDocumentUrl() { return licenseDocumentUrl; }
    public void setLicenseDocumentUrl(String licenseDocumentUrl) { this.licenseDocumentUrl = licenseDocumentUrl; }

    public Integer getRegistrationYear() { return registrationYear; }
    public void setRegistrationYear(Integer registrationYear) { this.registrationYear = registrationYear; }

    public String getSubSpecialties() { return subSpecialties; }
    public void setSubSpecialties(String subSpecialties) { this.subSpecialties = subSpecialties; }

    public String getProceduresHandled() { return proceduresHandled; }
    public void setProceduresHandled(String proceduresHandled) { this.proceduresHandled = proceduresHandled; }

    public String getTreatmentFocus() { return treatmentFocus; }
    public void setTreatmentFocus(String treatmentFocus) { this.treatmentFocus = treatmentFocus; }

    public String getLanguagesSpoken() { return languagesSpoken; }
    public void setLanguagesSpoken(String languagesSpoken) { this.languagesSpoken = languagesSpoken; }

    public String getPublications() { return publications; }
    public void setPublications(String publications) { this.publications = publications; }

    public Integer getSlotDuration() { return slotDuration != null ? slotDuration : 15; }
    public void setSlotDuration(Integer slotDuration) { this.slotDuration = slotDuration; }
    
    public Integer getSlotBuffer() { return slotBuffer != null ? slotBuffer : 0; }
    public void setSlotBuffer(Integer slotBuffer) { this.slotBuffer = slotBuffer; }

    public Integer getMaxPatientsPerDay() { return maxPatientsPerDay; }
    public void setMaxPatientsPerDay(Integer maxPatientsPerDay) { this.maxPatientsPerDay = maxPatientsPerDay; }

    public String getBreakTimings() { return breakTimings; }
    public void setBreakTimings(String breakTimings) { this.breakTimings = breakTimings; }

    public boolean isInstitutional() { return institutional; }
    public void setInstitutional(boolean institutional) { this.institutional = institutional; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getOpdRoomNumber() { return opdRoomNumber; }
    public void setOpdRoomNumber(String opdRoomNumber) { this.opdRoomNumber = opdRoomNumber; }

    public Double getRating() { return rating != null ? rating : 0.0; }
    public void setRating(Double rating) { this.rating = rating; }

    public Integer getReviewCount() { return reviewCount != null ? reviewCount : 0; }
    public void setReviewCount(Integer reviewCount) { this.reviewCount = reviewCount; }

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

    public String getClinicAddress() { 
        if (clinicAddress != null && !clinicAddress.isEmpty()) return clinicAddress;
        if (hospitalEntity != null && hospitalEntity.getLocation() != null && !hospitalEntity.getLocation().isEmpty()) return hospitalEntity.getLocation();
        return clinicAddress;
    }
    public void setClinicAddress(String clinicAddress) { this.clinicAddress = clinicAddress; }
    
    public String getClinicStreet() { return clinicStreet; }
    public void setClinicStreet(String clinicStreet) { this.clinicStreet = clinicStreet; }

    public String getClinicCity() { return clinicCity; }
    public void setClinicCity(String clinicCity) { this.clinicCity = clinicCity; }

    public String getClinicState() { return clinicState; }
    public void setClinicState(String clinicState) { this.clinicState = clinicState; }

    public String getClinicPinCode() { return clinicPinCode; }
    public void setClinicPinCode(String clinicPinCode) { this.clinicPinCode = clinicPinCode; }

    public String getRazorpayAccountId() { return razorpayAccountId; }
    public void setRazorpayAccountId(String razorpayAccountId) { this.razorpayAccountId = razorpayAccountId; }

    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }

    public String getPreferredPaymentMode() { return preferredPaymentMode != null ? preferredPaymentMode : "RAZORPAY"; }
    public void setPreferredPaymentMode(String preferredPaymentMode) { this.preferredPaymentMode = preferredPaymentMode; }

    public Boolean getAppointmentsEnabled() { return appointmentsEnabled != null ? appointmentsEnabled : true; }
    public void setAppointmentsEnabled(Boolean appointmentsEnabled) { this.appointmentsEnabled = appointmentsEnabled; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public Hospital getHospitalEntity() { return hospitalEntity; }
    public void setHospitalEntity(Hospital hospitalEntity) { this.hospitalEntity = hospitalEntity; }

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    public String getStaffId() { return staffId; }
    public void setStaffId(String staffId) { this.staffId = staffId; }

    public String getJoiningDate() { return joiningDate; }
    public void setJoiningDate(String joiningDate) { this.joiningDate = joiningDate; }

    public String getSalary() { return salary; }
    public void setSalary(String salary) { this.salary = salary; }

    public String getContractType() { return contractType; }
    public void setContractType(String contractType) { this.contractType = contractType; }

    public Double getRevenueSharePercentage() { return revenueSharePercentage; }
    public void setRevenueSharePercentage(Double revenueSharePercentage) { this.revenueSharePercentage = revenueSharePercentage; }

    public boolean isCanPrescribe() { return canPrescribe; }
    public void setCanPrescribe(boolean canPrescribe) { this.canPrescribe = canPrescribe; }

    public boolean isCanEditPatientData() { return canEditPatientData; }
    public void setCanEditPatientData(boolean canEditPatientData) { this.canEditPatientData = canEditPatientData; }

    public boolean isCanAccessReports() { return canAccessReports; }
    public void setCanAccessReports(boolean canAccessReports) { this.canAccessReports = canAccessReports; }

    public boolean isCanManageAppointments() { return canManageAppointments; }
    public void setCanManageAppointments(boolean canManageAppointments) { this.canManageAppointments = canManageAppointments; }

    public String getServices() { return services; }
    public void setServices(String services) { this.services = services; }

    public String getServiceFees() { return serviceFees; }
    public void setServiceFees(String serviceFees) { this.serviceFees = serviceFees; }

    public String getServiceDurations() { return serviceDurations; }
    public void setServiceDurations(String serviceDurations) { this.serviceDurations = serviceDurations; }

    public String getServiceCapacity() { return serviceCapacity; }
    public void setServiceCapacity(String serviceCapacity) { this.serviceCapacity = serviceCapacity; }

    public String getAbsenceDates() { return absenceDates; }
    public void setAbsenceDates(String absenceDates) { this.absenceDates = absenceDates; }
}
