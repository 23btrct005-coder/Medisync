package com.health.medisync.scheduler;

import com.health.medisync.model.Appointment;
import com.health.medisync.model.Appointment.AppointmentStatus;
import com.health.medisync.repository.AppointmentRepository;
import com.health.medisync.service.NotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Component
public class NotificationScheduler {

    private final AppointmentRepository appointmentRepository;
    private final NotificationService notificationService;
    private final DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);

    public NotificationScheduler(AppointmentRepository appointmentRepository, NotificationService notificationService) {
        this.appointmentRepository = appointmentRepository;
        this.notificationService = notificationService;
    }

    // Runs every 5 minutes
    @Scheduled(fixedRate = 300000)
    public void sendAppointmentReminders() {
        LocalDate today = LocalDate.now();
        LocalDateTime now = LocalDateTime.now();
        
        List<Appointment> todayAppointments = appointmentRepository.findByAppointmentDate(today);

        for (Appointment appt : todayAppointments) {
            if (appt.getStatus() != AppointmentStatus.BOOKED) continue;

            try {
                LocalTime apptTime = LocalTime.parse(appt.getTimeSlot(), timeFormatter);
                LocalDateTime apptDateTime = LocalDateTime.of(today, apptTime);

                long minutesUntil = java.time.Duration.between(now, apptDateTime).toMinutes();

                // If appointment is in 25-35 minutes, send reminder
                if (minutesUntil > 25 && minutesUntil <= 35) {
                    // Notify Patient
                    notificationService.sendNotification(
                        appt.getPatient().getUser().getId(),
                        "APPOINTMENT",
                        "Upcoming Session Reminder",
                        "Your clinical session with Dr. " + appt.getDoctor().getName() + " starts in 30 minutes.",
                        "/dashboard/sessions",
                        "View Session"
                    );

                    // Notify Doctor
                    notificationService.sendNotification(
                        appt.getDoctor().getUser().getId(),
                        "APPOINTMENT",
                        "Upcoming Patient Sync",
                        "You have a session with " + appt.getPatient().getName() + " starting in 30 minutes.",
                        "/doctor-dashboard",
                        "Open Dashboard"
                    );
                }
            } catch (Exception e) {
                System.err.println("Failed to parse/process reminder for appointment " + appt.getId() + ": " + e.getMessage());
            }
        }
    }
}
