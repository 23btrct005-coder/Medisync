package com.health.medisync.service;

import com.health.medisync.model.Hospital;
import com.health.medisync.model.HospitalAdmin;
import com.health.medisync.model.Doctor;
import com.health.medisync.repository.HospitalRepository;
import com.health.medisync.repository.HospitalAdminRepository;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class HospitalService {
    private final HospitalRepository hospitalRepository;
    private final HospitalAdminRepository adminRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    public HospitalService(HospitalRepository hospitalRepository, HospitalAdminRepository adminRepository,
                           DoctorRepository doctorRepository, UserRepository userRepository) {
        this.hospitalRepository = hospitalRepository;
        this.adminRepository = adminRepository;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
    }

    public HospitalAdmin getAdminProfile(String username) {
        return adminRepository.findByUserUsernameIgnoreCase(username)
            .orElseThrow(() -> new RuntimeException("Hospital Admin profile not found."));
    }

    public List<Doctor> getHospitalDoctors(String adminUsername) {
        HospitalAdmin admin = getAdminProfile(adminUsername);
        return admin.getHospital().getDoctors();
    }

    public Map<String, Object> getHospitalStats(String adminUsername) {
        HospitalAdmin admin = getAdminProfile(adminUsername);
        Hospital hospital = admin.getHospital();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("hospitalName", hospital.getName());
        stats.put("totalDoctors", hospital.getDoctors().size());
        stats.put("activeDoctors", hospital.getDoctors().stream().filter(Doctor::isApproved).count());
        stats.put("pendingDoctors", hospital.getDoctors().stream().filter(d -> !d.isApproved()).count());
        
        // In a real app, we'd aggregate patient counts/revenue here
        stats.put("totalPatientsInstitutional", 1500); // Simulated institutional reach
        stats.put("monthlyGrowth", "+12%");
        
        return stats;
    }

    public void approveDoctor(String adminUsername, Long doctorId) {
        HospitalAdmin admin = getAdminProfile(adminUsername);
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (!doctor.getHospitalEntity().getId().equals(admin.getHospital().getId())) {
            throw new RuntimeException("Security Violation: You can only approve doctors for your own institution.");
        }

        doctor.setApproved(true);
        doctorRepository.save(doctor);
    }
}
