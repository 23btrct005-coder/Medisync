package com.health.medisync.controller;

import com.health.medisync.model.MedicalRecord;
import com.health.medisync.service.MedicalRecordService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/records")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MedicalRecordController {

    private final MedicalRecordService recordService;

    public MedicalRecordController(MedicalRecordService recordService) {
        this.recordService = recordService;
    }

    @GetMapping("/my-records")
    public ResponseEntity<List<MedicalRecord>> getMyRecords(
            Authentication authentication,
            @RequestParam(required = false) String search) {
        String username = authentication.getName();
        return ResponseEntity.ok(recordService.getMyRecords(username, search));
    }
}
