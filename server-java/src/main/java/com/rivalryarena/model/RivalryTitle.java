package com.rivalryarena.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Document(collection = "rivalry_titles")
public class RivalryTitle {

    @Id
    private String id;
    private String winnerId;
    private String winnerName;
    private String loserId;
    private String loserName;
    private String pairKey;
    private String gameId;
    private String gameName;
    private String score;
    private String seriesScore;
    private String seriesId;
    private String status = "active"; // active, reclaimed, expired
    private Date createdAt = new Date();
    private Date expiresAt;
    private Date reclaimedAt;

    public RivalryTitle() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getWinnerId() { return winnerId; }
    public void setWinnerId(String winnerId) { this.winnerId = winnerId; }

    public String getWinnerName() { return winnerName; }
    public void setWinnerName(String winnerName) { this.winnerName = winnerName; }

    public String getLoserId() { return loserId; }
    public void setLoserId(String loserId) { this.loserId = loserId; }

    public String getLoserName() { return loserName; }
    public void setLoserName(String loserName) { this.loserName = loserName; }

    public String getPairKey() { return pairKey; }
    public void setPairKey(String pairKey) { this.pairKey = pairKey; }

    public String getGameId() { return gameId; }
    public void setGameId(String gameId) { this.gameId = gameId; }

    public String getGameName() { return gameName; }
    public void setGameName(String gameName) { this.gameName = gameName; }

    public String getScore() { return score; }
    public void setScore(String score) { this.score = score; }

    public String getSeriesScore() { return seriesScore; }
    public void setSeriesScore(String seriesScore) { this.seriesScore = seriesScore; }

    public String getSeriesId() { return seriesId; }
    public void setSeriesId(String seriesId) { this.seriesId = seriesId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public Date getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Date expiresAt) { this.expiresAt = expiresAt; }

    public Date getReclaimedAt() { return reclaimedAt; }
    public void setReclaimedAt(Date reclaimedAt) { this.reclaimedAt = reclaimedAt; }
}
