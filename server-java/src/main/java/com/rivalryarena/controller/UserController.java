package com.rivalryarena.controller;

import com.rivalryarena.model.RivalryTitle;
import com.rivalryarena.model.User;
import com.rivalryarena.service.DataStoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private DataStoreService dataStore;

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserProfile(@PathVariable String id) {
        Optional<User> userOpt = dataStore.findUserById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();
        List<RivalryTitle> titles = dataStore.findTitlesForUser(id);

        Map<String, Object> res = new HashMap<>();
        res.put("user", user);
        res.put("activeTitles", titles);
        return ResponseEntity.ok(res);
    }
}
