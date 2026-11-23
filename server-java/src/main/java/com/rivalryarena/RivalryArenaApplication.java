package com.rivalryarena;

import com.rivalryarena.service.DataStoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration;
import org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.data.mongodb.core.MongoTemplate;

@SpringBootApplication
public class RivalryArenaApplication {

    public static void main(String[] args) {
        SpringApplication.run(RivalryArenaApplication.class, args);
    }

    @Bean
    public CommandLineRunner init(DataStoreService dataStore, @Autowired(required = false) MongoTemplate mongoTemplate) {
        return args -> {
            System.out.println("==================================================");
            System.out.println("  ⚔️  RIVALRY ARENA JAVA SPRING BOOT SERVER ⚔️  ");
            System.out.println("==================================================");

            if (mongoTemplate != null) {
                try {
                    mongoTemplate.getDb().runCommand(new org.bson.Document("ping", 1));
                    dataStore.setMongoConnected(true);
                    System.out.println("[mongo] Connected to MongoDB successfully.");
                } catch (Exception e) {
                    dataStore.setMongoConnected(false);
                    System.out.println("[mongo] Could not connect to MongoDB (" + e.getMessage() + ").");
                    System.out.println("[mongo] Running in memory/offline mode — in-memory custom DSA rules active.");
                }
            } else {
                dataStore.setMongoConnected(false);
                System.out.println("[mongo] Running in memory/offline mode — in-memory custom DSA rules active.");
            }

            System.out.println("[server] Rivalry Arena Java Backend listening on http://localhost:3001");
            System.out.println("[server] Pure Java DSA: DoublyLinkedList, MinHeap, CustomHashMap active.");
        };
    }
}
