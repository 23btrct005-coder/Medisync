package com.health.medisync.service;

import com.health.medisync.model.Telemetry;
import com.health.medisync.repository.TelemetryRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TelemetryService {
    private final TelemetryRepository telemetryRepository;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    public TelemetryService(TelemetryRepository telemetryRepository, 
                            org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate) {
        this.telemetryRepository = telemetryRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastVitalUpdate(String username, Telemetry telemetry) {
        messagingTemplate.convertAndSendToUser(username, "/queue/vitals", telemetry);
    }

    public Telemetry saveTelemetry(String username, Telemetry telemetry) {
        // Find patient
        // Note: we might need a PatientRepository here or pass it in. 
        // Let's assume the controller handles the model resolution if needed, 
        // but it's cleaner to do it in service.
        return telemetryRepository.save(telemetry);
    }

    public List<Telemetry> getPatientTelemetry(Long patientId) {
        return telemetryRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }
}
