package com.health.medisync.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "hospitals")
public class Hospital {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String licenseCode;

    private String location;
    private String street;
    private String state;
    private String city;
    private String pinCode;
    private String phone;
    private String contactEmail;
    private String logoUrl;
    private String hospitalType;   // Clinic / Multi-speciality / Super-speciality
    private String ownershipType; // Private / Government / Trust / NGO
    private String website;
    private String timezone;
    private String workingHours;
    
    // ── 1. Legal & Compliance ──
    private String gstNumber;
    private String panNumber;
    private String registrationAuthority;
    private String registrationDate;
    private String licenseExpiryDate;
    private String nabhId; 
    private String isoId;
    private String registrationCertificateUrl;
    private String nabhCertificateUrl;
    private String taxCertificateUrl;
    private String addressProofUrl;
    private String facilityId; // ABDM Facility ID
    private String govtRegistrationNumber;
    private String cinNumber; // For corporate hospitals
    
    // ── 1b. Medical Authority (Director) ──
    private String medicalDirectorName;
    private String medicalDirectorQualification;
    private String medicalDirectorRegNumber;
    private String medicalDirectorEmail;
    
    // ── 2. Medical Infrastructure ──
    @Column(columnDefinition = "TEXT")
    private String departments; // Cardiology, Neurology, etc. (JSON)
    private Integer totalBeds;
    private Integer icuBeds;
    private Integer operationTheatersCount;
    private Integer ambulanceCount;
    private Integer nurseCount;
    private Integer generalStaffCount;
    private Boolean icuAvailable = false;
    private Boolean ambulanceAvailable = false;
    private Boolean emergencyServicesAvailable = true; // 24/7 services
    private String officialEmergencyContact;
    private String alternatePhone;
    private Integer doctorCount;
    
    @Column(columnDefinition = "TEXT")
    private String services; // Diagnostic/Clinical Services (e.g. MRI, X-Ray, Blood Test)
    
    // ── 3. Digital Capabilities ──
    private Boolean hasEhr = false;
    private Boolean hasPacs = false;
    private Boolean hasLabIntegration = false;
    private Boolean telemedicineEnabled = false;
    
    // ── 4. Appointment & Scheduling ──
    private String consultationTimings; // e.g. "9:00 AM - 9:00 PM"
    private Boolean walkInAllowed = true;
    private Integer avgWaitingTime; // in minutes
    
    // ── 5. Billing & Financial ──
    @Column(columnDefinition = "TEXT")
    private String insuranceProviders; // Comma-separated or JSON
    private String consultationFees; // JSON mapping department -> fee
    private String billingContactEmail;
    private String billingContactPhone;
    
    // ── 5b. Financial Settlement ──
    private String bankName;
    private String bankAccountNumber;
    private String ifscCode;
    private String upiId;
    private String razorpayAccountId;
    private String razorpayKeyId;
    private String razorpayKeySecret;
    private String preferredPaymentMode; // RAZORPAY, UPI, BOTH

    // ── 8. Online Presence & Branding ──
    private String googleMapsUrl;
    private String facebookUrl;
    private String twitterUrl;
    private String instagramUrl;
    @Column(columnDefinition = "TEXT")
    private String galleryUrls; // JSON string for hospital images
    private String accreditationBadges; // NABH, ISO, etc.

    @JsonIgnore
    @OneToMany(mappedBy = "hospitalEntity", cascade = CascadeType.ALL)
    private List<Doctor> doctors = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "hospital", cascade = CascadeType.ALL)
    private List<HospitalAdmin> admins = new ArrayList<>();

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLicenseCode() { return licenseCode; }
    public void setLicenseCode(String licenseCode) { this.licenseCode = licenseCode; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public List<Doctor> getDoctors() { return doctors; }
    public void setDoctors(List<Doctor> doctors) { this.doctors = doctors; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }

    public String getHospitalType() { return hospitalType; }
    public void setHospitalType(String hospitalType) { this.hospitalType = hospitalType; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getGstNumber() { return gstNumber; }
    public void setGstNumber(String gstNumber) { this.gstNumber = gstNumber; }

    public String getPanNumber() { return panNumber; }
    public void setPanNumber(String panNumber) { this.panNumber = panNumber; }

    public String getNabhId() { return nabhId; }
    public void setNabhId(String nabhId) { this.nabhId = nabhId; }

    public String getIsoId() { return isoId; }
    public void setIsoId(String isoId) { this.isoId = isoId; }

    public String getRegistrationCertificateUrl() { return registrationCertificateUrl; }
    public void setRegistrationCertificateUrl(String registrationCertificateUrl) { this.registrationCertificateUrl = registrationCertificateUrl; }

    public Integer getTotalBeds() { return totalBeds; }
    public void setTotalBeds(Integer totalBeds) { this.totalBeds = totalBeds; }

    public Integer getIcuBeds() { return icuBeds; }
    public void setIcuBeds(Integer icuBeds) { this.icuBeds = icuBeds; }

    public Integer getOperationTheatersCount() { return operationTheatersCount; }
    public void setOperationTheatersCount(Integer operationTheatersCount) { this.operationTheatersCount = operationTheatersCount; }

    public Integer getAmbulanceCount() { return ambulanceCount; }
    public void setAmbulanceCount(Integer ambulanceCount) { this.ambulanceCount = ambulanceCount; }

    public Integer getNurseCount() { return nurseCount; }
    public void setNurseCount(Integer nurseCount) { this.nurseCount = nurseCount; }

    public Integer getGeneralStaffCount() { return generalStaffCount; }
    public void setGeneralStaffCount(Integer generalStaffCount) { this.generalStaffCount = generalStaffCount; }

    public Boolean getEmergencyServicesAvailable() { return emergencyServicesAvailable; }
    public void setEmergencyServicesAvailable(Boolean emergencyServicesAvailable) { this.emergencyServicesAvailable = emergencyServicesAvailable; }

    public String getInsuranceProviders() { return insuranceProviders; }
    public void setInsuranceProviders(String insuranceProviders) { this.insuranceProviders = insuranceProviders; }

    public String getBillingContactEmail() { return billingContactEmail; }
    public void setBillingContactEmail(String billingContactEmail) { this.billingContactEmail = billingContactEmail; }

    public String getBillingContactPhone() { return billingContactPhone; }
    public void setBillingContactPhone(String billingContactPhone) { this.billingContactPhone = billingContactPhone; }

    public String getGoogleMapsUrl() { return googleMapsUrl; }
    public void setGoogleMapsUrl(String googleMapsUrl) { this.googleMapsUrl = googleMapsUrl; }

    public String getFacebookUrl() { return facebookUrl; }
    public void setFacebookUrl(String facebookUrl) { this.facebookUrl = facebookUrl; }

    public String getTwitterUrl() { return twitterUrl; }
    public void setTwitterUrl(String twitterUrl) { this.twitterUrl = twitterUrl; }

    public String getInstagramUrl() { return instagramUrl; }
    public void setInstagramUrl(String instagramUrl) { this.instagramUrl = instagramUrl; }

    public String getGalleryUrls() { return galleryUrls; }
    public void setGalleryUrls(String galleryUrls) { this.galleryUrls = galleryUrls; }

    public String getOwnershipType() { return ownershipType; }
    public void setOwnershipType(String ownershipType) { this.ownershipType = ownershipType; }

    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }

    public String getWorkingHours() { return workingHours; }
    public void setWorkingHours(String workingHours) { this.workingHours = workingHours; }

    public String getRegistrationAuthority() { return registrationAuthority; }
    public void setRegistrationAuthority(String registrationAuthority) { this.registrationAuthority = registrationAuthority; }

    public String getRegistrationDate() { return registrationDate; }
    public void setRegistrationDate(String registrationDate) { this.registrationDate = registrationDate; }

    public String getLicenseExpiryDate() { return licenseExpiryDate; }
    public void setLicenseExpiryDate(String licenseExpiryDate) { this.licenseExpiryDate = licenseExpiryDate; }

    public String getNabhCertificateUrl() { return nabhCertificateUrl; }
    public void setNabhCertificateUrl(String nabhCertificateUrl) { this.nabhCertificateUrl = nabhCertificateUrl; }

    public String getTaxCertificateUrl() { return taxCertificateUrl; }
    public void setTaxCertificateUrl(String taxCertificateUrl) { this.taxCertificateUrl = taxCertificateUrl; }

    public String getAddressProofUrl() { return addressProofUrl; }
    public void setAddressProofUrl(String addressProofUrl) { this.addressProofUrl = addressProofUrl; }

    public Boolean getIcuAvailable() { return icuAvailable; }
    public void setIcuAvailable(Boolean icuAvailable) { this.icuAvailable = icuAvailable; }

    public Boolean getAmbulanceAvailable() { return ambulanceAvailable; }
    public void setAmbulanceAvailable(Boolean ambulanceAvailable) { this.ambulanceAvailable = ambulanceAvailable; }

    public String getOfficialEmergencyContact() { return officialEmergencyContact; }
    public void setOfficialEmergencyContact(String officialEmergencyContact) { this.officialEmergencyContact = officialEmergencyContact; }

    public String getAlternatePhone() { return alternatePhone; }
    public void setAlternatePhone(String alternatePhone) { this.alternatePhone = alternatePhone; }

    public String getFacilityId() { return facilityId; }
    public void setFacilityId(String facilityId) { this.facilityId = facilityId; }

    public String getGovtRegistrationNumber() { return govtRegistrationNumber; }
    public void setGovtRegistrationNumber(String govtRegistrationNumber) { this.govtRegistrationNumber = govtRegistrationNumber; }

    public String getCinNumber() { return cinNumber; }
    public void setCinNumber(String cinNumber) { this.cinNumber = cinNumber; }

    public String getMedicalDirectorName() { return medicalDirectorName; }
    public void setMedicalDirectorName(String medicalDirectorName) { this.medicalDirectorName = medicalDirectorName; }

    public String getMedicalDirectorQualification() { return medicalDirectorQualification; }
    public void setMedicalDirectorQualification(String medicalDirectorQualification) { this.medicalDirectorQualification = medicalDirectorQualification; }

    public String getMedicalDirectorRegNumber() { return medicalDirectorRegNumber; }
    public void setMedicalDirectorRegNumber(String medicalDirectorRegNumber) { this.medicalDirectorRegNumber = medicalDirectorRegNumber; }

    public String getMedicalDirectorEmail() { return medicalDirectorEmail; }
    public void setMedicalDirectorEmail(String medicalDirectorEmail) { this.medicalDirectorEmail = medicalDirectorEmail; }

    public Integer getDoctorCount() { return doctorCount; }
    public void setDoctorCount(Integer doctorCount) { this.doctorCount = doctorCount; }

    public Boolean getHasEhr() { return hasEhr; }
    public void setHasEhr(Boolean hasEhr) { this.hasEhr = hasEhr; }

    public Boolean getHasPacs() { return hasPacs; }
    public void setHasPacs(Boolean hasPacs) { this.hasPacs = hasPacs; }

    public Boolean getHasLabIntegration() { return hasLabIntegration; }
    public void setHasLabIntegration(Boolean hasLabIntegration) { this.hasLabIntegration = hasLabIntegration; }

    public Boolean getTelemedicineEnabled() { return telemedicineEnabled; }
    public void setTelemedicineEnabled(Boolean telemedicineEnabled) { this.telemedicineEnabled = telemedicineEnabled; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public String getBankAccountNumber() { return bankAccountNumber; }
    public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }

    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }

    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }

    public String getRazorpayAccountId() { return razorpayAccountId; }
    public void setRazorpayAccountId(String razorpayAccountId) { this.razorpayAccountId = razorpayAccountId; }

    public String getRazorpayKeyId() { return razorpayKeyId; }
    public void setRazorpayKeyId(String razorpayKeyId) { this.razorpayKeyId = razorpayKeyId; }

    public String getRazorpayKeySecret() { return razorpayKeySecret; }
    public void setRazorpayKeySecret(String razorpayKeySecret) { this.razorpayKeySecret = razorpayKeySecret; }

    public String getPreferredPaymentMode() { return preferredPaymentMode; }
    public void setPreferredPaymentMode(String preferredPaymentMode) { this.preferredPaymentMode = preferredPaymentMode; }

    public List<HospitalAdmin> getAdmins() { return admins; }
    public void setAdmins(List<HospitalAdmin> admins) { this.admins = admins; }

    public String getServices() { return services; }
    public void setServices(String services) { this.services = services; }
}
