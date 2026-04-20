package com.health.medisync.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

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
        if (supabaseKey == null || supabaseKey.isEmpty()) {
            System.err.println("WARNING: SUPABASE_SERVICE_ROLE_KEY is missing. Storage upload skipped.");
            return null;
        }

        try {
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + fileName;

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
                // Return the public URL for the newly uploaded file
                return supabaseUrl + "/storage/v1/object/public/" + bucketName + "/" + fileName;
            } else {
                System.err.println("ERROR: Supabase upload failed with status: " + response.getStatusCode());
                return null;
            }
        } catch (Exception e) {
            System.err.println("ERROR: Supabase Storage exception: " + e.getMessage());
            return null;
        }
    }
}
