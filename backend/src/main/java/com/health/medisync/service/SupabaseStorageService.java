package com.health.medisync.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import com.health.medisync.controller.PinpointDiagnosticController;
import java.io.StringWriter;
import java.io.PrintWriter;

import java.util.UUID;

@Service
public class SupabaseStorageService {

    @Value("${supabase.url:https://bwjmzottkkxrdztqqeju.supabase.co}")
    private String supabaseUrl;

    @Value("${supabase.key:${SUPABASE_SERVICE_ROLE_KEY:}}")
    private String supabaseKey;

    @Value("${supabase.bucket:profile-photos}")
    private String bucketName;

    private final RestTemplate restTemplate = new RestTemplate();

    public String uploadFile(MultipartFile file) {
        System.out.println("DEBUG: Initiating Supabase upload to bucket: " + bucketName);
        if (supabaseKey == null || supabaseKey.isEmpty()) {
            String err = "CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment.";
            System.err.println(err);
            PinpointDiagnosticController.setLastError("STORAGE_INIT_ERROR: " + err);
            return null;
        }

        try {
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename().replaceAll("\\s+", "_");
            String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + fileName;
            System.out.println("DEBUG: Target upload URL: " + uploadUrl);

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.setContentType(MediaType.valueOf(file.getContentType()));

            HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);

            ResponseEntity<String> response = restTemplate.exchange(
                uploadUrl,
                HttpMethod.POST,
                entity,
                String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                return supabaseUrl + "/storage/v1/object/public/" + bucketName + "/" + fileName;
            } else {
                String err = "ERROR: Supabase upload failed. Status: " + response.getStatusCode() + " Body: " + response.getBody();
                System.err.println(err);
                PinpointDiagnosticController.setLastError("STORAGE_API_REJECTED: " + err);
                return null;
            }
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String err = "ERROR: Supabase API Error. Status: " + e.getStatusCode() + " Body: " + e.getResponseBodyAsString();
            System.err.println(err);
            PinpointDiagnosticController.setLastError("STORAGE_HTTP_ERROR: " + err);
            return null;
        } catch (Exception e) {
            StringWriter sw = new StringWriter();
            e.printStackTrace(new PrintWriter(sw));
            PinpointDiagnosticController.setLastError("STORAGE_EXCEPTION: " + sw.toString());
            System.err.println("ERROR: Supabase Storage exception: " + e.getMessage());
            return null;
        }
    }
}
