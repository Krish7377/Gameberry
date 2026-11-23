// ── DSA Structure Tests ──
import { describe, it, expect } from 'vitest';
import { Stack, Queue, DoublyLinkedList, HashMap, PriorityQueue } from '../structures.js';

// ════════════════════════════════════════════════════════════════
// Stack
// ════════════════════════════════════════════════════════════════
describe('Stack', () => {
  it('pushes and pops in LIFO order', () => {
    const s = new Stack();
    s.push(1); s.push(2); s.push(3);
    expect(s.pop()).toBe(3);
    expect(s.pop()).toBe(2);
    expect(s.pop()).toBe(1);
    expect(s.pop()).toBeUndefined();
  });

  it('peek returns top without removing', () => {
    const s = new Stack();
    s.push('a');
    expect(s.peek()).toBe('a');
    expect(s.size).toBe(1);
  });

  it('reports correct size', () => {
    const s = new Stack([10, 20, 30]);
    expect(s.size).toBe(3);
    s.pop();
    expect(s.size).toBe(2);
  });

  it('clear empties the stack', () => {
    const s = new Stack([1, 2, 3]);
    s.clear();
    expect(s.size).toBe(0);
    expect(s.peek()).toBeUndefined();
  });

  it('toArray returns copy', () => {
    const s = new Stack([1, 2]);
    const arr = s.toArray();
    arr.push(3);
    expect(s.size).toBe(2);
  });
});

// ════════════════════════════════════════════════════════════════
// Queue
// ════════════════════════════════════════════════════════════════
describe('Queue', () => {
  it('enqueues and dequeues in FIFO order', () => {
    const q = new Queue();
    q.enqueue('a'); q.enqueue('b'); q.enqueue('c');
    expect(q.dequeue()).toBe('a');
    expect(q.dequeue()).toBe('b');
    expect(q.dequeue()).toBe('c');
    expect(q.dequeue()).toBeUndefined();
  });

  it('tracks peak size', () => {
    const q = new Queue();
    q.enqueue(1); q.enqueue(2); q.enqueue(3);
    q.dequeue();
    expect(q.peakSize).toBe(3);
    expect(q.size).toBe(2);
  });

  it('compacts internal array after threshold', () => {
    const q = new Queue();
    for (let i = 0; i < 100; i++) q.enqueue(i);
    for (let i = 0; i < 80; i++) q.dequeue();
    expect(q.size).toBe(20);
    expect(q.dequeue()).toBe(80);
  });

  it('handles empty dequeue', () => {
    const q = new Queue();
    expect(q.dequeue()).toBeUndefined();
    expect(q.size).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════
// Doubly Linked List
// ════════════════════════════════════════════════════════════════
describe('DoublyLinkedList', () => {
  it('pushFront inserts at head', () => {
    const list = new DoublyLinkedList();
    list.pushFront(3); list.pushFront(2); list.pushFront(1);
    expect([...list.values()]).toEqual([1, 2, 3]);
    expect(list.size).toBe(3);
  });

  it('pushBack inserts at tail', () => {
    const list = new DoublyLinkedList();
    list.pushBack(1); list.pushBack(2); list.pushBack(3);
    expect([...list.values()]).toEqual([1, 2, 3]);
  });

  it('remove deletes a node and updates links', () => {
    const list = new DoublyLinkedList();
    const a = list.pushBack('a');
    const b = list.pushBack('b');
    const c = list.pushBack('c');
    list.remove(b);
    expect([...list.values()]).toEqual(['a', 'c']);
    expect(list.size).toBe(2);
  });

  it('popBack removes the tail', () => {
    const list = new DoublyLinkedList();
    list.pushBack(1); list.pushBack(2); list.pushBack(3);
    expect(list.popBack()).toBe(3);
    expect([...list.values()]).toEqual([1, 2]);
  });

  it('handles remove of head and tail', () => {
    const list = new DoublyLinkedList();
    const a = list.pushBack('a');
    const b = list.pushBack('b');
    list.remove(a);
    expect(list.head.value).toBe('b');
    list.remove(b);
    expect(list.head).toBeNull();
    expect(list.tail).toBeNull();
    expect(list.size).toBe(0);
  });

  it('single node: head and tail are the same', () => {
    const list = new DoublyLinkedList();
    const node = list.pushFront('only');
    expect(list.head).toBe(node);
    expect(list.tail).toBe(node);
    list.remove(node);
    expect(list.head).toBeNull();
    expect(list.tail).toBeNull();
  });
});

// ════════════════════════════════════════════════════════════════
// HashMap
// ════════════════════════════════════════════════════════════════
describe('HashMap', () => {
  it('set and get', () => {
    const map = new HashMap();
    map.set('name', 'Alice');
    expect(map.get('name')).toBe('Alice');
    expect(map.has('name')).toBe(true);
    expect(map.has('missing')).toBe(false);
  });

  it('overwrites existing key', () => {
    const map = new HashMap();
    map.set('x', 1);
    map.set('x', 2);
    expect(map.get('x')).toBe(2);
    expect(map.size).toBe(1);
  });

  it('delete removes key', () => {
    const map = new HashMap();
    map.set('a', 1); map.set('b', 2);
    expect(map.delete('a')).toBe(true);
    expect(map.has('a')).toBe(false);
    expect(map.size).toBe(1);
    expect(map.delete('a')).toBe(false);
  });

  it('resizes when load factor exceeds 0.75', () => {
    const map = new HashMap(4);
    for (let i = 0; i < 10; i++) map.set(`key${i}`, i);
    expect(map.size).toBe(10);
    expect(map.loadFactor).toBeLessThanOrEqual(0.75);
    for (let i = 0; i < 10; i++) expect(map.get(`key${i}`)).toBe(i);
  });

  it('entries iterates all key-value pairs', () => {
    const map = new HashMap();
    map.set('a', 1); map.set('b', 2);
    const entries = [...map.entries()];
    expect(entries).toHaveLength(2);
    expect(entries.map(([k]) => k).sort()).toEqual(['a', 'b']);
  });

  it('handles numeric keys', () => {
    const map = new HashMap();
    map.set(42, 'answer');
    expect(map.get(42)).toBe('answer');
  });
});

// ════════════════════════════════════════════════════════════════
// Priority Queue (Binary Heap)
// ════════════════════════════════════════════════════════════════
describe('PriorityQueue', () => {
  it('min-heap: pops smallest first', () => {
    const pq = new PriorityQueue((a, b) => a - b);
    pq.push(5); pq.push(1); pq.push(3); pq.push(2); pq.push(4);
    expect(pq.pop()).toBe(1);
    expect(pq.pop()).toBe(2);
    expect(pq.pop()).toBe(3);
    expect(pq.pop()).toBe(4);
    expect(pq.pop()).toBe(5);
  });

  it('max-heap: pops largest first', () => {
    const pq = new PriorityQueue((a, b) => b - a);
    pq.push(1); pq.push(5); pq.push(3);
    expect(pq.pop()).toBe(5);
    expect(pq.pop()).toBe(3);
    expect(pq.pop()).toBe(1);
  });

  it('peek returns root without removing', () => {
    const pq = new PriorityQueue((a, b) => a - b);
    pq.push(10); pq.push(5);
    expect(pq.peek()).toBe(5);
    expect(pq.size).toBe(2);
  });

  it('respects limit (top-k)', () => {
    // Max-heap with limit 3: keeps only the 3 smallest
    const pq = new PriorityQueue((a, b) => b - a, 3);
    for (const v of [10, 2, 8, 1, 5, 3, 7]) pq.push(v);
    // The heap keeps 3 elements, the top (root) is the largest of the 3 smallest
    expect(pq.size).toBe(3);
    const results = [];
    while (pq.size) results.push(pq.pop());
    // The 3 smallest are 1, 2, 3
    expect(results.sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });

  it('handles empty pop', () => {
    const pq = new PriorityQueue();
    expect(pq.pop()).toBeUndefined();
    expect(pq.peek()).toBeUndefined();
  });

  it('single element', () => {
    const pq = new PriorityQueue((a, b) => a - b);
    pq.push(42);
    expect(pq.pop()).toBe(42);
    expect(pq.size).toBe(0);
  });

  it('objects with custom comparator', () => {
    const pq = new PriorityQueue((a, b) => a.time - b.time);
    pq.push({ name: 'Alice', time: 120 });
    pq.push({ name: 'Bob', time: 90 });
    pq.push({ name: 'Carol', time: 110 });
    expect(pq.pop().name).toBe('Bob');
    expect(pq.pop().name).toBe('Carol');
    expect(pq.pop().name).toBe('Alice');
  });
});
