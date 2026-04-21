package com.health.medisync.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Call;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.net.URI;

@Service
public class VoiceService {

    @Value("${twilio.account.sid:}")
    private String accountSid;

    @Value("${twilio.auth.token:}")
    private String authToken;

    @Value("${twilio.phone.number:}")
    private String fromNumber;

    @PostConstruct
    public void initTwilio() {
        if (isConfigured()) {
            Twilio.init(accountSid, authToken);
            System.out.println("[VOICE SERVICE] Twilio Initialized Successfully.");
        } else {
            System.err.println("[VOICE SERVICE] WARNING: Twilio credentials missing. Operating in Mock Mode.");
        }
    }

    private boolean isConfigured() {
        return accountSid != null && !accountSid.isEmpty() && !accountSid.contains("YOUR_") &&
               authToken != null && !authToken.isEmpty() && !authToken.contains("YOUR_");
    }

    @Async
    public void initiateVoiceAlert(String toPhoneNumber, String message) {
        if (toPhoneNumber == null || toPhoneNumber.trim().isEmpty()) {
            return;
        }

        // Standardize phone number
        String cleanPhone = toPhoneNumber.replaceAll("[^0-9+]", "");
        if (!cleanPhone.startsWith("+")) {
            cleanPhone = "+" + cleanPhone;
        }
        
        System.out.println("=================================================");
        System.out.println("[VOICE DISPATCH] To: " + cleanPhone);
        
        if (isConfigured()) {
            try {
                // For a trial account, we use a simple TwiML URL or a hosted XML
                // Since we don't have a public URL for this local dev, we use Twilio's Echo/Alice TwiML
                String twiml = "<Response><Say voice='alice'>Hello, this is your clinical update from MediSync. " + message + ". Stay healthy.</Say></Response>";
                
                Call call = Call.creator(
                    new PhoneNumber(cleanPhone),
                    new PhoneNumber(fromNumber),
                    new com.twilio.type.Twiml(twiml)
                ).create();
                
                System.out.println("[VOICE DISPATCH] STATUS: CALL INITIATED (Twilio SID: " + call.getSid() + ")");
            } catch (Exception e) {
                System.err.println("[VOICE DISPATCH] FATAL ERROR: " + e.getMessage());
            }
        } else {
            System.out.println("[VOICE DISPATCH] Message: " + message);
            System.out.println("[VOICE DISPATCH] STATUS: MOCK MODE");
        }
        System.out.println("=================================================");
    }
}
