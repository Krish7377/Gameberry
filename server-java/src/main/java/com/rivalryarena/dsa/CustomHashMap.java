package com.rivalryarena.dsa;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * DSA: CustomHashMap<K, V>
 * 
 * An academic implementation of a Hash Table using Separate Chaining (linked buckets)
 * and dynamic resizing when the load factor exceeds 0.75.
 * 
 * Time Complexities:
 * - put(K, V):        O(1) average, O(N) worst-case on severe collisions
 * - get(K):           O(1) average
 * - remove(K):        O(1) average
 * - containsKey(K):   O(1) average
 * 
 * Applications in Gameberry:
 * - User active titles registry: O(1) lookup to find who conquered whom.
 * - Online room lookup: O(1) matching 4-letter room codes to active rooms.
 * - Player presence tracking: O(1) mapping user ID to socket connection.
 */
public class CustomHashMap<K, V> {

    public static class Entry<K, V> {
        public final K key;
        public V value;
        public Entry<K, V> next;

        public Entry(K key, V value, Entry<K, V> next) {
            this.key = key;
            this.value = value;
            this.next = next;
        }
    }

    private static final int DEFAULT_CAPACITY = 16;
    private static final float LOAD_FACTOR_THRESHOLD = 0.75f;

    @SuppressWarnings("unchecked")
    private Entry<K, V>[] buckets = new Entry[DEFAULT_CAPACITY];
    private int size = 0;

    private int getBucketIndex(K key) {
        if (key == null) return 0;
        int h = key.hashCode();
        // Spread higher bits to lower (Murmur-style mixing)
        h = h ^ (h >>> 16);
        return Math.floorMod(h, buckets.length);
    }

    public void put(K key, V value) {
        int index = getBucketIndex(key);
        Entry<K, V> current = buckets[index];

        while (current != null) {
            if (Objects.equals(current.key, key)) {
                current.value = value;
                return;
            }
            current = current.next;
        }

        // Key not found, prepend to bucket chain
        buckets[index] = new Entry<>(key, value, buckets[index]);
        size++;

        if ((float) size / buckets.length >= LOAD_FACTOR_THRESHOLD) {
            resize(buckets.length * 2);
        }
    }

    public V get(K key) {
        int index = getBucketIndex(key);
        Entry<K, V> current = buckets[index];
        while (current != null) {
            if (Objects.equals(current.key, key)) {
                return current.value;
            }
            current = current.next;
        }
        return null;
    }

    public boolean containsKey(K key) {
        return get(key) != null;
    }

    public V remove(K key) {
        int index = getBucketIndex(key);
        Entry<K, V> current = buckets[index];
        Entry<K, V> prev = null;

        while (current != null) {
            if (Objects.equals(current.key, key)) {
                if (prev == null) {
                    buckets[index] = current.next;
                } else {
                    prev.next = current.next;
                }
                size--;
                return current.value;
            }
            prev = current;
            current = current.next;
        }
        return null;
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public float getLoadFactor() {
        return (float) size / buckets.length;
    }

    public int getBucketCount() {
        return buckets.length;
    }

    public List<Entry<K, V>> entries() {
        List<Entry<K, V>> list = new ArrayList<>(size);
        for (Entry<K, V> bucket : buckets) {
            Entry<K, V> curr = bucket;
            while (curr != null) {
                list.add(curr);
                curr = curr.next;
            }
        }
        return list;
    }

    public List<K> keySet() {
        List<K> keys = new ArrayList<>(size);
        for (Entry<K, V> entry : entries()) {
            keys.add(entry.key);
        }
        return keys;
    }

    public List<V> values() {
        List<V> vals = new ArrayList<>(size);
        for (Entry<K, V> entry : entries()) {
            vals.add(entry.value);
        }
        return vals;
    }

    public void clear() {
        @SuppressWarnings("unchecked")
        Entry<K, V>[] newBuckets = new Entry[DEFAULT_CAPACITY];
        buckets = newBuckets;
        size = 0;
    }

    @SuppressWarnings("unchecked")
    private void resize(int newCapacity) {
        Entry<K, V>[] oldBuckets = buckets;
        buckets = new Entry[newCapacity];
        size = 0;

        for (Entry<K, V> head : oldBuckets) {
            Entry<K, V> curr = head;
            while (curr != null) {
                put(curr.key, curr.value);
                curr = curr.next;
            }
        }
    }
}
