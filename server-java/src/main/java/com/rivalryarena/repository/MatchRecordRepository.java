package com.rivalryarena.repository;

import com.rivalryarena.model.MatchRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MatchRecordRepository extends MongoRepository<MatchRecord, String> {
    List<MatchRecord> findByWinnerIdOrLoserIdOrderByCreatedAtDesc(String winnerId, String loserId);
}
