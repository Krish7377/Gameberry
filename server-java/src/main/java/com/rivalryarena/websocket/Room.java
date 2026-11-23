package com.rivalryarena.websocket;

import java.util.HashMap;
import java.util.Map;

public class Room {
    private String code;
    private String hostSessionId;
    private String hostUserId;
    private String hostUsername;

    private String guestSessionId;
    private String guestUserId;
    private String guestUsername;

    private Map<String, Object> seriesConfig = new HashMap<>();
    private String status = "waiting"; // waiting, playing, finished
    private long createdAt = System.currentTimeMillis();

    public Room(String code, String hostSessionId, String hostUserId, String hostUsername, Map<String, Object> seriesConfig) {
        this.code = code;
        this.hostSessionId = hostSessionId;
        this.hostUserId = hostUserId;
        this.hostUsername = hostUsername;
        if (seriesConfig != null) {
            this.seriesConfig = seriesConfig;
        }
    }

    public String getCode() { return code; }
    public String getHostSessionId() { return hostSessionId; }
    public String getHostUserId() { return hostUserId; }
    public String getHostUsername() { return hostUsername; }

    public String getGuestSessionId() { return guestSessionId; }
    public void setGuestSessionId(String guestSessionId) { this.guestSessionId = guestSessionId; }
    public String getGuestUserId() { return guestUserId; }
    public void setGuestUserId(String guestUserId) { this.guestUserId = guestUserId; }
    public String getGuestUsername() { return guestUsername; }
    public void setGuestUsername(String guestUsername) { this.guestUsername = guestUsername; }

    public Map<String, Object> getSeriesConfig() { return seriesConfig; }
    public void setSeriesConfig(Map<String, Object> seriesConfig) { this.seriesConfig = seriesConfig; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("code", code);
        map.put("status", status);

        Map<String, Object> host = new HashMap<>();
        host.put("id", hostUserId);
        host.put("username", hostUsername);
        map.put("host", host);

        if (guestUserId != null) {
            Map<String, Object> guest = new HashMap<>();
            guest.put("id", guestUserId);
            guest.put("username", guestUsername);
            map.put("guest", guest);
        } else {
            map.put("guest", null);
        }

        map.put("seriesConfig", seriesConfig);
        return map;
    }
}
