package com.rivalryarena.dsa;

import java.util.EmptyStackException;

/**
 * DSA: CustomStack<T>
 * 
 * An academic implementation of a LIFO Stack using a singly linked chain.
 * 
 * Time Complexities:
 * - push(item): O(1)
 * - pop():       O(1)
 * - peek():      O(1)
 * 
 * Applications in Gameberry:
 * - Connect Four: 7 column stacks holding dropped player discs.
 * - Tic-Tac-Toe & 2048: Move history stack for tracking game steps.
 */
public class CustomStack<T> {

    private static class Node<T> {
        T value;
        Node<T> next;

        Node(T value, Node<T> next) {
            this.value = value;
            this.next = next;
        }
    }

    private Node<T> top = null;
    private int size = 0;

    public void push(T value) {
        top = new Node<>(value, top);
        size++;
    }

    public T pop() {
        if (isEmpty()) throw new EmptyStackException();
        T val = top.value;
        top = top.next;
        size--;
        return val;
    }

    public T peek() {
        if (isEmpty()) return null;
        return top.value;
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public void clear() {
        top = null;
        size = 0;
    }
}
