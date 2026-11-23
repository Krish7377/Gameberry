package com.rivalryarena.controller;

import com.rivalryarena.model.MatchRecord;
import com.rivalryarena.service.DataStoreService;
import com.rivalryarena.service.SeriesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/matches")
@CrossOrigin(origins = "*")
public class MatchController {

    @Autowired
    private SeriesService seriesService;

    @Autowired
    private DataStoreService dataStore;

    @PostMapping
    public ResponseEntity<?> recordMatch(@RequestBody MatchRecord match) {
        if (match == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Match payload missing"));
        }
        MatchRecord saved = seriesService.recordMatchResult(match);
        return ResponseEntity.ok(Map.of("match", saved));
    }

    @GetMapping
    public ResponseEntity<?> getMatches(@RequestParam(required = false) String userId) {
        if (userId == null || userId.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId query parameter required"));
        }
        List<MatchRecord> list = dataStore.findMatchesForUser(userId);
        return ResponseEntity.ok(Map.of("matches", list));
    }
}
