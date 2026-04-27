package com.health.medisync.service;

import com.health.medisync.model.Telemetry;
import com.health.medisync.repository.TelemetryRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TelemetryService {
    private final TelemetryRepository telemetryRepository;

    public TelemetryService(TelemetryRepository telemetryRepository) {
        this.telemetryRepository = telemetryRepository;
    }

    public List<Telemetry> getPatientTelemetry(Long patientId) {
        return telemetryRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }
}
