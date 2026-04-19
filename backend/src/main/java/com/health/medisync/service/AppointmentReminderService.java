package com.health.medisync.service;

import com.health.medisync.model.Appointment;
import com.health.medisync.repository.AppointmentRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
public class AppointmentReminderService {

    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;

    public AppointmentReminderService(AppointmentRepository appointmentRepository, NotificationService notificationService) {
        this.appointmentRepository = appointmentRepository;
        this.notificationService = notificationService;
    }

    // Run every minute
    @Scheduled(fixedRate = 60000)
    public void checkAndNotifyUpcomingAppointments() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        
        List<Appointment> todayAppointments = appointmentRepository.findByAppointmentDate(today);
        
        for (Appointment appt : todayAppointments) {
            // Only process ONLINE bookings that haven't been notified yet
            if (appt.getConsultationType() == Appointment.ConsultationType.ONLINE && 
                appt.getStatus() == Appointment.AppointmentStatus.BOOKED && 
                !appt.isMeetNotified() && 
                appt.getMeetLink() != null) {
                
                try {
                    LocalTime apptTime = parseTimeSlot(appt.getTimeSlot());
                    
                    // Check if appointment is starting in 4-6 minutes
                    // We use a window to account for small runtime variations
                    if (apptTime != null && now.plusMinutes(6).isAfter(apptTime) && now.plusMinutes(4).isBefore(apptTime)) {
                        sendReminders(appt);
                    }
                } catch (Exception e) {
                    System.err.println("Error processing reminder for appointment " + appt.getId() + ": " + e.getMessage());
                }
            }
        }
    }

    private void sendReminders(Appointment appt) {
        String title = "Appointment Starting Soon!";
        String description = "Your virtual consultation with Dr. " + appt.getDoctor().getName() + " starts in 5 minutes.";
        String actionText = "Join Meeting";
        String actionLink = appt.getMeetLink();

        // Notify Patient
        notificationService.sendNotification(
            appt.getPatient().getUser().getId(),
            "MEET_REMINDER",
            title,
            description,
            actionLink,
            actionText
        );

        // Notify Doctor
        notificationService.sendNotification(
            appt.getDoctor().getUser().getId(),
            "MEET_REMINDER",
            "Consultation Starting",
            "Your appointment with " + appt.getPatient().getName() + " starts in 5 minutes.",
            actionLink,
            actionText
        );

        // Mark as notified
        appt.setMeetNotified(true);
        appointmentRepository.save(appt);
        
        System.out.println("DEBUG: Sent 5-minute meeting reminders for appointment ID: " + appt.getId());
    }

    private LocalTime parseTimeSlot(String slot) {
        if (slot == null) return null;
        try {
            // Standard format: "10:00 AM"
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);
            return LocalTime.parse(slot.trim().toUpperCase(), formatter);
        } catch (Exception e) {
            // Fallback for different formats if necessary
            return null;
        }
    }
}
