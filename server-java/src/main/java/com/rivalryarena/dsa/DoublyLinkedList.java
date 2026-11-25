package com.rivalryarena.dsa;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * DSA: DoublyLinkedList<T>
 * 
 * An academic implementation of a Doubly Linked List with sentinel head/tail nodes.
 * 
 * Time Complexities:
 * - addFirst(value): O(1)
 * - addLast(value):  O(1)
 * - removeFirst():   O(1)
 * - removeLast():    O(1)
 * - remove(node):    O(1) given direct reference
 * 
 * Applications in Gameberry:
 * 1. Match history / Rivalry Timeline: O(1) prepend for recent matches and O(1) append.
 * 2. Snake game body representation: O(1) add new head, O(1) remove tail when moving.
 */
public class DoublyLinkedList<T> implements Iterable<T> {

    public static class Node<T> {
        public T value;
        public Node<T> prev;
        public Node<T> next;

        public Node(T value) {
            this.value = value;
        }
    }

    private final Node<T> head;
    private final Node<T> tail;
    private int size;

    public DoublyLinkedList() {
        head = new Node<>(null);
        tail = new Node<>(null);
        head.next = tail;
        tail.prev = head;
        size = 0;
    }

    public Node<T> addFirst(T value) {
        Node<T> node = new Node<>(value);
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
        size++;
        return node;
    }

    public Node<T> addLast(T value) {
        Node<T> node = new Node<>(value);
        node.prev = tail.prev;
        node.next = tail;
        tail.prev.next = node;
        tail.prev = node;
        size++;
        return node;
    }

    public T removeFirst() {
        if (isEmpty()) throw new NoSuchElementException("List is empty");
        return removeNode(head.next);
    }

    public T removeLast() {
        if (isEmpty()) throw new NoSuchElementException("List is empty");
        return removeNode(tail.prev);
    }

    public T removeNode(Node<T> node) {
        if (node == head || node == tail) {
            throw new IllegalArgumentException("Cannot remove sentinel nodes");
        }
        node.prev.next = node.next;
        node.next.prev = node.prev;
        size--;
        return node.value;
    }

    public T peekFirst() {
        if (isEmpty()) return null;
        return head.next.value;
    }

    public T peekLast() {
        if (isEmpty()) return null;
        return tail.prev.value;
    }

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public void clear() {
        head.next = tail;
        tail.prev = head;
        size = 0;
    }

    public List<T> toList() {
        List<T> list = new ArrayList<>(size);
        Node<T> curr = head.next;
        while (curr != tail) {
            list.add(curr.value);
            curr = curr.next;
        }
        return list;
    }

    @Override
    public Iterator<T> iterator() {
        return new Iterator<>() {
            private Node<T> current = head.next;

            @Override
            public boolean hasNext() {
                return current != tail;
            }

            @Override
            public T next() {
                if (!hasNext()) throw new NoSuchElementException();
                T val = current.value;
                current = current.next;
                return val;
            }
        };
    }
}
