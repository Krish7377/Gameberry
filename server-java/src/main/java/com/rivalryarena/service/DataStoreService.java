package com.rivalryarena.service;

import com.rivalryarena.dsa.CustomHashMap;
import com.rivalryarena.dsa.DoublyLinkedList;
import com.rivalryarena.dsa.MinHeapPriorityQueue;
import com.rivalryarena.model.LeaderboardEntry;
import com.rivalryarena.model.MatchRecord;
import com.rivalryarena.model.RivalryTitle;
import com.rivalryarena.model.User;
import com.rivalryarena.repository.LeaderboardRepository;
import com.rivalryarena.repository.MatchRecordRepository;
import com.rivalryarena.repository.RivalryTitleRepository;
import com.rivalryarena.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Dual Storage Manager:
 * Automatically uses MongoDB when available, and transparently falls back to
 * pure custom Java DSA structures (CustomHashMap, DoublyLinkedList, MinHeapPriorityQueue)
 * when running offline.
 */
@Service
public class DataStoreService {

    @Autowired(required = false)
    private UserRepository userRepository;

    @Autowired(required = false)
    private RivalryTitleRepository titleRepository;

    @Autowired(required = false)
    private MatchRecordRepository matchRepository;

    @Autowired(required = false)
    private LeaderboardRepository leaderboardRepository;

    @Autowired(required = false)
    private MongoTemplate mongoTemplate;

    private boolean mongoConnected = false;

    // DSA: In-memory fallback structures
    private final CustomHashMap<String, User> inMemoryUsers = new CustomHashMap<>();
    private final CustomHashMap<String, RivalryTitle> inMemoryTitles = new CustomHashMap<>();
    private final DoublyLinkedList<MatchRecord> inMemoryMatches = new DoublyLinkedList<>();
    private final CustomHashMap<String, MinHeapPriorityQueue<LeaderboardEntry>> inMemoryLeaderboards = new CustomHashMap<>();

    public void setMongoConnected(boolean connected) {
        this.mongoConnected = connected;
    }

    public boolean isMongoConnected() {
        return mongoConnected;
    }

    // --- USERS ---
    public User saveUser(User user) {
        if (user.getId() == null) {
            user.setId(UUID.randomUUID().toString());
        }
        if (mongoConnected && userRepository != null) {
            try {
                return userRepository.save(user);
            } catch (Exception e) {
                // fallback to memory
            }
        }
        inMemoryUsers.put(user.getId(), user);
        return user;
    }

    public Optional<User> findUserById(String id) {
        if (mongoConnected && userRepository != null) {
            try {
                Optional<User> u = userRepository.findById(id);
                if (u.isPresent()) return u;
            } catch (Exception ignored) {}
        }
        return Optional.ofNullable(inMemoryUsers.get(id));
    }

    public Optional<User> findUserByUsername(String username) {
        if (mongoConnected && userRepository != null) {
            try {
                Optional<User> u = userRepository.findByUsername(username);
                if (u.isPresent()) return u;
            } catch (Exception ignored) {}
        }
        for (User u : inMemoryUsers.values()) {
            if (u.getUsername().equalsIgnoreCase(username)) {
                return Optional.of(u);
            }
        }
        return Optional.empty();
    }

    // --- TITLES ---
    public RivalryTitle saveTitle(RivalryTitle title) {
        if (title.getId() == null) {
            title.setId(UUID.randomUUID().toString());
        }
        if (mongoConnected && titleRepository != null) {
            try {
                return titleRepository.save(title);
            } catch (Exception ignored) {}
        }
        inMemoryTitles.put(title.getId(), title);
        return title;
    }

    public List<RivalryTitle> findTitlesForUser(String userId) {
        List<RivalryTitle> result = new ArrayList<>();
        if (mongoConnected && titleRepository != null) {
            try {
                result.addAll(titleRepository.findByWinnerIdAndStatus(userId, "active"));
                result.addAll(titleRepository.findByLoserIdAndStatus(userId, "active"));
                if (!result.isEmpty()) return result;
            } catch (Exception ignored) {}
        }
        long now = System.currentTimeMillis();
        for (RivalryTitle t : inMemoryTitles.values()) {
            if ("active".equals(t.getStatus())) {
                if (t.getExpiresAt() != null && t.getExpiresAt().getTime() <= now) {
                    t.setStatus("expired");
                    continue;
                }
                if (userId.equals(t.getWinnerId()) || userId.equals(t.getLoserId())) {
                    result.add(t);
                }
            }
        }
        return result;
    }

    public Optional<RivalryTitle> findActiveTitleByPairKey(String pairKey) {
        if (mongoConnected && titleRepository != null) {
            try {
                Optional<RivalryTitle> t = titleRepository.findByPairKeyAndStatus(pairKey, "active");
                if (t.isPresent()) return t;
            } catch (Exception ignored) {}
        }
        for (RivalryTitle t : inMemoryTitles.values()) {
            if ("active".equals(t.getStatus()) && pairKey.equals(t.getPairKey())) {
                return Optional.of(t);
            }
        }
        return Optional.empty();
    }

    // --- MATCHES ---
    public MatchRecord saveMatch(MatchRecord match) {
        if (match.getId() == null) {
            match.setId(UUID.randomUUID().toString());
        }
        if (mongoConnected && matchRepository != null) {
            try {
                return matchRepository.save(match);
            } catch (Exception ignored) {}
        }
        inMemoryMatches.addFirst(match);
        return match;
    }

    public List<MatchRecord> findMatchesForUser(String userId) {
        if (mongoConnected && matchRepository != null) {
            try {
                List<MatchRecord> list = matchRepository.findByWinnerIdOrLoserIdOrderByCreatedAtDesc(userId, userId);
                if (!list.isEmpty()) return list;
            } catch (Exception ignored) {}
        }
        List<MatchRecord> list = new ArrayList<>();
        for (MatchRecord m : inMemoryMatches) {
            if (userId.equals(m.getWinnerId()) || userId.equals(m.getLoserId())) {
                list.add(m);
            }
        }
        return list;
    }

    // --- LEADERBOARDS (DSA: MinHeapPriorityQueue) ---
    public LeaderboardEntry submitLeaderboardTime(String board, String userId, String username, long timeMs) {
        LeaderboardEntry entry = new LeaderboardEntry(board, userId, username, timeMs);
        if (mongoConnected && leaderboardRepository != null) {
            try {
                leaderboardRepository.save(entry);
            } catch (Exception ignored) {}
        }

        MinHeapPriorityQueue<LeaderboardEntry> heap = inMemoryLeaderboards.get(board);
        if (heap == null) {
            heap = new MinHeapPriorityQueue<>(16, Comparator.comparingLong(LeaderboardEntry::getBestTime));
            inMemoryLeaderboards.put(board, heap);
        }
        heap.insert(entry);
        return entry;
    }

    public List<LeaderboardEntry> getTop10Leaderboard(String board) {
        if (mongoConnected && leaderboardRepository != null) {
            try {
                List<LeaderboardEntry> list = leaderboardRepository.findByBoardOrderByBestTimeAsc(board);
                if (!list.isEmpty()) {
                    return list.size() > 10 ? list.subList(0, 10) : list;
                }
            } catch (Exception ignored) {}
        }

        MinHeapPriorityQueue<LeaderboardEntry> heap = inMemoryLeaderboards.get(board);
        if (heap == null || heap.isEmpty()) {
            return Collections.emptyList();
        }
        List<LeaderboardEntry> sorted = heap.getSortedList();
        return sorted.size() > 10 ? sorted.subList(0, 10) : sorted;
    }
}
