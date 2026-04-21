package com.health.medisync.controller;

import com.health.medisync.model.Appointment;
import com.health.medisync.model.Patient;
import com.health.medisync.model.Report;
import com.health.medisync.repository.AppointmentRepository;
import com.health.medisync.repository.PatientRepository;
import com.health.medisync.repository.ReportRepository;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.Optional;

@RestController
@RequestMapping("/api/ussd")
@CrossOrigin(origins = "*", maxAge = 3600)
public class UssdController {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final ReportRepository reportRepository;

    public UssdController(PatientRepository patientRepository, 
                          AppointmentRepository appointmentRepository, 
                          ReportRepository reportRepository) {
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.reportRepository = reportRepository;
    }

    @PostMapping(value = "", produces = "text/plain")
    public String handleUssdRequest(
            @RequestParam String sessionId,
            @RequestParam String phoneNumber,
            @RequestParam(required = false, defaultValue = "") String text) {

        Optional<Patient> patientOpt = patientRepository.findByUserUsernameIgnoreCase(phoneNumber.trim());
        // Fallback: Check 'phone' field if username isn't the phone
        if (patientOpt.isEmpty()) {
            patientOpt = patientRepository.findAll().stream()
                .filter(p -> p.getPhone() != null && p.getPhone().replaceAll("[^0-9]", "").contains(phoneNumber.replaceAll("[^0-9]", "")))
                .findFirst();
        }

        if (patientOpt.isEmpty()) {
            return "END MediSync Error: Phone number not registered. Please register at medisync.com";
        }

        Patient patient = patientOpt.get();
        String[] levels = text.split("\\*");
        String currentLevel = (text.isEmpty()) ? "" : levels[0];

        if (text.isEmpty()) {
            return "CON Welcome to MediSync, " + patient.getName() + "\n" +
                   "1. Next Appointment\n" +
                   "2. Latest Report Summary\n" +
                   "3. Emergency Info";
        }

        switch (currentLevel) {
            case "1":
                Optional<Appointment> nextAppt = appointmentRepository.findTopByPatientIdAndAppointmentDateGreaterThanEqualOrderByAppointmentDateAsc(patient.getId(), LocalDate.now());
                if (nextAppt.isPresent()) {
                    Appointment a = nextAppt.get();
                    return "END Next Appointment:\n" +
                           "Dr. " + a.getDoctor().getName() + "\n" +
                           "Date: " + a.getAppointmentDate() + "\n" +
                           "Time: " + a.getTimeSlot();
                }
                return "END No upcoming appointments found.";

            case "2":
                Optional<Report> lastReport = reportRepository.findTopByPatientIdOrderByDocumentDateDesc(patient.getId());
                if (lastReport.isPresent()) {
                    Report r = lastReport.get();
                    String summary = r.getAiSummary();
                    if (summary != null && summary.length() > 100) {
                        summary = summary.substring(0, 100) + "...";
                    }
                    return "END Last Report (" + r.getDocumentDate() + "):\n" + (summary != null ? "Clinical Insight Generated" : "Analysis Pending");
                }
                return "END No medical reports found in your archive.";

            case "3":
                return "END Emergency Briefing:\n" +
                       "Blood: " + (patient.getBloodGroup() != null ? patient.getBloodGroup() : "Unknown") + "\n" +
                       "Allergies: " + (patient.getAllergies() != null ? patient.getAllergies() : "None") + "\n" +
                       "Conditions: " + (patient.getExistingDiseases() != null ? patient.getExistingDiseases() : "None");

            default:
                return "END Invalid Selection. Please dial again.";
        }
    }
}
