package com.rivalryarena.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Document(collection = "leaderboards")
public class LeaderboardEntry {

    @Id
    private String id;
    private String board; // e.g. "minesweeper:9x9", "sudoku:easy"
    private String userId;
    private String username;
    private long bestTime; // milliseconds
    private Date achievedAt = new Date();

    public LeaderboardEntry() {}

    public LeaderboardEntry(String board, String userId, String username, long bestTime) {
        this.board = board;
        this.userId = userId;
        this.username = username;
        this.bestTime = bestTime;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBoard() { return board; }
    public void setBoard(String board) { this.board = board; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public long getBestTime() { return bestTime; }
    public void setBestTime(long bestTime) { this.bestTime = bestTime; }

    public Date getAchievedAt() { return achievedAt; }
    public void setAchievedAt(Date achievedAt) { this.achievedAt = achievedAt; }
}
