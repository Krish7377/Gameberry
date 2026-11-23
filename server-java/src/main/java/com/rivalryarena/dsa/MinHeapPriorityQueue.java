package com.rivalryarena.dsa;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * DSA: MinHeapPriorityQueue<T>
 * 
 * An academic implementation of a Binary Min-Heap using a dynamic array.
 * 
 * Time Complexities:
 * - insert(value):    O(log N)
 * - extractMin():     O(log N)
 * - peek():           O(1)
 * - getSortedList():  O(N log N)
 * 
 * Applications in Rivalry Arena:
 * - Speed Board Leaderboards: Keeps the top 10 fastest times per game and board variant.
 *   Inserting a new speed score takes logarithmic time O(log 10) <= 4 comparisons,
 *   vastly outperforming an O(N) array scan.
 */
public class MinHeapPriorityQueue<T> {

    private Object[] heap;
    private int size;
    private final Comparator<T> comparator;

    @SuppressWarnings("unchecked")
    public MinHeapPriorityQueue(int initialCapacity, Comparator<T> comparator) {
        this.heap = new Object[Math.max(initialCapacity, 8)];
        this.size = 0;
        this.comparator = comparator != null ? comparator : (a, b) -> ((Comparable<T>) a).compareTo(b);
    }

    public MinHeapPriorityQueue(Comparator<T> comparator) {
        this(16, comparator);
    }

    public void insert(T value) {
        if (value == null) throw new IllegalArgumentException("Cannot insert null value");
        ensureCapacity();
        heap[size] = value;
        siftUp(size);
        size++;
    }

    @SuppressWarnings("unchecked")
    public T peek() {
        if (isEmpty()) return null;
        return (T) heap[0];
    }

    @SuppressWarnings("unchecked")
    public T extractMin() {
        if (isEmpty()) throw new NoSuchElementException("Heap is empty");
        T min = (T) heap[0];
        heap[0] = heap[size - 1];
        heap[size - 1] = null;
        size--;
        if (size > 0) {
            siftDown(0);
        }
        return min;
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    @SuppressWarnings("unchecked")
    private void siftUp(int index) {
        int current = index;
        while (current > 0) {
            int parent = (current - 1) / 2;
            if (comparator.compare((T) heap[current], (T) heap[parent]) < 0) {
                swap(current, parent);
                current = parent;
            } else {
                break;
            }
        }
    }

    @SuppressWarnings("unchecked")
    private void siftDown(int index) {
        int current = index;
        while (true) {
            int leftChild = 2 * current + 1;
            int rightChild = 2 * current + 2;
            int smallest = current;

            if (leftChild < size && comparator.compare((T) heap[leftChild], (T) heap[smallest]) < 0) {
                smallest = leftChild;
            }
            if (rightChild < size && comparator.compare((T) heap[rightChild], (T) heap[smallest]) < 0) {
                smallest = rightChild;
            }

            if (smallest != current) {
                swap(current, smallest);
                current = smallest;
            } else {
                break;
            }
        }
    }

    private void swap(int i, int j) {
        Object temp = heap[i];
        heap[i] = heap[j];
        heap[j] = temp;
    }

    private void ensureCapacity() {
        if (size >= heap.length) {
            heap = Arrays.copyOf(heap, heap.length * 2);
        }
    }

    /**
     * Returns all elements sorted from minimum to maximum without modifying this heap.
     */
    public List<T> getSortedList() {
        MinHeapPriorityQueue<T> copy = new MinHeapPriorityQueue<>(size, comparator);
        for (int i = 0; i < size; i++) {
            copy.insert(this.getAt(i));
        }
        List<T> sorted = new ArrayList<>(size);
        while (!copy.isEmpty()) {
            sorted.add(copy.extractMin());
        }
        return sorted;
    }

    @SuppressWarnings("unchecked")
    public T getAt(int index) {
        if (index < 0 || index >= size) throw new IndexOutOfBoundsException();
        return (T) heap[index];
    }
}
