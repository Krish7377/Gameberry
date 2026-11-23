package com.rivalryarena.service;

import com.rivalryarena.model.MatchRecord;
import com.rivalryarena.model.RivalryTitle;
import com.rivalryarena.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class SeriesService {

    @Autowired
    private DataStoreService dataStore;

    @Autowired
    private TitleRulesService titleRules;

    public MatchRecord recordMatchResult(MatchRecord match) {
        String winnerId = match.getWinnerId();
        String loserId = match.getLoserId();

        // 1. Update user win/loss statistics
        if (winnerId != null) {
            Optional<User> winUserOpt = dataStore.findUserById(winnerId);
            winUserOpt.ifPresent(u -> {
                u.setWins(u.getWins() + 1);
                dataStore.saveUser(u);
            });
        }
        if (loserId != null) {
            Optional<User> loseUserOpt = dataStore.findUserById(loserId);
            loseUserOpt.ifPresent(u -> {
                u.setLosses(u.getLosses() + 1);
                dataStore.saveUser(u);
            });
        }

        // 2. Title processing if match had titleMode = true
        if (match.isTitleMode() && winnerId != null && loserId != null) {
            String pairKey = TitleRulesService.getPairKey(winnerId, loserId);
            Optional<RivalryTitle> existingTitleOpt = dataStore.findActiveTitleByPairKey(pairKey);

            if (existingTitleOpt.isPresent()) {
                RivalryTitle existing = existingTitleOpt.get();
                // Check if loser conquered the former winner (Reclaimed!)
                if (existing.getWinnerId().equals(loserId)) {
                    existing.setStatus("reclaimed");
                    existing.setReclaimedAt(new Date());
                    dataStore.saveTitle(existing);
                } else if (existing.getWinnerId().equals(winnerId)) {
                    // Winner won again -> refresh 7-day duration
                    existing.setExpiresAt(new Date(System.currentTimeMillis() + TitleRulesService.TITLE_DURATION_MS));
                    dataStore.saveTitle(existing);
                    match.setTitleAwarded(true);
                }
            }

            // Mint new title if not just refreshed
            if (!match.isTitleAwarded()) {
                String firstGameName = match.getRounds().isEmpty() ? "Battle" : match.getRounds().get(0).getGameId();
                RivalryTitle newTitle = titleRules.mintTitle(
                        winnerId, match.getWinnerName(),
                        loserId, match.getLoserName(),
                        firstGameName, firstGameName,
                        match.getSeriesScore(), match.getSeriesScore(),
                        match.getSeriesId()
                );
                if (newTitle != null) {
                    dataStore.saveTitle(newTitle);
                    match.setTitleAwarded(true);
                }
            }
        }

        return dataStore.saveMatch(match);
    }
}
