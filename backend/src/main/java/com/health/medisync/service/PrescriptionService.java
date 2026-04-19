package com.health.medisync.service;

import com.health.medisync.model.Prescription;
import com.health.medisync.model.Patient;
import com.health.medisync.model.Doctor;
import com.health.medisync.repository.PrescriptionRepository;
import com.health.medisync.repository.PatientRepository;
import com.health.medisync.repository.DoctorRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PrescriptionService {
    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final NotificationService notificationService;

    public PrescriptionService(PrescriptionRepository prescriptionRepository, 
                               PatientRepository patientRepository,
                               DoctorRepository doctorRepository,
                               NotificationService notificationService) {
        this.prescriptionRepository = prescriptionRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.notificationService = notificationService;
    }

    public Prescription createPrescription(String doctorUsername, Long patientId, Prescription prescriptionData) {
        Doctor doctor = doctorRepository.findByEmail(doctorUsername)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        prescriptionData.setDoctor(doctor);
        prescriptionData.setPatient(patient);
        
        Prescription saved = prescriptionRepository.save(prescriptionData);

        // Notify Patient
        notificationService.sendNotification(
            patient.getUser().getId(),
            "APPOINTMENT",
            "New Prescription Issued",
            "Dr. " + doctor.getName() + " has issued a new prescription following your consultation.",
            "/dashboard/records",
            "View Prescription"
        );

        // If follow-up date exists, send an immediate acknowledgment (future: schedule a reminder)
        if (saved.getFollowUpDate() != null) {
            notificationService.sendNotification(
                patient.getUser().getId(),
                "APPOINTMENT",
                "Follow-up Scheduled",
                "Please remember to schedule a follow-up for " + saved.getFollowUpDate() + ".",
                "/dashboard/booking",
                "Book Follow-up"
            );
        }

        return saved;
    }

    public List<Prescription> getPatientPrescriptions(Long patientId) {
        return prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    public List<Prescription> getMyPrescriptions(String rawEmail) {
        final String email = (rawEmail != null) ? rawEmail.trim().toLowerCase() : null;
        System.out.println("DEBUG: Fetching prescriptions for user: " + email);
        Patient patient = patientRepository.findByUserUsernameIgnoreCase(email).orElse(null);
        if (patient == null) {
            System.err.println("WARNING: No patient profile found for prescription fetch: " + email);
            return List.of();
        }
        return prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId());
    }
}
