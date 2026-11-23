package com.rivalryarena.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Document(collection = "match_records")
public class MatchRecord {

    public static class PlayerInfo {
        private String id;
        private String username;

        public PlayerInfo() {}
        public PlayerInfo(String id, String username) {
            this.id = id;
            this.username = username;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
    }

    public static class RoundRecord {
        private int roundNumber;
        private String gameId;
        private String winnerId;
        private boolean isDraw;
        private long durationMs;

        public RoundRecord() {}

        public int getRoundNumber() { return roundNumber; }
        public void setRoundNumber(int roundNumber) { this.roundNumber = roundNumber; }
        public String getGameId() { return gameId; }
        public void setGameId(String gameId) { this.gameId = gameId; }
        public String getWinnerId() { return winnerId; }
        public void setWinnerId(String winnerId) { this.winnerId = winnerId; }
        public boolean isDraw() { return isDraw; }
        public void setDraw(boolean draw) { isDraw = draw; }
        public long getDurationMs() { return durationMs; }
        public void setDurationMs(long durationMs) { this.durationMs = durationMs; }
    }

    @Id
    private String id;
    private String seriesId;
    private int format = 1;
    private boolean titleMode = false;
    private List<PlayerInfo> players = new ArrayList<>();
    private String winnerId;
    private String winnerName;
    private String loserId;
    private String loserName;
    private String seriesScore;
    private List<RoundRecord> rounds = new ArrayList<>();
    private boolean titleAwarded = false;
    private Date createdAt = new Date();

    public MatchRecord() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSeriesId() { return seriesId; }
    public void setSeriesId(String seriesId) { this.seriesId = seriesId; }

    public int getFormat() { return format; }
    public void setFormat(int format) { this.format = format; }

    public boolean isTitleMode() { return titleMode; }
    public void setTitleMode(boolean titleMode) { this.titleMode = titleMode; }

    public List<PlayerInfo> getPlayers() { return players; }
    public void setPlayers(List<PlayerInfo> players) { this.players = players; }

    public String getWinnerId() { return winnerId; }
    public void setWinnerId(String winnerId) { this.winnerId = winnerId; }

    public String getWinnerName() { return winnerName; }
    public void setWinnerName(String winnerName) { this.winnerName = winnerName; }

    public String getLoserId() { return loserId; }
    public void setLoserId(String loserId) { this.loserId = loserId; }

    public String getLoserName() { return loserName; }
    public void setLoserName(String loserName) { this.loserName = loserName; }

    public String getSeriesScore() { return seriesScore; }
    public void setSeriesScore(String seriesScore) { this.seriesScore = seriesScore; }

    public List<RoundRecord> getRounds() { return rounds; }
    public void setRounds(List<RoundRecord> rounds) { this.rounds = rounds; }

    public boolean isTitleAwarded() { return titleAwarded; }
    public void setTitleAwarded(boolean titleAwarded) { this.titleAwarded = titleAwarded; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}
