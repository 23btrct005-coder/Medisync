package com.health.medisync.service;

import com.health.medisync.model.Appointment;
import com.health.medisync.model.Doctor;
import com.health.medisync.model.Patient;
import com.health.medisync.model.User;
import com.health.medisync.model.MedicalRecord;
import com.health.medisync.model.MedicalRecordRequest;
import com.health.medisync.model.Report;
import com.health.medisync.model.AccessRequest;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.UserRepository;
import com.health.medisync.repository.PatientRepository;
import com.health.medisync.repository.MedicalRecordRepository;
import com.health.medisync.repository.ReportRepository;
import com.health.medisync.repository.AccessRequestRepository;
import com.health.medisync.service.DatabaseSchemaService;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class DoctorService {
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final MedicalRecordRepository recordRepository;
    private final ReportRepository reportRepository;
    private final AccessRequestRepository accessRequestRepository;
    private final SupabaseStorageService supabaseStorageService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final DatabaseSchemaService databaseSchemaService;

    public DoctorService(DoctorRepository doctorRepository, UserRepository userRepository,
                         PatientRepository patientRepository, MedicalRecordRepository recordRepository,
                         ReportRepository reportRepository, AccessRequestRepository accessRequestRepository,
                         SupabaseStorageService supabaseStorageService,
                         NotificationService notificationService,
                         AuditLogService auditLogService,
                         DatabaseSchemaService databaseSchemaService) {
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.recordRepository = recordRepository;
        this.reportRepository = reportRepository;
        this.accessRequestRepository = accessRequestRepository;
        this.supabaseStorageService = supabaseStorageService;
        this.notificationService = notificationService;
        this.auditLogService = auditLogService;
        this.databaseSchemaService = databaseSchemaService;
    }

    public Doctor getDoctorProfile(String username) {
        // Safety: Ensure schema is synchronized before fetching the complex Doctor entity
        databaseSchemaService.selfHealSchema();
        
        User user = userRepository.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return doctorRepository.findByUserId(user.getId())
            .orElseThrow(() -> new RuntimeException("Doctor profile not found. Please complete your registration."));
    }

    public List<Patient> getLinkedPatients(String doctorUsername) {
        Doctor doctor = getDoctorProfile(doctorUsername);
        return patientRepository.findByDoctorId(doctor.getId());
    }

    public void requestAccess(String doctorUsername, String patientEmail) {
        Doctor doctor = getDoctorProfile(doctorUsername);
        Patient patient = patientRepository.findByUserUsernameIgnoreCase(patientEmail)
            .orElseThrow(() -> new RuntimeException("Patient with email/username " + patientEmail + " not found"));
        createAccessRequest(doctor, patient);
    }

    public void requestAccess(String doctorUsername, Long patientId) {
        Doctor doctor = getDoctorProfile(doctorUsername);
        Patient patient = patientRepository.findById(patientId)
            .orElseThrow(() -> new RuntimeException("Patient not found"));
        createAccessRequest(doctor, patient);
    }

    private void createAccessRequest(Doctor doctor, Patient patient) {
        accessRequestRepository.findByDoctorAndPatient(doctor, patient).ifPresent(existing -> {
            if ("REJECTED".equals(existing.getStatus()) || "REVOKED".equals(existing.getStatus())) {
                existing.setStatus("PENDING");
                accessRequestRepository.save(existing);
                
                // Notify Patient (Re-request)
                notificationService.sendNotification(
                    patient.getUser().getId(),
                    "SECURITY",
                    "Access Re-authentication Requested",
                    "Dr. " + doctor.getName() + " has requested to re-link with your clinical profile.",
                    "/dashboard",
                    "Review Request"
                );
                return;
            }
            throw new RuntimeException("A link request already exists between you and this patient (Status: " + existing.getStatus() + ")");
        });

        if (accessRequestRepository.findByDoctorAndPatient(doctor, patient).isEmpty()) {
            AccessRequest req = new AccessRequest();
            req.setDoctor(doctor);
            req.setPatient(patient);
            req.setStatus("PENDING");
            accessRequestRepository.save(req);

            // Notify Patient
            notificationService.sendNotification(
                patient.getUser().getId(),
                "SECURITY",
                "New Access Request",
                "Dr. " + doctor.getName() + " has requested access to your clinical profile.",
                "/dashboard",
                "Respond Now"
            );
        }
    }

    private void verifyAccess(Doctor doctor, Long patientId) {
        // Authoritative Check: Is this patient in the doctor's verified census?
        List<Patient> linkedPatients = patientRepository.findByDoctorId(doctor.getId());
        boolean hasAccess = linkedPatients.stream().anyMatch(p -> p.getId().equals(patientId));
            
        if (!hasAccess) {
            throw new RuntimeException("Unauthorized Access: This patient is not linked to your clinical practice. Please use the Patient Code to establish a secure link.");
        }
        
        // Security Logging
        auditLogService.log(
            doctor.getUser().getId(),
            doctor.getName(),
            "ACCESS_VIEW",
            patientId,
            "Doctor accessed full patient clinical dossier"
        );
    }

    public Patient getPatientById(String doctorUsername, Long id) {
        Doctor doctor = getDoctorProfile(doctorUsername);
        verifyAccess(doctor, id);
        return patientRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Clinical telemetry for subject #" + id + " not found in the local ledger."));
    }

    public List<MedicalRecord> getPatientRecords(String doctorUsername, Long patientId) {
        Doctor doctor = getDoctorProfile(doctorUsername);
        verifyAccess(doctor, patientId);
        return recordRepository.findByPatientId(patientId);
    }

    public List<Report> getPatientReports(String doctorUsername, Long patientId) {
        Doctor doctor = getDoctorProfile(doctorUsername);
        verifyAccess(doctor, patientId);
        return reportRepository.findByPatientId(patientId);
    }

    public List<AccessRequest> getDoctorRequests(String doctorUsername) {
        Doctor doctor = getDoctorProfile(doctorUsername);
        return accessRequestRepository.findByDoctor(doctor);
    }

    public MedicalRecord addMedicalRecord(String doctorUsername, Long patientId, MedicalRecordRequest request) {
        Doctor doctor = getDoctorProfile(doctorUsername);
        Patient patient = getPatientById(doctorUsername, patientId);

        MedicalRecord record = new MedicalRecord();
        record.setPatient(patient);
        record.setDiagnosis(request.getDiagnosis());
        record.setPrescription(request.getPrescription());
        record.setDate(request.getDate() != null ? request.getDate() : java.time.LocalDate.now());
        record.setDoctorName(doctor.getName());

        MedicalRecord saved = recordRepository.save(record);

        // Security Logging
        auditLogService.log(
            doctor.getUser().getId(),
            doctor.getName(),
            "RECORD_CREATE",
            patientId,
            "Logged new clinical diagnosis"
        );

        // Notify Patient
        notificationService.sendNotification(
            patient.getUser().getId(),
            "APPOINTMENT",
            "Medical Record Added",
            "A new clinical diagnosis has been logged by Dr. " + doctor.getName() + ".",
            "/dashboard/records",
            "View Records"
        );

        return saved;
    }

    public Doctor updateProfile(String doctorUsername, Map<String, Object> updates) {
        Doctor doctor = getDoctorProfile(doctorUsername);
        System.out.println("DEBUG: Profile sync for " + doctorUsername);
        System.out.println("DEBUG: Incoming updates: " + updates);
        
        if (updates.containsKey("name")) doctor.setName((String) updates.get("name"));
        if (updates.containsKey("phone")) doctor.setPhone((String) updates.get("phone"));
        if (updates.containsKey("alternatePhone")) doctor.setAlternatePhone((String) updates.get("alternatePhone"));
        if (updates.containsKey("specialization")) doctor.setSpecialization((String) updates.get("specialization"));
        if (updates.containsKey("medicalDegree")) doctor.setMedicalDegree((String) updates.get("medicalDegree"));
        if (updates.containsKey("medicalLicenseNumber")) doctor.setMedicalLicenseNumber((String) updates.get("medicalLicenseNumber"));
        if (updates.containsKey("hospital")) doctor.setHospital((String) updates.get("hospital"));
        if (updates.containsKey("college")) doctor.setCollege((String) updates.get("college"));
        if (updates.containsKey("additionalCertifications")) doctor.setAdditionalCertifications((String) updates.get("additionalCertifications"));
        
        if (updates.containsKey("yearsOfExperience")) {
            Object exp = updates.get("yearsOfExperience");
            if (exp != null && !exp.toString().trim().isEmpty()) {
                try {
                    if (exp instanceof Number) {
                        doctor.setYearsOfExperience(((Number) exp).intValue());
                    } else {
                        doctor.setYearsOfExperience(Integer.parseInt(exp.toString().trim()));
                    }
                } catch (NumberFormatException e) {
                    System.err.println("DEBUG: Failed to parse yearsOfExperience: " + exp);
                }
            }
        }
        
        if (updates.containsKey("consultationFee")) doctor.setConsultationFee(updates.get("consultationFee") != null ? updates.get("consultationFee").toString() : "");
        if (updates.containsKey("workingDays")) doctor.setWorkingDays((String) updates.get("workingDays"));
        if (updates.containsKey("consultationTimings")) doctor.setConsultationTimings((String) updates.get("consultationTimings"));
        if (updates.containsKey("onlineConsultation")) doctor.setOnlineConsultation((Boolean) updates.get("onlineConsultation"));

        // Direct Payment Details
        if (updates.containsKey("clinicAddress")) doctor.setClinicAddress((String) updates.get("clinicAddress"));
        if (updates.containsKey("razorpayAccountId")) doctor.setRazorpayAccountId((String) updates.get("razorpayAccountId"));
        if (updates.containsKey("upiId")) doctor.setUpiId((String) updates.get("upiId"));
        if (updates.containsKey("preferredPaymentMode")) doctor.setPreferredPaymentMode((String) updates.get("preferredPaymentMode"));
        if (updates.containsKey("appointmentsEnabled")) doctor.setAppointmentsEnabled((Boolean) updates.get("appointmentsEnabled"));
        
        if (updates.containsKey("onlineConsultationFee")) {
            Object fee = updates.get("onlineConsultationFee");
            if (fee != null && !fee.toString().trim().isEmpty()) {
                try {
                    doctor.setOnlineConsultationFee(Double.parseDouble(fee.toString().trim()));
                } catch (NumberFormatException e) {
                    System.err.println("DEBUG: Failed to parse onlineConsultationFee: " + fee);
                }
            }
        }
        if (updates.containsKey("offlineConsultationFee")) {
            Object fee = updates.get("offlineConsultationFee");
            if (fee != null && !fee.toString().trim().isEmpty()) {
                try {
                    doctor.setOfflineConsultationFee(Double.parseDouble(fee.toString().trim()));
                } catch (NumberFormatException e) {
                    System.err.println("DEBUG: Failed to parse offlineConsultationFee: " + fee);
                }
            }
        }

        if (doctor.getOnlineConsultationFee() == null) {
           String numeric = doctor.getConsultationFee().replaceAll("[^0-9]", "");
           if (!numeric.isEmpty()) {
               try { 
                   double val = Double.parseDouble(numeric);
                   doctor.setOnlineConsultationFee(val);
                   if (doctor.getOfflineConsultationFee() == null) {
                       doctor.setOfflineConsultationFee(val);
                   }
               } catch (Exception e) {}
           }
        }

        // New Professional & Clinical Fields
        if (updates.containsKey("medicalCouncil")) doctor.setMedicalCouncil((String) updates.get("medicalCouncil"));
        if (updates.containsKey("licenseExpiryDate")) doctor.setLicenseExpiryDate((String) updates.get("licenseExpiryDate"));
        if (updates.containsKey("registrationYear")) {
            Object regYear = updates.get("registrationYear");
            if (regYear != null && !regYear.toString().isEmpty()) {
                doctor.setRegistrationYear(Integer.parseInt(regYear.toString()));
            }
        }
        
        if (updates.containsKey("subSpecialties")) doctor.setSubSpecialties((String) updates.get("subSpecialties"));
        if (updates.containsKey("proceduresHandled")) doctor.setProceduresHandled((String) updates.get("proceduresHandled"));
        if (updates.containsKey("treatmentFocus")) doctor.setTreatmentFocus((String) updates.get("treatmentFocus"));
        if (updates.containsKey("languagesSpoken")) doctor.setLanguagesSpoken((String) updates.get("languagesSpoken"));
        if (updates.containsKey("publications")) doctor.setPublications((String) updates.get("publications"));
        
        if (updates.containsKey("slotDuration")) {
            Object duration = updates.get("slotDuration");
            if (duration != null && !duration.toString().isEmpty()) {
                doctor.setSlotDuration(Integer.parseInt(duration.toString()));
            }
        }
        if (updates.containsKey("maxPatientsPerDay")) {
            Object maxP = updates.get("maxPatientsPerDay");
            if (maxP != null && !maxP.toString().isEmpty()) {
                doctor.setMaxPatientsPerDay(Integer.parseInt(maxP.toString()));
            }
        }
        if (updates.containsKey("breakTimings")) doctor.setBreakTimings((String) updates.get("breakTimings"));

        return doctorRepository.save(doctor);
    }

    public void updateProfilePhoto(String username, org.springframework.web.multipart.MultipartFile photo) {
        Doctor doctor = getDoctorProfile(username);
        String photoUrl = supabaseStorageService.uploadFile(photo);
        if (photoUrl != null) {
            doctor.setProfilePictureUrl(photoUrl);
            doctorRepository.save(doctor);
        }
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public Patient getPatientByShortCode(String shortCode) {
        return patientRepository.findByPatientId(shortCode.toUpperCase().trim())
            .orElseThrow(() -> new RuntimeException("Patient with ID " + shortCode + " not found."));
    }

    public List<Doctor> searchDoctors(String query) {
        if (query == null || query.trim().isEmpty()) {
            return doctorRepository.findByApprovedTrue();
        }
        return doctorRepository.searchDoctors(query);
    }

    @org.springframework.transaction.annotation.Transactional
    public void unlockHistoryWithPasscode(String doctorUsername, String patientShortCode, String passcode) {
        Doctor doctor = getDoctorProfile(doctorUsername);
        Patient patient = patientRepository.findByPatientId(patientShortCode.toUpperCase().trim())
            .orElseThrow(() -> new RuntimeException("Patient with ID " + patientShortCode + " not found."));
        
        if (patient.getHistoryPasscode() == null || !patient.getHistoryPasscode().equals(passcode)) {
            throw new RuntimeException("Invalid Clinical Passcode. Access Denied.");
        }

        // Link the doctor and patient immediately
        patient.getDoctors().add(doctor);
        patientRepository.save(patient);

        // Also update/create access request to APPROVED state
        AccessRequest req = accessRequestRepository.findByDoctorAndPatient(doctor, patient)
            .orElse(new AccessRequest());
        req.setDoctor(doctor);
        req.setPatient(patient);
        req.setStatus("ACCEPTED");
        accessRequestRepository.save(req);

        // Security Logging
        auditLogService.log(
            doctor.getUser().getId(),
            doctor.getName(),
            "VAULT_UNLOCK",
            patient.getId(),
            "Doctor unlocked clinical vault using direct passcode"
        );

        // Notify Patient
        notificationService.sendNotification(
            patient.getUser().getId(),
            "SECURITY",
            "Vault Unlocked via Passcode",
            "Dr. " + doctor.getName() + " has accessed your full clinical history using your direct passcode.",
            "/dashboard/history",
            "View Access Log"
        );
    }
}
