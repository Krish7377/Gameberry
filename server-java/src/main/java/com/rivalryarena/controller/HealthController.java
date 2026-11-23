package com.rivalryarena.controller;

import com.rivalryarena.service.DataStoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@CrossOrigin(origins = "*")
public class HealthController {

    @Autowired
    private DataStoreService dataStore;

    @GetMapping
    public ResponseEntity<?> checkHealth() {
        Map<String, Object> res = new HashMap<>();
        res.put("status", "ok");
        res.put("serverTime", System.currentTimeMillis());
        res.put("mongoConnected", dataStore.isMongoConnected());
        res.put("backend", "Java 17 Spring Boot 3 (Academic DSA Engine)");
        return ResponseEntity.ok(res);
    }
}
