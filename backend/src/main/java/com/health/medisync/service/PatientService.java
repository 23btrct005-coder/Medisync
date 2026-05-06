package com.health.medisync.service;

import com.health.medisync.model.Patient;
import com.health.medisync.model.User;
import com.health.medisync.util.PatientIdGenerator;
import com.health.medisync.model.Doctor;
import com.health.medisync.model.AccessRequest;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.PatientRepository;
import com.health.medisync.repository.UserRepository;
import com.health.medisync.repository.AccessRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class PatientService {
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final com.health.medisync.repository.AppointmentRepository appointmentRepository;
    private final AccessRequestRepository accessRequestRepository;
    private final EmailService emailService;
    private final SupabaseStorageService supabaseStorageService;
    private final NotificationService notificationService;

    public PatientService(PatientRepository patientRepository, UserRepository userRepository, 
                          DoctorRepository doctorRepository, AccessRequestRepository accessRequestRepository,
                          com.health.medisync.repository.AppointmentRepository appointmentRepository,
                          EmailService emailService, SupabaseStorageService supabaseStorageService,
                          NotificationService notificationService) {
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.accessRequestRepository = accessRequestRepository;
        this.appointmentRepository = appointmentRepository;
        this.emailService = emailService;
        this.supabaseStorageService = supabaseStorageService;
        this.notificationService = notificationService;
    }

    @Transactional
    public Patient getPatientProfile(String rawUsername) {
        final String username = (rawUsername != null) ? rawUsername.trim().toLowerCase() : null;
        if (username == null) return null;
        
        // Direct check for patient profile first as it's the most common path
        return patientRepository.findByUserUsernameIgnoreCase(username)
            .orElseGet(() -> {
                System.out.println("DEBUG: Resolving full clinical identity for: " + username);
                User user = userRepository.findByUsernameIgnoreCase(username)
                    .orElseGet(() -> {
                        System.out.println("INFO: Auto-creating stub user for managed identity: " + username);
                        User newUser = new User();
                        newUser.setUsername(username);
                        newUser.setPassword("supabase_managed");
                        newUser.setRole("ROLE_PATIENT");
                        newUser.setEnabled(true);
                        return userRepository.save(newUser);
                    });

                System.out.println("INFO: Linking fresh clinical profile for user ID: " + user.getId());
                Patient newPatient = new Patient();
                newPatient.setUser(user);
                newPatient.setEmail(username);
                newPatient.setName(username.contains("@") ? username.split("@")[0] : username);
                newPatient.setAge(0);
                newPatient.setBloodGroup("Unknown");
                newPatient.setPatientId(generateUniquePatientId());
                return patientRepository.save(newPatient);
            });
    }

    private String generateUniquePatientId() {
        String code;
        do {
            code = PatientIdGenerator.generate();
        } while (patientRepository.findByPatientId(code).isPresent());
        return code;
    }

    public java.util.Optional<Patient> getPatientByShortCode(String shortCode) {
        return patientRepository.findByPatientId(shortCode.toUpperCase().trim());
    }

    public Patient getPatientById(Long id) {
        return patientRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Patient not found."));
    }

    @Transactional
    public Patient updateProfile(String overrideEmail, java.util.Map<String, Object> profileData) {
        String username = (overrideEmail != null) ? overrideEmail : (String) profileData.get("email");
        if (username == null) {
            throw new RuntimeException("Email is required for profile sync");
        }
        System.out.println("DEBUG: Initiating profile sync for user: " + username);
        Patient patient = getPatientProfile(username);
        
        // 🚀 Migration Support: Assign ID if missing
        if (patient.getPatientId() == null) {
            patient.setPatientId(generateUniquePatientId());
        }
        
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
        if (profileData.containsKey("historyPasscode")) patient.setHistoryPasscode((String) profileData.get("historyPasscode"));

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

    @Transactional
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

    @Transactional
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

        // Notify Doctor
        notificationService.sendNotification(
            request.getDoctor().getUser().getId(),
            "SECURITY",
            "Access Authorization Granted",
            patient.getName() + " has approved your clinical access request.",
            "/doctor-dashboard/patients",
            "View Profile"
        );
    }

    @Transactional
    public void rejectRequest(String patientUsername, Long requestId) {
        Patient patient = getPatientProfile(patientUsername);
        AccessRequest request = accessRequestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Request not found"));
            
        if (!request.getPatient().getId().equals(patient.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        request.setStatus("REJECTED");
        accessRequestRepository.save(request);

        // Notify Doctor
        notificationService.sendNotification(
            request.getDoctor().getUser().getId(),
            "SECURITY",
            "Access Request Rejected",
            patient.getName() + " has declined your clinical access request.",
            "/doctor-dashboard",
            "OK"
        );
    }

    public List<Doctor> getLinkedDoctors(String username) {
        Patient patient = getPatientProfile(username);
        java.util.Set<Doctor> allDoctors = new java.util.HashSet<>(patient.getDoctors());
        
        // Also add doctors with confirmed (BOOKED) appointments
        List<com.health.medisync.model.Appointment> appointments = appointmentRepository.findByPatientIdAndStatusIn(
            patient.getId(), 
            List.of(com.health.medisync.model.Appointment.AppointmentStatus.BOOKED, 
                    com.health.medisync.model.Appointment.AppointmentStatus.AWAITING_VERIFICATION)
        );
        
        for (com.health.medisync.model.Appointment appt : appointments) {
            allDoctors.add(appt.getDoctor());
        }
        
        return List.copyOf(allDoctors);
    }

    @Transactional
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

        // Notify Doctor
        notificationService.sendNotification(
            doctor.getUser().getId(),
            "SECURITY",
            "Access Revoked",
            patient.getName() + " has withdrawn your clinical access privileges.",
            "/doctor-dashboard",
            "OK"
        );
    }

    @Transactional
    public void inviteDoctor(String patientUsername, String doctorEmail) {
        Patient patient = getPatientProfile(patientUsername);
        String doctorEmailLower = doctorEmail.trim().toLowerCase();

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

                // Notify Doctor (In-App)
                notificationService.sendNotification(
                    doctor.getUser().getId(),
                    "SECURITY",
                    "New Patient Invitation",
                    patient.getName() + " has invited you to oversee their clinical profile.",
                    "/doctor-dashboard",
                    "Manage Requests"
                );
            }
        }

        // 3. Trigger Email Notification
        emailService.sendDoctorInvitationEmail(doctorEmailLower, patient.getName());
    }

    @Transactional
    public void updateProfilePhoto(String email, MultipartFile file) {
        Patient patient = patientRepository.findByUserUsernameIgnoreCase(email)
            .orElseThrow(() -> new RuntimeException("Patient not found"));
        
        String photoUrl = supabaseStorageService.uploadFile(file);
        if (photoUrl != null) {
            patient.setProfilePictureUrl(photoUrl);
            patientRepository.save(patient);
        }
    }

    @Transactional
    public void updateLocation(String email, Double lat, Double lng) {
        Patient patient = patientRepository.findByUserUsernameIgnoreCase(email)
            .orElseThrow(() -> new RuntimeException("Patient not found"));
        patient.setLatitude(lat);
        patient.setLongitude(lng);
        patientRepository.save(patient);
    }
}
