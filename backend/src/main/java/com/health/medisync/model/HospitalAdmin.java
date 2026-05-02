package com.health.medisync.model;

import jakarta.persistence.*;

@Entity
@Table(name = "hospital_admins")
public class HospitalAdmin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "hospital_id")
    private Hospital hospital;

    private String name;
    private String position;
    private String profilePictureUrl;
    private String contactNumber;
    private String idProofUrl;
    private boolean approved = false;

    // Getters & Setters
    public boolean isApproved() { return approved; }
    public void setApproved(boolean approved) { this.approved = approved; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getIdProofUrl() { return idProofUrl; }
    public void setIdProofUrl(String idProofUrl) { this.idProofUrl = idProofUrl; }
}
