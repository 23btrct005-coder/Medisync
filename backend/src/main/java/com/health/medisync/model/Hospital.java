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
    private String hospitalType;   // Government / Private / Trust / Charitable
    private String website;
    
    // ── 1. Legal & Compliance ──
    private String gstNumber;
    private String panNumber;
    private String nabhId; // National Accreditation Board for Hospitals
    private String isoId;
    private String registrationCertificateUrl;
    
    // ── 2. Medical Infrastructure ──
    private Integer totalBeds;
    private Integer icuBeds;
    private Integer operationTheatersCount;
    private Integer ambulanceCount;
    private Integer nurseCount;
    private Integer generalStaffCount;
    private Boolean emergencyServicesAvailable = true; // 24/7 services
    
    // ── 5. Billing & Financial ──
    @Column(columnDefinition = "TEXT")
    private String insuranceProviders; // Comma-separated or JSON
    private String billingContactEmail;
    private String billingContactPhone;

    // ── 8. Online Presence & Branding ──
    private String googleMapsUrl;
    private String facebookUrl;
    private String twitterUrl;
    private String instagramUrl;
    @Column(columnDefinition = "TEXT")
    private String galleryUrls; // JSON string for hospital images

    @JsonIgnore
    @OneToMany(mappedBy = "hospitalEntity", cascade = CascadeType.ALL)
    private List<Doctor> doctors = new ArrayList<>();

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
}
