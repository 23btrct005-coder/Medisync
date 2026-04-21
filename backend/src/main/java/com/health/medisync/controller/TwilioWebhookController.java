package com.health.medisync.controller;

import com.health.medisync.model.Appointment;
import com.health.medisync.model.Patient;
import com.health.medisync.model.Report;
import com.health.medisync.repository.AppointmentRepository;
import com.health.medisync.repository.PatientRepository;
import com.health.medisync.repository.ReportRepository;
import com.twilio.twiml.MessagingResponse;
import com.twilio.twiml.messaging.Body;
import com.twilio.twiml.messaging.Message;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Optional;

@RestController
@RequestMapping("/api/twilio")
public class TwilioWebhookController {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final ReportRepository reportRepository;

    public TwilioWebhookController(PatientRepository patientRepository,
                                   AppointmentRepository appointmentRepository,
                                   ReportRepository reportRepository) {
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
        this.reportRepository = reportRepository;
    }

    @PostMapping(value = "/sms", produces = "application/xml")
    public String handleIncomingSms(
            @RequestParam("From") String from,
            @RequestParam("Body") String body) {

        String phoneNumber = from.trim();
        String text = body.trim();

        // Find patient by phone (handles various formats)
        Optional<Patient> patientOpt = patientRepository.findAll().stream()
                .filter(p -> p.getPhone() != null && p.getPhone().replaceAll("[^0-9]", "").contains(phoneNumber.replaceAll("[^0-9]", "")))
                .findFirst();

        if (patientOpt.isEmpty()) {
            return generateTwiMLResponse("MediSync Error: Phone number not registered. Please register at medisync.com");
        }

        Patient patient = patientOpt.get();
        String responseText;

        // Simple Keyword Logic
        if (text.equalsIgnoreCase("MENU") || text.isEmpty()) {
            responseText = "Welcome to MediSync, " + patient.getName() + "!\n" +
                           "Reply with:\n" +
                           "1. Next Appointment\n" +
                           "2. Latest Report\n" +
                           "3. Emergency Info";
        } else {
            switch (text) {
                case "1":
                    Optional<Appointment> nextAppt = appointmentRepository.findTopByPatientIdAndAppointmentDateGreaterThanEqualOrderByAppointmentDateAsc(patient.getId(), LocalDate.now());
                    responseText = nextAppt.map(a -> "Next Appointment:\nDr. " + a.getDoctor().getName() + "\nDate: " + a.getAppointmentDate() + "\nTime: " + a.getTimeSlot())
                                         .orElse("No upcoming appointments found.");
                    break;
                case "2":
                    Optional<Report> lastReport = reportRepository.findTopByPatientIdOrderByDocumentDateDesc(patient.getId());
                    responseText = lastReport.map(r -> "Last Report (" + r.getDocumentDate() + "):\n" + (r.getAiSummary() != null ? "Clinical Insight Ready" : "Analysis Pending"))
                                           .orElse("No medical reports found.");
                    break;
                case "3":
                    responseText = "Emergency Briefing:\n" +
                                   "Blood: " + (patient.getBloodGroup() != null ? patient.getBloodGroup() : "Unknown") + "\n" +
                                   "Allergies: " + (patient.getAllergies() != null ? patient.getAllergies() : "None") + "\n" +
                                   "Conditions: " + (patient.getExistingDiseases() != null ? patient.getExistingDiseases() : "None");
                    break;
                default:
                    responseText = "Invalid choice. Text 'MENU' to see options.";
            }
        }

        return generateTwiMLResponse(responseText);
    }

    private String generateTwiMLResponse(String message) {
        return new MessagingResponse.Builder()
                .message(new Message.Builder()
                        .body(new Body.Builder(message).build())
                        .build())
                .build()
                .toXml();
    }
}
