package com.health.medisync.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "departments")
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "hospital_id")
    private Hospital hospital;

    @OneToOne
    @JoinColumn(name = "hod_id")
    private Doctor headOfDepartment;

    @OneToMany(mappedBy = "department")
    private List<Doctor> physicians;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }

    public Doctor getHeadOfDepartment() { return headOfDepartment; }
    public void setHeadOfDepartment(Doctor headOfDepartment) { this.headOfDepartment = headOfDepartment; }

    public List<Doctor> getPhysicians() { return physicians; }
    public void setPhysicians(List<Doctor> physicians) { this.physicians = physicians; }
}
