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

    public DoctorService(DoctorRepository doctorRepository, UserRepository userRepository,
                         PatientRepository patientRepository, MedicalRecordRepository recordRepository,
                         ReportRepository reportRepository, AccessRequestRepository accessRequestRepository,
                         SupabaseStorageService supabaseStorageService) {
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.recordRepository = recordRepository;
        this.reportRepository = reportRepository;
        this.accessRequestRepository = accessRequestRepository;
        this.supabaseStorageService = supabaseStorageService;
    }

    public Doctor getDoctorProfile(String username) {
        User user = userRepository.findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return doctorRepository.findByUserId(user.getId())
            .orElseThrow(() -> new RuntimeException("Doctor profile not found. Please complete your registration."));
    }

    public List<Patient> getLinkedPatients(String doctorUsername) {
        Doctor doctor = getDoctorProfile(doctorUsername);
        return patientRepository.findAll().stream()
            .filter(patient -> patient.getDoctors().stream()
                .anyMatch(d -> d.getId().equals(doctor.getId())))
            .toList();
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
            if ("REJECTED".equals(existing.getStatus())) {
                existing.setStatus("PENDING");
                accessRequestRepository.save(existing);
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
        }
    }

    private void verifyAccess(Doctor doctor, Long patientId) {
        Patient patient = patientRepository.findById(patientId)
            .orElseThrow(() -> new RuntimeException("Patient not found"));
        boolean isLinked = patient.getDoctors().stream()
            .anyMatch(d -> d.getId().equals(doctor.getId()));
        if (!isLinked) {
            throw new RuntimeException("Unauthorized Access: You are not authorized to view this patient's clinical telemetry.");
        }
    }

    public Patient getPatientById(String doctorUsername, Long id) {
        Doctor doctor = getDoctorProfile(doctorUsername);
        verifyAccess(doctor, id);
        return patientRepository.findById(id).get();
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

        return recordRepository.save(record);
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

        // AUTO-SYNC: If descriptive fee was updated but numeric tiers are missing/stale, attempt extraction
        if (doctor.getOnlineConsultationFee() == null || doctor.getOnlineConsultationFee() <= 1.0) {
           String numeric = doctor.getConsultationFee().replaceAll("[^0-9]", "");
           if (!numeric.isEmpty()) {
               try { 
                   double val = Double.parseDouble(numeric);
                   doctor.setOnlineConsultationFee(val);
                   if (doctor.getOfflineConsultationFee() == null || doctor.getOfflineConsultationFee() <= 1.0) {
                       doctor.setOfflineConsultationFee(val);
                   }
               } catch (Exception e) {}
           }
        }

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
}
