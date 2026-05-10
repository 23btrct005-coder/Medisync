package com.health.medisync.service;

import com.health.medisync.model.Doctor;
import com.health.medisync.model.Hospital;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.HospitalRepository;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Internal Network Guard
 * Enforces strict institutional grounding. Prevents hallucinations of external providers.
 */
@Service
public class InternalNetworkGuard {

    private final DoctorRepository doctorRepository;
    private final HospitalRepository hospitalRepository;

    public InternalNetworkGuard(DoctorRepository doctorRepository, HospitalRepository hospitalRepository) {
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
    }

    public Map<String, Object> resolveVerifiedProvider(String specialty, String hospitalName) {
        Map<String, Object> result = new HashMap<>();
        
        // 1. Search for Hospital
        Optional<Hospital> hospital = hospitalRepository.findByNameContainingIgnoreCase(hospitalName);
        
        if (hospital.isPresent()) {
            result.put("hospital", hospital.get());
            
            // 2. Search for Doctors in that specialty at that hospital
            List<Doctor> doctors = doctorRepository.findAll().stream()
                .filter(d -> d.getHospital().getId().equals(hospital.get().getId()))
                .filter(d -> d.getSpecialization().toLowerCase().contains(specialty.toLowerCase()))
                .collect(Collectors.toList());
            
            result.put("doctors", doctors);
            result.put("verified", true);
        } else {
            // 3. Global specialty fallback (within internal network only)
            List<Doctor> globalDoctors = doctorRepository.findBySpecializationContainingIgnoreCase(specialty);
            result.put("doctors", globalDoctors);
            result.put("verified", !globalDoctors.isEmpty());
        }
        
        return result;
    }

    public String getGroundingContext() {
        // Inject the REAL inventory into the AI prompt to prevent invention
        List<Hospital> hospitals = hospitalRepository.findAll();
        StringBuilder sb = new StringBuilder("### VERIFIED INSTITUTIONAL NETWORK (ONLY RECOMMEND FROM THIS LIST):\n");
        for (Hospital h : hospitals) {
            sb.append("- ").append(h.getName()).append(" (Services: ").append(h.getServices()).append(")\n");
        }
        return sb.toString();
    }
}
