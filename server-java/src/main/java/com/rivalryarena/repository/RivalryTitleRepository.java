package com.rivalryarena.repository;

import com.rivalryarena.model.RivalryTitle;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RivalryTitleRepository extends MongoRepository<RivalryTitle, String> {
    List<RivalryTitle> findByWinnerIdAndStatus(String winnerId, String status);
    List<RivalryTitle> findByLoserIdAndStatus(String loserId, String status);
    Optional<RivalryTitle> findByPairKeyAndStatus(String pairKey, String status);
}
