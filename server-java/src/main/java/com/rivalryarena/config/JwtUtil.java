package com.rivalryarena.config;

import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

@Component
public class JwtUtil {

    private static final String SECRET = "rivalry-arena-secret-key-for-jwt-tokens-2026";
    private static final long EXPIRATION_MS = 30L * 24 * 60 * 60 * 1000; // 30 days

    private static final Base64.Encoder encoder = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder decoder = Base64.getUrlDecoder();

    public String generateToken(String userId, String username) {
        String header = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
        long exp = System.currentTimeMillis() + EXPIRATION_MS;
        String payload = String.format("{\"userId\":\"%s\",\"username\":\"%s\",\"exp\":%d}",
                escapeJson(userId), escapeJson(username), exp);

        String encodedHeader = encoder.encodeToString(header.getBytes(StandardCharsets.UTF_8));
        String encodedPayload = encoder.encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        String content = encodedHeader + "." + encodedPayload;
        String signature = sign(content, SECRET);

        return content + "." + signature;
    }

    public boolean validateToken(String token) {
        if (token == null || token.isEmpty()) return false;
        String[] parts = token.split("\\.");
        if (parts.length != 3) return false;

        String content = parts[0] + "." + parts[1];
        String expectedSignature = sign(content, SECRET);
        if (!MessageDigest.isEqual(parts[2].getBytes(StandardCharsets.UTF_8), expectedSignature.getBytes(StandardCharsets.UTF_8))) {
            return false;
        }

        try {
            String payloadJson = new String(decoder.decode(parts[1]), StandardCharsets.UTF_8);
            long exp = extractLong(payloadJson, "exp");
            return exp > System.currentTimeMillis();
        } catch (Exception e) {
            return false;
        }
    }

    public String getUserIdFromToken(String token) {
        try {
            String[] parts = token.split("\\.");
            String payloadJson = new String(decoder.decode(parts[1]), StandardCharsets.UTF_8);
            return extractString(payloadJson, "userId");
        } catch (Exception e) {
            return null;
        }
    }

    public String getUsernameFromToken(String token) {
        try {
            String[] parts = token.split("\\.");
            String payloadJson = new String(decoder.decode(parts[1]), StandardCharsets.UTF_8);
            return extractString(payloadJson, "username");
        } catch (Exception e) {
            return null;
        }
    }

    private String sign(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKey);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return encoder.encodeToString(hmacBytes);
        } catch (Exception e) {
            throw new RuntimeException("HMAC signing failed", e);
        }
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String extractString(String json, String key) {
        String pattern = "\"" + key + "\":\"";
        int start = json.indexOf(pattern);
        if (start == -1) return null;
        start += pattern.length();
        int end = json.indexOf("\"", start);
        return end != -1 ? json.substring(start, end) : null;
    }

    private long extractLong(String json, String key) {
        String pattern = "\"" + key + "\":";
        int start = json.indexOf(pattern);
        if (start == -1) return 0;
        start += pattern.length();
        int end = json.indexOf("}", start);
        int comma = json.indexOf(",", start);
        if (comma != -1 && comma < end) end = comma;
        return Long.parseLong(json.substring(start, end).trim());
    }
}
