package com.rivalryarena.dsa;

import org.junit.jupiter.api.Test;
import java.util.Comparator;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

public class DsaStructuresTest {

    @Test
    public void testDoublyLinkedList() {
        DoublyLinkedList<String> list = new DoublyLinkedList<>();
        assertTrue(list.isEmpty());
        list.addLast("A");
        list.addLast("B");
        list.addFirst("Z");

        assertEquals(3, list.size());
        assertEquals("Z", list.peekFirst());
        assertEquals("B", list.peekLast());

        assertEquals("Z", list.removeFirst());
        assertEquals("B", list.removeLast());
        assertEquals(1, list.size());
        assertEquals("A", list.removeFirst());
        assertTrue(list.isEmpty());
    }

    @Test
    public void testMinHeapPriorityQueue() {
        MinHeapPriorityQueue<Integer> heap = new MinHeapPriorityQueue<Integer>(Comparator.naturalOrder());
        heap.insert(50);
        heap.insert(10);
        heap.insert(30);
        heap.insert(5);
        heap.insert(20);

        assertEquals(5, heap.size());
        assertEquals(5, heap.peek());

        List<Integer> sorted = heap.getSortedList();
        assertEquals(List.of(5, 10, 20, 30, 50), sorted);

        assertEquals(5, heap.extractMin());
        assertEquals(10, heap.extractMin());
        assertEquals(20, heap.extractMin());
        assertEquals(30, heap.extractMin());
        assertEquals(50, heap.extractMin());
        assertTrue(heap.isEmpty());
    }

    @Test
    public void testCustomHashMap() {
        CustomHashMap<String, Integer> map = new CustomHashMap<>();
        map.put("p1", 100);
        map.put("p2", 200);
        map.put("p3", 300);

        assertEquals(3, map.size());
        assertEquals(100, map.get("p1"));
        assertEquals(200, map.get("p2"));

        map.put("p1", 999);
        assertEquals(999, map.get("p1"));
        assertEquals(3, map.size());

        assertEquals(200, map.remove("p2"));
        assertNull(map.get("p2"));
        assertEquals(2, map.size());
    }

    @Test
    public void testCustomStack() {
        CustomStack<Integer> stack = new CustomStack<>();
        stack.push(1);
        stack.push(2);
        stack.push(3);

        assertEquals(3, stack.size());
        assertEquals(3, stack.pop());
        assertEquals(2, stack.pop());
        assertEquals(1, stack.pop());
        assertTrue(stack.isEmpty());
    }

    @Test
    public void testCustomQueue() {
        CustomQueue<String> queue = new CustomQueue<>();
        queue.enqueue("first");
        queue.enqueue("second");
        queue.enqueue("third");

        assertEquals(3, queue.size());
        assertEquals("first", queue.dequeue());
        assertEquals("second", queue.dequeue());
        assertEquals("third", queue.dequeue());
        assertTrue(queue.isEmpty());
    }
}
