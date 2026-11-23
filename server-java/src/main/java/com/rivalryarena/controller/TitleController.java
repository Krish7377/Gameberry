package com.rivalryarena.controller;

import com.rivalryarena.model.RivalryTitle;
import com.rivalryarena.service.DataStoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/titles")
@CrossOrigin(origins = "*")
public class TitleController {

    @Autowired
    private DataStoreService dataStore;

    @GetMapping("/{userId}")
    public ResponseEntity<?> getTitlesForUser(@PathVariable String userId) {
        List<RivalryTitle> titles = dataStore.findTitlesForUser(userId);
        return ResponseEntity.ok(Map.of("titles", titles));
    }
}
