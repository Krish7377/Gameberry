package com.rivalryarena.controller;

import com.rivalryarena.model.LeaderboardEntry;
import com.rivalryarena.service.DataStoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaderboards")
@CrossOrigin(origins = "*")
public class LeaderboardController {

    @Autowired
    private DataStoreService dataStore;

    @GetMapping("/{board}")
    public ResponseEntity<?> getTop10(@PathVariable String board) {
        List<LeaderboardEntry> entries = dataStore.getTop10Leaderboard(board);
        Map<String, Object> res = new HashMap<>();
        res.put("board", board);
        res.put("entries", entries);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/{board}")
    public ResponseEntity<?> submitTime(@PathVariable String board, @RequestBody Map<String, Object> body) {
        String userId = (String) body.get("userId");
        String username = (String) body.get("username");
        Number timeNum = (Number) body.get("bestTime");

        if (username == null || timeNum == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "username and bestTime required"));
        }

        LeaderboardEntry entry = dataStore.submitLeaderboardTime(board, userId, username, timeNum.longValue());
        return ResponseEntity.ok(Map.of("board", board, "entry", entry));
    }
}
