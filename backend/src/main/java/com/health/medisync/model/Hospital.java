package com.health.medisync.model;

import jakarta.persistence.*;
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
    private String contactEmail;
    private String logoUrl;
    
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
}
