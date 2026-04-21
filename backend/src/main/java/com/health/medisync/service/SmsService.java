package com.health.medisync.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class SmsService {

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
            System.out.println("[SMS SERVICE] Twilio Initialized for SMS Alerts.");
        }
    }

    private boolean isConfigured() {
        return accountSid != null && !accountSid.isEmpty() && !accountSid.contains("YOUR_") &&
               authToken != null && !authToken.isEmpty() && !authToken.contains("YOUR_");
    }

    @Async
    public void sendSms(String toPhoneNumber, String content) {
        if (toPhoneNumber == null || toPhoneNumber.trim().isEmpty()) {
            return;
        }

        // Standardize phone number
        String cleanPhone = toPhoneNumber.replaceAll("[^0-9+]", "");
        if (!cleanPhone.startsWith("+")) {
            cleanPhone = "+" + cleanPhone;
        }

        if (isConfigured()) {
            try {
                Message message = Message.creator(
                        new PhoneNumber(cleanPhone),
                        new PhoneNumber(fromNumber),
                        content
                ).create();
                System.out.println("[SMS DISPATCH] Sent via Twilio. SID: " + message.getSid());
            } catch (Exception e) {
                System.err.println("[SMS DISPATCH] Twilio Error: " + e.getMessage());
            }
        } else {
            System.out.println("=================================================");
            System.out.println("[SMS MOCK MODE] To: " + cleanPhone);
            System.out.println("[SMS MOCK MODE] Content: " + content);
            System.out.println("=================================================");
        }
    }
}
