package com.health.medisync.service;

import com.health.medisync.model.User;
import com.health.medisync.model.Doctor;
import com.health.medisync.model.Patient;
import com.health.medisync.model.HospitalAdmin;
import com.health.medisync.repository.UserRepository;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.PatientRepository;
import com.health.medisync.repository.HospitalAdminRepository;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.HashMap;

@Service
public class IdentityService {
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final HospitalAdminRepository hospitalAdminRepository;

    public IdentityService(UserRepository userRepository, 
                           DoctorRepository doctorRepository, 
                           PatientRepository patientRepository,
                           HospitalAdminRepository hospitalAdminRepository) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.hospitalAdminRepository = hospitalAdminRepository;
    }

    public Map<String, String> resolveIdentity(Long userId) {
        Map<String, String> identity = new HashMap<>();
        identity.put("name", "Unknown User");
        identity.put("image", null);

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return identity;

        String role = user.getRole();
        if ("ROLE_DOCTOR".equals(role)) {
            doctorRepository.findByUserId(userId).ifPresent(d -> {
                identity.put("name", d.getName());
                identity.put("image", d.getProfilePictureUrl());
            });
        } else if ("ROLE_PATIENT".equals(role)) {
            patientRepository.findByUserId(userId).ifPresent(p -> {
                identity.put("name", p.getName());
                identity.put("image", p.getProfilePictureUrl());
            });
        } else if ("ROLE_HOSPITAL_ADMIN".equals(role)) {
            hospitalAdminRepository.findByUserId(userId).ifPresent(a -> {
                identity.put("name", a.getName());
                identity.put("image", a.getProfilePictureUrl());
            });
        }

        return identity;
    }
}
