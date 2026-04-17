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
    private final EmailService emailService;

    public PatientService(PatientRepository patientRepository, UserRepository userRepository, 
                          DoctorRepository doctorRepository, AccessRequestRepository accessRequestRepository,
                          EmailService emailService) {
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.accessRequestRepository = accessRequestRepository;
        this.emailService = emailService;
    }

    public Patient getPatientProfile(String username) {
        User user = userRepository.findByUsernameIgnoreCase(username)
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
                newPatient.setName(username);
                newPatient.setAge(0);
                newPatient.setBloodGroup("Unknown");
                return patientRepository.save(newPatient);
            });
    }

    public Patient updateProfile(String overrideEmail, java.util.Map<String, Object> profileData) {
        String username = (overrideEmail != null) ? overrideEmail : (String) profileData.get("email");
        if (username == null) {
            throw new RuntimeException("Email is required for profile sync");
        }
        System.out.println("DEBUG: Initiating profile sync for user: " + username);
        Patient patient = getPatientProfile(username);
        
        if (profileData.containsKey("name")) patient.setName((String) profileData.get("name"));
        if (profileData.containsKey("phone")) patient.setPhone((String) profileData.get("phone"));
        if (profileData.containsKey("alternatePhone")) patient.setAlternatePhone((String) profileData.get("alternatePhone"));
        if (profileData.containsKey("street")) patient.setStreet((String) profileData.get("street"));
        if (profileData.containsKey("city")) patient.setCity((String) profileData.get("city"));
        if (profileData.containsKey("state")) patient.setState((String) profileData.get("state"));
        if (profileData.containsKey("pinCode")) patient.setPinCode((String) profileData.get("pinCode"));
        if (profileData.containsKey("bloodGroup")) patient.setBloodGroup((String) profileData.get("bloodGroup"));
        
        // Emergency Contact
        if (profileData.containsKey("emergencyContactName")) patient.setEmergencyContactName((String) profileData.get("emergencyContactName"));
        if (profileData.containsKey("emergencyContactRelationship")) patient.setEmergencyContactRelationship((String) profileData.get("emergencyContactRelationship"));
        if (profileData.containsKey("emergencyContactPhone")) patient.setEmergencyContactPhone((String) profileData.get("emergencyContactPhone"));

        // Insurance
        if (profileData.containsKey("insuranceProvider")) patient.setInsuranceProvider((String) profileData.get("insuranceProvider"));
        if (profileData.containsKey("policyNumber")) patient.setPolicyNumber((String) profileData.get("policyNumber"));
        if (profileData.containsKey("insuranceValidity")) patient.setInsuranceValidity((String) profileData.get("insuranceValidity"));

        // Lifestyle
        if (profileData.containsKey("smokingStatus")) patient.setSmokingStatus((String) profileData.get("smokingStatus"));
        if (profileData.containsKey("alcoholStatus")) patient.setAlcoholStatus((String) profileData.get("alcoholStatus"));
        if (profileData.containsKey("exerciseFrequency")) patient.setExerciseFrequency((String) profileData.get("exerciseFrequency"));

        // Advanced Medical
        if (profileData.containsKey("familyMedicalHistory")) patient.setFamilyMedicalHistory((String) profileData.get("familyMedicalHistory"));
        if (profileData.containsKey("organDonorStatus")) patient.setOrganDonorStatus((String) profileData.get("organDonorStatus"));
        if (profileData.containsKey("allergies")) patient.setAllergies((String) profileData.get("allergies"));
        if (profileData.containsKey("existingDiseases")) patient.setExistingDiseases((String) profileData.get("existingDiseases"));
        if (profileData.containsKey("currentMedications")) patient.setCurrentMedications((String) profileData.get("currentMedications"));
        if (profileData.containsKey("pastSurgeries")) patient.setPastSurgeries((String) profileData.get("pastSurgeries"));
        if (profileData.containsKey("medicalInfo")) patient.setMedicalInfo((String) profileData.get("medicalInfo"));

        // Settings & Preferences
        if (profileData.containsKey("mfaEnabled")) patient.setMfaEnabled((Boolean) profileData.get("mfaEnabled"));
        if (profileData.containsKey("emailNotifications")) patient.setEmailNotifications((Boolean) profileData.get("emailNotifications"));
        if (profileData.containsKey("appNotifications")) patient.setAppNotifications((Boolean) profileData.get("appNotifications"));
        if (profileData.containsKey("smsNotifications")) patient.setSmsNotifications((Boolean) profileData.get("smsNotifications"));

        // Age logic (handling both string and number)
        if (profileData.containsKey("age")) {
            Object ageObj = profileData.get("age");
            if (ageObj instanceof Number) patient.setAge(((Number) ageObj).intValue());
            else if (ageObj instanceof String && !((String)ageObj).isEmpty()) {
                try { patient.setAge(Integer.parseInt((String) ageObj)); } catch (Exception ignored) {}
            }
        }
        
        Patient saved = patientRepository.save(patient);
        System.out.println("DEBUG: Profile update completed successfully for: " + username);
        return saved;
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

    public void updateProfilePhoto(String username, byte[] photoBytes) {
        Patient patient = getPatientProfile(username);
        patient.setProfilePicture(photoBytes);
        patientRepository.save(patient);
    }
    public List<Doctor> getLinkedDoctors(String username) {
        Patient patient = getPatientProfile(username);
        return List.copyOf(patient.getDoctors());
    }

    public void revokeDoctorAccess(String patientUsername, Long doctorId) {
        Patient patient = getPatientProfile(patientUsername);
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new RuntimeException("Doctor not found"));

        if (patient.getDoctors().contains(doctor)) {
            patient.getDoctors().remove(doctor);
            patientRepository.save(patient);

            // Also update any existing access requests to REVOKED
            List<AccessRequest> requests = accessRequestRepository.findByPatientAndStatus(patient, "ACCEPTED");
            for (AccessRequest request : requests) {
                if (request.getDoctor().getId().equals(doctorId)) {
                    request.setStatus("REVOKED");
                    accessRequestRepository.save(request);
                }
            }
        }
    }

    public void inviteDoctor(String patientUsername, String doctorEmail) {
        Patient patient = getPatientProfile(patientUsername);
        String doctorEmailLower = doctorEmail.trim().toLowerCase();

        // 1. Check if already linked
        boolean isAlreadyLinked = patient.getDoctors().stream()
            .anyMatch(d -> d.getEmail().equalsIgnoreCase(doctorEmailLower));
        
        if (isAlreadyLinked) {
            throw new RuntimeException("This physician already has active access to your portal.");
        }

        // 2. Check if doctor exists and create/update access request
        Doctor doctor = doctorRepository.findByEmail(doctorEmailLower).orElse(null);
        if (doctor != null) {
            // Check for existing pending request to avoid duplicates
            List<AccessRequest> existing = accessRequestRepository.findByPatientAndStatus(patient, "PENDING");
            boolean hasPending = existing.stream().anyMatch(r -> r.getDoctor().getId().equals(doctor.getId()));
            
            if (!hasPending) {
                AccessRequest request = new AccessRequest();
                request.setPatient(patient);
                request.setDoctor(doctor);
                request.setStatus("PENDING");
                request.setPatientMessage("Patient-initiated invitation");
                accessRequestRepository.save(request);
            }
        }

        // 3. Trigger Email Notification
        emailService.sendDoctorInvitationEmail(doctorEmailLower, patient.getName());
    }
}
