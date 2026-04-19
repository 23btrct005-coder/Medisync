package com.health.medisync.model;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "patients")
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    // Basic Info
    @Transient private String name;
    @Transient private String dateOfBirth;
    @Transient private Integer age;
    @Transient private String gender;
    @Transient private String bloodGroup;
    @Transient private String nationalId;
    @Transient private String maritalStatus;
    @Transient private String occupation;

    // Contact
    @Transient private String phone;
    @Transient private String alternatePhone;

    // Address
    @Transient private String street;
    @Transient private String city;
    @Transient private String state;
    @Transient private String pinCode;

    // Emergency Contact
    @Transient private String emergencyContactName;
    @Transient private String emergencyContactRelationship;
    @Transient private String emergencyContactPhone;
    @Transient private String altEmergencyPhone;

    // ── Insurance Details ──
    @Transient private String insuranceProvider;
    @Transient private String policyNumber;
    @Transient private String insuranceValidity;

    // ── Lifestyle Details ──
    @Transient private String smokingStatus;       // e.g. Non-smoker, Occasional, Regular
    @Transient private String alcoholStatus;       // e.g. Non-drinker, Rare, Social, Regular
    @Transient private String exerciseFrequency;   // e.g. Daily, 3-4 times/week, Rare, None
    
    @Transient private String height;              // e.g. 175cm
    @Transient private String weight;              // e.g. 70kg
    @Transient private Boolean hasDisability;
    @Transient 
    @Column(columnDefinition = "TEXT")
    private String disabilityDetails;

    // ── Advanced Health Details ──
    @Transient
    @Column(columnDefinition = "TEXT")
    private String familyMedicalHistory;
    @Transient private String organDonorStatus;    // e.g. Yes, No, Undecided

    // General Medical Info
    @Transient
    @Column(columnDefinition = "TEXT")
    private String medicalInfo;

    // ── Critical Medical Fields (for QR Emergency Card) ──
    @Transient
    @Column(columnDefinition = "TEXT")
    private String allergies;           // e.g. Penicillin, Sulfa drugs
    @Transient
    @Column(columnDefinition = "TEXT")
    private String existingDiseases;    // e.g. Diabetes Type 2, Hypertension
    @Transient
    @Column(columnDefinition = "TEXT")
    private String currentMedications;  // e.g. Metformin 500mg, Amlodipine 5mg
    @Transient
    @Column(columnDefinition = "TEXT")
    private String pastSurgeries;       // e.g. Appendectomy 2018, CABG 2021

    // ── Settings & Preferences ──
    @Transient private Boolean mfaEnabled = false;
    @Transient private Boolean emailNotifications = true;
    @Transient private Boolean appNotifications = true;
    @Transient private Boolean smsNotifications = false;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "patient_doctors",
        joinColumns = @JoinColumn(name = "patient_id"),
        inverseJoinColumns = @JoinColumn(name = "doctor_id")
    )
    private Set<Doctor> doctors = new HashSet<>();

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "profile_picture")
    private byte[] profilePicture;

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    // ── Getters & Setters ──
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return user != null ? user.getUsername() : null; }
    public void setEmail(String email) { if(user != null) user.setUsername(email); }

    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAlternatePhone() { return alternatePhone; }
    public void setAlternatePhone(String alternatePhone) { this.alternatePhone = alternatePhone; }

    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }

    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String v) { this.emergencyContactName = v; }

    public String getEmergencyContactRelationship() { return emergencyContactRelationship; }
    public void setEmergencyContactRelationship(String v) { this.emergencyContactRelationship = v; }

    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String v) { this.emergencyContactPhone = v; }

    public String getMedicalInfo() { return medicalInfo; }
    public void setMedicalInfo(String medicalInfo) { this.medicalInfo = medicalInfo; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }

    public String getExistingDiseases() { return existingDiseases; }
    public void setExistingDiseases(String existingDiseases) { this.existingDiseases = existingDiseases; }

    public String getCurrentMedications() { return currentMedications; }
    public void setCurrentMedications(String currentMedications) { this.currentMedications = currentMedications; }

    public String getPastSurgeries() { return pastSurgeries; }
    public void setPastSurgeries(String pastSurgeries) { this.pastSurgeries = pastSurgeries; }

    public Set<Doctor> getDoctors() { return doctors; }
    public void setDoctors(Set<Doctor> doctors) { this.doctors = doctors; }

    public byte[] getProfilePicture() { return profilePicture; }
    public void setProfilePicture(byte[] profilePicture) { this.profilePicture = profilePicture; }

    // Insurance Getters & Setters
    public String getInsuranceProvider() { return insuranceProvider; }
    public void setInsuranceProvider(String v) { this.insuranceProvider = v; }
    public String getPolicyNumber() { return policyNumber; }
    public void setPolicyNumber(String v) { this.policyNumber = v; }
    public String getInsuranceValidity() { return insuranceValidity; }
    public void setInsuranceValidity(String v) { this.insuranceValidity = v; }

    // Lifestyle Getters & Setters
    public String getSmokingStatus() { return smokingStatus; }
    public void setSmokingStatus(String v) { this.smokingStatus = v; }
    public String getAlcoholStatus() { return alcoholStatus; }
    public void setAlcoholStatus(String v) { this.alcoholStatus = v; }
    public String getExerciseFrequency() { return exerciseFrequency; }
    public void setExerciseFrequency(String v) { this.exerciseFrequency = v; }

    // Advanced Health Getters & Setters
    public String getFamilyMedicalHistory() { return familyMedicalHistory; }
    public void setFamilyMedicalHistory(String v) { this.familyMedicalHistory = v; }
    public String getOrganDonorStatus() { return organDonorStatus; }
    public void setOrganDonorStatus(String v) { this.organDonorStatus = v; }

    // Settings Getters & Setters
    public Boolean getMfaEnabled() { return mfaEnabled; }
    public void setMfaEnabled(Boolean v) { this.mfaEnabled = v; }
    public Boolean getEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(Boolean v) { this.emailNotifications = v; }
    public Boolean getAppNotifications() { return appNotifications; }
    public void setAppNotifications(Boolean v) { this.appNotifications = v; }
    public Boolean getSmsNotifications() { return smsNotifications; }
    public void setSmsNotifications(Boolean v) { this.smsNotifications = v; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    // New Fields Getters & Setters
    public String getNationalId() { return nationalId; }
    public void setNationalId(String v) { this.nationalId = v; }

    public String getMaritalStatus() { return maritalStatus; }
    public void setMaritalStatus(String v) { this.maritalStatus = v; }

    public String getOccupation() { return occupation; }
    public void setOccupation(String v) { this.occupation = v; }

    public String getAltEmergencyPhone() { return altEmergencyPhone; }
    public void setAltEmergencyPhone(String v) { this.altEmergencyPhone = v; }

    public String getHeight() { return height; }
    public void setHeight(String v) { this.height = v; }

    public String getWeight() { return weight; }
    public void setWeight(String v) { this.weight = v; }

    public Boolean getHasDisability() { return hasDisability; }
    public void setHasDisability(Boolean v) { this.hasDisability = v; }

    public String getDisabilityDetails() { return disabilityDetails; }
    public void setDisabilityDetails(String v) { this.disabilityDetails = v; }
}
