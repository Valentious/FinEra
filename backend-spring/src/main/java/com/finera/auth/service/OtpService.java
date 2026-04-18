package com.finera.auth.service;

import com.twilio.Twilio;
import com.twilio.rest.verify.v2.service.Verification;
import com.twilio.rest.verify.v2.service.VerificationCheck;
import jakarta.annotation.PostConstruct;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Email OTP: generated locally, stored 5 minutes, sent via SMTP.
 * SMS OTP: Twilio Verify sends the code; verification calls Twilio (no local SMS OTP store).
 */
@Service
public class OtpService {

    private static final int OTP_LENGTH = 6;
    private static final long OTP_TTL_SECONDS = 5 * 60;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final JavaMailSender mailSender;
    private final ConcurrentHashMap<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    @Value("${otp.mail.from}")
    private String mailFrom;

    @Value("${otp.twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${otp.twilio.auth-token:}")
    private String twilioAuthToken;

    /** Verify API Service SID (starts with {@code VA}). */
    @Value("${otp.twilio.verify-service-sid:}")
    private String twilioVerifyServiceSid;

    public OtpService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @PostConstruct
    void initTwilio() {
        if (twilioAccountSid != null && !twilioAccountSid.isBlank()
                && twilioAuthToken != null && !twilioAuthToken.isBlank()) {
            Twilio.init(twilioAccountSid.trim(), twilioAuthToken.trim());
        }
    }

    /**
     * Generates a cryptographically strong 6-digit numeric OTP (100000–999999).
     */
    public String generateOtp() {
        return String.format(Locale.ROOT, "%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    public void sendOtp(String rawRecipient, String type) {
        String recipient = rawRecipient == null ? "" : rawRecipient.trim();
        if (recipient.isEmpty()) {
            throw new IllegalArgumentException("recipient is required");
        }
        String channel = type == null ? "" : type.trim().toLowerCase(Locale.ROOT);
        if (!"email".equals(channel) && !"sms".equals(channel)) {
            throw new IllegalArgumentException("type must be 'email' or 'sms'");
        }

        if ("email".equals(channel)) {
            String code = generateOtp();
            String key = storageKey("email", recipient);
            otpStore.put(key, new OtpEntry(code, Instant.now().plusSeconds(OTP_TTL_SECONDS)));
            sendEmailOtp(recipient, code);
        } else {
            sendSmsViaTwilioVerify(recipient);
        }
    }

    public boolean verifyOtp(String rawRecipient, String rawOtp) {
        String recipient = rawRecipient == null ? "" : rawRecipient.trim();
        String otp = rawOtp == null ? "" : rawOtp.trim();
        if (recipient.isEmpty() || otp.length() != OTP_LENGTH) {
            return false;
        }

        if (looksLikeEmail(recipient)) {
            return verifyFromLocalStore(recipient, otp);
        }
        return verifyTwilioVerify(recipient, otp);
    }

    private static boolean looksLikeEmail(String recipient) {
        int at = recipient.indexOf('@');
        return at > 0 && at < recipient.length() - 1;
    }

    private boolean verifyFromLocalStore(String recipient, String otp) {
        String key = storageKey("email", recipient);
        OtpEntry entry = otpStore.get(key);
        if (entry == null) {
            return false;
        }
        if (Instant.now().isAfter(entry.expiresAt())) {
            otpStore.remove(key, entry);
            return false;
        }
        if (constantTimeEquals(entry.code(), otp)) {
            otpStore.remove(key, entry);
            return true;
        }
        return false;
    }

    private boolean verifyTwilioVerify(String recipient, String otp) {
        ensureTwilioVerifyConfigured();
        try {
            VerificationCheck check = VerificationCheck.creator(twilioVerifyServiceSid.trim())
                    .setTo(recipient)
                    .setCode(otp)
                    .create();
            return "approved".equalsIgnoreCase(check.getStatus());
        } catch (Exception e) {
            return false;
        }
    }

    private void sendEmailOtp(String toEmail, String code) throws RuntimeException {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(toEmail);
            helper.setSubject("Your verification code");
            helper.setText(buildEmailBody(code), false);
            mailSender.send(message);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to send email OTP: " + e.getMessage(), e);
        }
    }

    private void sendSmsViaTwilioVerify(String toE164) {
        ensureTwilioVerifyConfigured();
        try {
            Verification.creator(twilioVerifyServiceSid.trim(), toE164, "sms").create();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to start SMS verification: " + e.getMessage(), e);
        }
    }

    private void ensureTwilioVerifyConfigured() {
        if (twilioAccountSid == null || twilioAccountSid.isBlank()
                || twilioAuthToken == null || twilioAuthToken.isBlank()
                || twilioVerifyServiceSid == null || twilioVerifyServiceSid.isBlank()) {
            throw new IllegalStateException(
                    "Twilio Verify is not configured (otp.twilio.account-sid, otp.twilio.auth-token, otp.twilio.verify-service-sid)");
        }
    }

    private static String buildEmailBody(String code) {
        return """
                Hello,

                Your verification code is: %s

                This code expires in 5 minutes. If you did not request this, you can ignore this email.

                — FinEra
                """.formatted(code);
    }

    /**
     * Normalizes storage key so the same logical recipient maps to one slot per channel.
     */
    private static String storageKey(String channel, String recipient) {
        if ("email".equals(channel)) {
            return channel + ":" + recipient.toLowerCase(Locale.ROOT);
        }
        return channel + ":" + recipient.replaceAll("\\s+", "");
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null || a.length() != b.length()) {
            return false;
        }
        int r = 0;
        for (int i = 0; i < a.length(); i++) {
            r |= a.charAt(i) ^ b.charAt(i);
        }
        return r == 0;
    }

    private record OtpEntry(String code, Instant expiresAt) {
    }
}
