package com.health.medisync.service;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Bucket;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.StorageClient;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class FirebaseStorageService {

    public String uploadFile(MultipartFile file, String folder) throws IOException {
        if (FirebaseApp.getApps().isEmpty()) {
            return null; // Firebase not initialized
        }

        String fileName = folder + "/" + UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Bucket bucket = StorageClient.getInstance().getBucket();
        
        // Upload file
        Blob blob = bucket.create(fileName, file.getBytes(), file.getContentType());
        
        // Generate a public URL (Valid for 1 year for simplicity)
        return blob.signUrl(365, TimeUnit.DAYS).toString();
    }

    public void deleteFile(String fileUrl) {
        if (FirebaseApp.getApps().isEmpty() || fileUrl == null || fileUrl.isEmpty()) {
            return;
        }

        try {
            // Extract path from signed URL if possible, or just ignore if it's a direct URL
            // This is a simplistic deletion. For production, you'd want better path parsing.
            String bucketName = StorageClient.getInstance().getBucket().getName();
            if (fileUrl.contains(bucketName)) {
                String path = fileUrl.split(bucketName + "/")[1].split("\\?")[0];
                StorageClient.getInstance().getBucket().get(path).delete();
            }
        } catch (Exception e) {
            System.err.println("WARNING: Could not delete old Firebase file: " + e.getMessage());
        }
    }
}
