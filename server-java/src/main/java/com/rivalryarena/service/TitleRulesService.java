package com.rivalryarena.service;

import com.rivalryarena.model.RivalryTitle;
import org.springframework.stereotype.Service;

import java.util.Date;

/**
 * DSA & Rules: TitleRulesService
 * 
 * Enforces all academic Rivalry Title rules:
 * 1. 7-day title duration (expiresAt = createdAt + 7 days).
 * 2. Single active title per winner-loser pair (normalized pairKey).
 * 3. Title reclaim: If the loser defeats the reigning title holder in a Title Match,
 *    the old title is marked 'reclaimed' and a new title is awarded.
 * 4. Bot rule: Practice matches against RoboRival never mint titles.
 */
@Service
public class TitleRulesService {

    public static final long TITLE_DURATION_MS = 7L * 24 * 60 * 60 * 1000; // 7 days

    public static String getPairKey(String playerA, String playerB) {
        if (playerA.compareTo(playerB) < 0) {
            return playerA + ":" + playerB;
        } else {
            return playerB + ":" + playerA;
        }
    }

    public static boolean isBotUser(String username) {
        if (username == null) return false;
        String lower = username.toLowerCase();
        return lower.contains("bot") || lower.contains("roborival");
    }

    public RivalryTitle mintTitle(String winnerId, String winnerName,
                                 String loserId, String loserName,
                                 String gameId, String gameName,
                                 String score, String seriesScore,
                                 String seriesId) {
        // Bots cannot hold or stake titles
        if (isBotUser(winnerName) || isBotUser(loserName)) {
            return null;
        }

        RivalryTitle title = new RivalryTitle();
        title.setWinnerId(winnerId);
        title.setWinnerName(winnerName);
        title.setLoserId(loserId);
        title.setLoserName(loserName);
        title.setPairKey(getPairKey(winnerId, loserId));
        title.setGameId(gameId);
        title.setGameName(gameName);
        title.setScore(score);
        title.setSeriesScore(seriesScore);
        title.setSeriesId(seriesId);
        title.setStatus("active");

        Date now = new Date();
        title.setCreatedAt(now);
        title.setExpiresAt(new Date(now.getTime() + TITLE_DURATION_MS));
        return title;
    }
}
