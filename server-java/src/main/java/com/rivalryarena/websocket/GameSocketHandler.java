package com.rivalryarena.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class GameSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper mapper = new ObjectMapper();
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, Map<String, String>> sessionUsers = new ConcurrentHashMap<>();

    @Autowired
    private RoomRegistry roomRegistry;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.put(session.getId(), session);

        // Engine.IO / Socket.IO handshake response if query contains EIO
        String uri = session.getUri() != null ? session.getUri().toString() : "";
        if (uri.contains("EIO=")) {
            String handshake = "0{\"sid\":\"" + session.getId() + "\",\"upgrades\":[],\"pingInterval\":25000,\"pingTimeout\":20000}";
            session.sendMessage(new TextMessage(handshake));
            session.sendMessage(new TextMessage("40{\"sid\":\"" + session.getId() + "\"}"));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String sid = session.getId();
        sessions.remove(sid);
        sessionUsers.remove(sid);

        Optional<Room> roomOpt = roomRegistry.findRoomBySessionId(sid);
        if (roomOpt.isPresent()) {
            Room room = roomOpt.get();
            String otherSid = sid.equals(room.getHostSessionId()) ? room.getGuestSessionId() : room.getHostSessionId();
            if (otherSid != null) {
                emitTo(otherSid, "opponent-disconnected", Map.of("roomCode", room.getCode(), "message", "Opponent disconnected"));
                emitTo(otherSid, "room-closed", Map.of("reason", "Opponent left the room"));
            }
            roomRegistry.removeRoom(room.getCode());
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload().trim();

        // 1. Engine.IO ping/pong
        if ("2".equals(payload)) {
            session.sendMessage(new TextMessage("3"));
            return;
        }

        String event = null;
        Object data = null;

        // 2. Parse Socket.io framing: 42["event", data]
        if (payload.startsWith("42[")) {
            try {
                List<?> list = mapper.readValue(payload.substring(2), List.class);
                if (list != null && !list.isEmpty()) {
                    event = String.valueOf(list.get(0));
                    if (list.size() > 1) {
                        data = list.get(1);
                    }
                }
            } catch (Exception ignored) {}
        } else if (payload.startsWith("{")) {
            // Standard JSON framing: {"event": "...", "data": ...}
            try {
                Map<?, ?> map = mapper.readValue(payload, Map.class);
                event = String.valueOf(map.get("event"));
                data = map.get("data");
            } catch (Exception ignored) {}
        }

        if (event == null) return;

        handleEvent(session, event, data);
    }

    @SuppressWarnings("unchecked")
    private void handleEvent(WebSocketSession session, String event, Object rawData) {
        String sid = session.getId();
        Map<String, Object> data = rawData instanceof Map ? (Map<String, Object>) rawData : new HashMap<>();

        switch (event) {
            case "set-user": {
                Map<String, String> user = new HashMap<>();
                user.put("id", String.valueOf(data.get("userId")));
                user.put("username", String.valueOf(data.get("username")));
                sessionUsers.put(sid, user);
                break;
            }

            case "create-room": {
                Map<String, String> user = sessionUsers.getOrDefault(sid, Map.of("id", "host", "username", "Host"));
                Map<String, Object> config = (Map<String, Object>) data.get("seriesConfig");
                if (config == null) config = data;

                Room room = roomRegistry.createRoom(sid, user.get("id"), user.get("username"), config);
                emitTo(sid, "room-updated", Map.of("room", room.toMap()));
                break;
            }

            case "join-room": {
                String code = String.valueOf(data.get("code"));
                Map<String, String> user = sessionUsers.getOrDefault(sid, Map.of("id", "guest", "username", "Guest"));
                String guestName = data.containsKey("guestName") ? String.valueOf(data.get("guestName")) : user.get("username");

                Optional<Room> roomOpt = roomRegistry.getRoom(code);
                if (roomOpt.isEmpty()) {
                    emitTo(sid, "error", Map.of("message", "Room not found"));
                    return;
                }

                Room room = roomOpt.get();
                if (room.getGuestSessionId() != null) {
                    emitTo(sid, "error", Map.of("message", "Room is already full"));
                    return;
                }

                room.setGuestSessionId(sid);
                room.setGuestUserId(user.get("id"));
                room.setGuestUsername(guestName);
                room.setStatus("active");

                // Broadcast room-updated to both host and guest
                emitTo(room.getHostSessionId(), "room-updated", Map.of("room", room.toMap()));
                emitTo(sid, "room-updated", Map.of("room", room.toMap()));

                // Trigger synchronized match countdown (3 seconds)
                long seed = System.currentTimeMillis();
                Map<String, Object> countdownData = Map.of(
                        "room", room.toMap(),
                        "countdownSec", 3,
                        "seed", seed
                );
                emitTo(room.getHostSessionId(), "match-countdown-start", countdownData);
                emitTo(sid, "match-countdown-start", countdownData);
                break;
            }

            case "move": {
                String roomCode = String.valueOf(data.get("roomCode"));
                roomRegistry.getRoom(roomCode).ifPresent(room -> {
                    String opponentSid = sid.equals(room.getHostSessionId()) ? room.getGuestSessionId() : room.getHostSessionId();
                    if (opponentSid != null) {
                        emitTo(opponentSid, "opponent-move", data);
                    }
                });
                break;
            }

            case "progress": {
                String roomCode = String.valueOf(data.get("roomCode"));
                roomRegistry.getRoom(roomCode).ifPresent(room -> {
                    String opponentSid = sid.equals(room.getHostSessionId()) ? room.getGuestSessionId() : room.getHostSessionId();
                    if (opponentSid != null) {
                        emitTo(opponentSid, "opponent-progress", data);
                    }
                });
                break;
            }

            case "rematch-request": {
                String roomCode = String.valueOf(data.get("roomCode"));
                Map<String, String> user = sessionUsers.getOrDefault(sid, Map.of("username", "Opponent"));
                roomRegistry.getRoom(roomCode).ifPresent(room -> {
                    String opponentSid = sid.equals(room.getHostSessionId()) ? room.getGuestSessionId() : room.getHostSessionId();
                    if (opponentSid != null) {
                        emitTo(opponentSid, "opponent-rematch-offer", Map.of("from", user.get("username")));
                    }
                });
                break;
            }

            case "rematch-accept": {
                String roomCode = String.valueOf(data.get("roomCode"));
                roomRegistry.getRoom(roomCode).ifPresent(room -> {
                    long seed = System.currentTimeMillis();
                    Map<String, Object> rematchData = Map.of("seed", seed, "message", "Rematch accepted!");
                    if (room.getHostSessionId() != null) emitTo(room.getHostSessionId(), "opponent-rematch-start", rematchData);
                    if (room.getGuestSessionId() != null) emitTo(room.getGuestSessionId(), "opponent-rematch-start", rematchData);
                });
                break;
            }

            case "leave-room": {
                String roomCode = String.valueOf(data.get("code"));
                roomRegistry.getRoom(roomCode).ifPresent(room -> {
                    String otherSid = sid.equals(room.getHostSessionId()) ? room.getGuestSessionId() : room.getHostSessionId();
                    if (otherSid != null) {
                        emitTo(otherSid, "room-closed", Map.of("reason", "Opponent left the room"));
                    }
                    roomRegistry.removeRoom(roomCode);
                });
                break;
            }
        }
    }

    public void emitTo(String sessionId, String event, Object data) {
        if (sessionId == null) return;
        WebSocketSession session = sessions.get(sessionId);
        if (session != null && session.isOpen()) {
            try {
                String json = mapper.writeValueAsString(data);
                // Send Socket.io framed packet 42["event", data]
                String framed = "42[\"" + event + "\"," + json + "]";
                session.sendMessage(new TextMessage(framed));

                // Also send standard JSON payload for non-socket.io clients
                String standardJson = mapper.writeValueAsString(Map.of("event", event, "data", data));
                session.sendMessage(new TextMessage(standardJson));
            } catch (IOException ignored) {}
        }
    }
}
