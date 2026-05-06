package com.health.medisync.model;

public class PatientDTO {
    private Long id;
    private String patientId;
    private String name;
    private String email;
    private String phone;
    private String bloodGroup;
    private String profilePictureUrl;
    private Integer age;
    private String gender;
    private String city;
    private String state;

    public PatientDTO() {}

    public PatientDTO(Patient p) {
        this.id = p.getId();
        this.patientId = p.getPatientId();
        this.name = p.getName();
        this.email = p.getEmail();
        this.phone = p.getPhone();
        this.bloodGroup = p.getBloodGroup();
        this.profilePictureUrl = p.getProfilePictureUrl();
        this.age = p.getAge();
        this.gender = p.getGender();
        this.city = p.getCity();
        this.state = p.getState();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }
    public String getProfilePictureUrl() { return profilePictureUrl; }
    public void setProfilePictureUrl(String profilePictureUrl) { this.profilePictureUrl = profilePictureUrl; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
}
