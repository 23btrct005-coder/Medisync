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
            .orElseThrow(() -> new RuntimeException("Doctor profile not found"));
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

        if (accessRequestRepository.findByDoctorAndPatient(doctor, patient).isPresent()) {
            throw new RuntimeException("Request already exists");
        }

        AccessRequest req = new AccessRequest();
        req.setDoctor(doctor);
        req.setPatient(patient);
        req.setStatus("PENDING");
        accessRequestRepository.save(req);
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
}
