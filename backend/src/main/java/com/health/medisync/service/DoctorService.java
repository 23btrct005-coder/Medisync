package com.health.medisync.service;

import com.health.medisync.model.Doctor;
import com.health.medisync.model.Patient;
import com.health.medisync.model.User;
import com.health.medisync.model.MedicalRecord;
import com.health.medisync.model.MedicalRecordRequest;
import com.health.medisync.repository.DoctorRepository;
import com.health.medisync.repository.UserRepository;
import com.health.medisync.repository.PatientRepository;
import com.health.medisync.repository.MedicalRecordRepository;
import com.health.medisync.model.Report;
import com.health.medisync.model.AccessRequest;
import com.health.medisync.repository.ReportRepository;
import com.health.medisync.repository.AccessRequestRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DoctorService {
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final MedicalRecordRepository recordRepository;
    private final ReportRepository reportRepository;
    private final AccessRequestRepository accessRequestRepository;

    public DoctorService(DoctorRepository doctorRepository, UserRepository userRepository,
                         PatientRepository patientRepository, MedicalRecordRepository recordRepository,
                         ReportRepository reportRepository, AccessRequestRepository accessRequestRepository) {
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.recordRepository = recordRepository;
        this.reportRepository = reportRepository;
        this.accessRequestRepository = accessRequestRepository;
    }

    public Doctor getDoctorProfile(String username) {
        User user = userRepository.findByUsername(username)
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
        Patient patient = patientRepository.findByEmail(patientEmail)
            .orElseThrow(() -> new RuntimeException("Patient with email " + patientEmail + " not found"));
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

    public Patient getPatientById(Long id) {
        return patientRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Patient not found"));
    }

    public List<MedicalRecord> getPatientRecords(Long patientId) {
        return recordRepository.findByPatientId(patientId);
    }

    public List<Report> getPatientReports(Long patientId) {
        return reportRepository.findByPatientId(patientId);
    }

    public List<AccessRequest> getDoctorRequests(String doctorUsername) {
        Doctor doctor = getDoctorProfile(doctorUsername);
        return accessRequestRepository.findByDoctor(doctor);
    }

    public MedicalRecord addMedicalRecord(String doctorUsername, Long patientId, MedicalRecordRequest request) {
        Doctor doctor = getDoctorProfile(doctorUsername);
        Patient patient = getPatientById(patientId);

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
            if (exp != null) {
                if (exp instanceof Number) {
                    doctor.setYearsOfExperience(((Number) exp).intValue());
                } else {
                    try {
                        doctor.setYearsOfExperience(Integer.parseInt(exp.toString()));
                    } catch (Exception e) {}
                }
            }
        }
        
        if (updates.containsKey("consultationFee")) doctor.setConsultationFee((String) updates.get("consultationFee"));
        if (updates.containsKey("workingDays")) doctor.setWorkingDays((String) updates.get("workingDays"));
        if (updates.containsKey("consultationTimings")) doctor.setConsultationTimings((String) updates.get("consultationTimings"));
        if (updates.containsKey("onlineConsultation")) doctor.setOnlineConsultation((Boolean) updates.get("onlineConsultation"));

        return doctorRepository.save(doctor);
    }
}
