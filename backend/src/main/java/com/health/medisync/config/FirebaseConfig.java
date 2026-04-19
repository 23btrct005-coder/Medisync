package com.health.medisync.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Base64;

@Configuration
public class FirebaseConfig {

    @Value("${FIREBASE_CONFIG_BASE64:}")
    private String firebaseConfigBase64;

    @Value("${FIREBASE_STORAGE_BUCKET:}")
    private String storageBucket;

    @PostConstruct
    public void initialize() {
        try {
            if (firebaseConfigBase64 == null || firebaseConfigBase64.isEmpty()) {
                System.err.println("WARNING: FIREBASE_CONFIG_BASE64 is missing. Firebase features will be disabled.");
                return;
            }

            byte[] decodedBytes = Base64.getDecoder().decode(firebaseConfigBase64);
            InputStream serviceAccount = new ByteArrayInputStream(decodedBytes);

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                    .setStorageBucket(storageBucket)
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("INFO: Firebase App has been initialized successfully.");
            }
        } catch (Exception e) {
            System.err.println("ERROR: Firebase initialization failed: " + e.getMessage());
        }
    }
}
