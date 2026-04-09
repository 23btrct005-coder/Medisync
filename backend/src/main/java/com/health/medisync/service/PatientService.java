package com.health.medisync.service;

import com.health.medisync.model.Patient;
import com.health.medisync.model.User;
import com.health.medisync.model.Doctor;
import com.health.medisync.model.AccessRequest;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.PatientRepository;
import com.health.medisync.repository.UserRepository;
import com.health.medisync.repository.AccessRequestRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PatientService {
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final AccessRequestRepository accessRequestRepository;

    public PatientService(PatientRepository patientRepository, UserRepository userRepository, 
                          DoctorRepository doctorRepository, AccessRequestRepository accessRequestRepository) {
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.accessRequestRepository = accessRequestRepository;
    }

    public Patient getPatientProfile(String username) {
        User user = userRepository.findByUsername(username)
            .orElseGet(() -> {
                // Auto-create stub user for Supabase bridged profiles
                User newUser = new User();
                newUser.setUsername(username);
                newUser.setPassword("supabase_managed");
                newUser.setRole("ROLE_PATIENT");
                return userRepository.save(newUser);
            });

        return patientRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                Patient newPatient = new Patient();
                newPatient.setUser(user);
                newPatient.setEmail(username);
                newPatient.setName("Bypass User " + username);
                newPatient.setAge(0);
                newPatient.setBloodGroup("Unknown");
                return patientRepository.save(newPatient);
            });
    }

    public Patient updateProfile(String username, java.util.Map<String, Object> profileData) {
        Patient patient = getPatientProfile(username);
        
        if (profileData.containsKey("name")) {
            patient.setName((String) profileData.get("name"));
        }
        if (profileData.containsKey("age")) {
            Object age = profileData.get("age");
            if (age instanceof Integer) {
                patient.setAge((Integer) age);
            } else if (age instanceof String) {
                patient.setAge(Integer.parseInt((String) age));
            }
        }
        if (profileData.containsKey("bloodGroup")) {
            patient.setBloodGroup((String) profileData.get("bloodGroup"));
        } else if (profileData.containsKey("blood_group")) {
            // Support snake_case from Supabase
            patient.setBloodGroup((String) profileData.get("blood_group"));
        }
        
        return patientRepository.save(patient);
    }

    public void linkDoctor(String patientUsername, String doctorEmail) {
        Patient patient = getPatientProfile(patientUsername);
            
        Doctor doctor = doctorRepository.findByEmail(doctorEmail)
            .orElseThrow(() -> new RuntimeException("Doctor profile with email " + doctorEmail + " not found"));

        if (!patient.getDoctors().contains(doctor)) {
            patient.getDoctors().add(doctor);
            patientRepository.save(patient);
        }
    }

    public List<AccessRequest> getPendingRequests(String patientUsername) {
        Patient patient = getPatientProfile(patientUsername);
        return accessRequestRepository.findByPatientAndStatus(patient, "PENDING");
    }

    public void acceptRequest(String patientUsername, Long requestId) {
        Patient patient = getPatientProfile(patientUsername);
        AccessRequest request = accessRequestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Request not found"));
            
        if (!request.getPatient().getId().equals(patient.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        request.setStatus("ACCEPTED");
        accessRequestRepository.save(request);

        // Add to linkage
        if (!patient.getDoctors().contains(request.getDoctor())) {
            patient.getDoctors().add(request.getDoctor());
            patientRepository.save(patient);
        }
    }

    public void rejectRequest(String patientUsername, Long requestId) {
        Patient patient = getPatientProfile(patientUsername);
        AccessRequest request = accessRequestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Request not found"));
            
        if (!request.getPatient().getId().equals(patient.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        request.setStatus("REJECTED");
        accessRequestRepository.save(request);
    }
}
