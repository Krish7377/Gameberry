package com.rivalryarena.repository;

import com.rivalryarena.model.LeaderboardEntry;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeaderboardRepository extends MongoRepository<LeaderboardEntry, String> {
    List<LeaderboardEntry> findByBoardOrderByBestTimeAsc(String board);
    Optional<LeaderboardEntry> findByBoardAndUserId(String board, String userId);
}
