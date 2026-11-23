package com.rivalryarena.controller;

import com.rivalryarena.config.JwtUtil;
import com.rivalryarena.model.User;
import com.rivalryarena.service.DataStoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private DataStoreService dataStore;

    @Autowired
    private JwtUtil jwtUtil;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping("/guest")
    public ResponseEntity<?> createGuest(@RequestBody(required = false) Map<String, String> body) {
        String deviceToken = body != null ? body.get("deviceToken") : null;
        if (deviceToken == null || deviceToken.isEmpty()) {
            deviceToken = UUID.randomUUID().toString();
        }

        String suffix = UUID.randomUUID().toString().substring(0, 4);
        String username = "Guest_" + suffix;
        String userId = "guest_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);

        User guest = new User(userId, username, true);
        guest.setDeviceToken(deviceToken);
        dataStore.saveUser(guest);

        String token = jwtUtil.generateToken(guest.getId(), guest.getUsername());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("deviceToken", deviceToken);
        response.put("user", guest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || username.trim().isEmpty() || password == null || password.length() < 3) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username and password (min 3 chars) required"));
        }

        if (dataStore.findUserByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already taken"));
        }

        String userId = "user_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        User user = new User(userId, username.trim(), false);
        user.setPasswordHash(passwordEncoder.encode(password));
        dataStore.saveUser(user);

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        return ResponseEntity.ok(Map.of("token", token, "user", user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username and password required"));
        }

        Optional<User> userOpt = dataStore.findUserByUsername(username);
        if (userOpt.isEmpty() || userOpt.get().getPasswordHash() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        return ResponseEntity.ok(Map.of("token", token, "user", user));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid or expired token"));
        }

        String userId = jwtUtil.getUserIdFromToken(token);
        Optional<User> userOpt = dataStore.findUserById(userId);
        return userOpt.<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "User not found")));
    }
}
