package com.rivalryarena.websocket;

import com.rivalryarena.dsa.CustomHashMap;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Optional;

/**
 * DSA: RoomRegistry
 * 
 * Manages active online rooms using a custom CustomHashMap<String, Room>.
 * 
 * Time Complexities:
 * - createRoom: O(1) hash table insertion
 * - getRoom:    O(1) hash table lookup by 4-letter code
 * - removeRoom: O(1) hash table deletion
 */
@Component
public class RoomRegistry {

    private final CustomHashMap<String, Room> rooms = new CustomHashMap<>();
    private final SecureRandom random = new SecureRandom();
    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public synchronized String generateUniqueCode() {
        for (int attempts = 0; attempts < 1000; attempts++) {
            StringBuilder sb = new StringBuilder(4);
            for (int i = 0; i < 4; i++) {
                sb.append(CODE_CHARS.charAt(random.nextInt(CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (!rooms.containsKey(code)) {
                return code;
            }
        }
        return "R" + (System.currentTimeMillis() % 1000);
    }

    public synchronized Room createRoom(String hostSessionId, String hostUserId, String hostUsername, java.util.Map<String, Object> config) {
        String code = generateUniqueCode();
        Room room = new Room(code, hostSessionId, hostUserId, hostUsername, config);
        rooms.put(code, room);
        return room;
    }

    public synchronized Optional<Room> getRoom(String code) {
        if (code == null) return Optional.empty();
        return Optional.ofNullable(rooms.get(code.toUpperCase()));
    }

    public synchronized void removeRoom(String code) {
        if (code != null) {
            rooms.remove(code.toUpperCase());
        }
    }

    public synchronized Optional<Room> findRoomBySessionId(String sessionId) {
        if (sessionId == null) return Optional.empty();
        for (Room r : rooms.values()) {
            if (sessionId.equals(r.getHostSessionId()) || sessionId.equals(r.getGuestSessionId())) {
                return Optional.of(r);
            }
        }
        return Optional.empty();
    }
}
