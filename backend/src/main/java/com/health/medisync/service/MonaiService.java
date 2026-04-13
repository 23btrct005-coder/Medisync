package com.health.medisync.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class MonaiService {

    @Value("${monai.service.url:http://localhost:8000}")
    private String monaiServiceUrl;

    public Map<String, Object> analyzeXray(byte[] fileData, String fileName) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = monaiServiceUrl + "/analyze-xray";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            // Create a resource from the byte array
            ByteArrayResource resource = new ByteArrayResource(fileData) {
                @Override
                public String getFilename() {
                    return fileName;
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", resource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                return (Map<String, Object>) response.getBody();
            }

        } catch (Exception e) {
            System.err.println("MONAI analysis failed: " + e.getMessage());
        }
        return null;
    }
}
