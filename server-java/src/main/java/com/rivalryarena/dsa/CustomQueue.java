package com.rivalryarena.dsa;

import java.util.NoSuchElementException;

/**
 * DSA: CustomQueue<T>
 * 
 * An academic implementation of a FIFO Queue using linked nodes with head & tail pointers.
 * 
 * Time Complexities:
 * - enqueue(item): O(1)
 * - dequeue():     O(1)
 * - peek():        O(1)
 * 
 * Applications in Gameberry:
 * - Series Machine: Queues upcoming games in a multi-round match.
 * - Minesweeper & Snake Bot: BFS flood fill frontier queue.
 */
public class CustomQueue<T> {

    private static class Node<T> {
        T value;
        Node<T> next;

        Node(T value) {
            this.value = value;
        }
    }

    private Node<T> head = null;
    private Node<T> tail = null;
    private int size = 0;

    public void enqueue(T value) {
        Node<T> node = new Node<>(value);
        if (tail != null) {
            tail.next = node;
        } else {
            head = node;
        }
        tail = node;
        size++;
    }

    public T dequeue() {
        if (isEmpty()) throw new NoSuchElementException("Queue is empty");
        T val = head.value;
        head = head.next;
        if (head == null) {
            tail = null;
        }
        size--;
        return val;
    }

    public T peek() {
        if (isEmpty()) return null;
        return head.value;
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public void clear() {
        head = null;
        tail = null;
        size = 0;
    }
}
