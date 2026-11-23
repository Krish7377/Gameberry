export class Stack {
  constructor(items = []) { this.items = [...items]; }
  push(value) { this.items.push(value); return this.items.length; }
  pop() { return this.items.pop(); }
  peek() { return this.items.at(-1); }
  clear() { this.items.length = 0; }
  get size() { return this.items.length; }
  toArray() { return [...this.items]; }
}

export class Queue {
  constructor(items = []) { this.items = [...items]; this.head = 0; this.peak = items.length; }
  enqueue(value) { this.items.push(value); this.peak = Math.max(this.peak, this.size); }
  dequeue() {
    if (this.size === 0) return undefined;
    const value = this.items[this.head++];
    if (this.head > 32 && this.head * 2 > this.items.length) {
      this.items = this.items.slice(this.head); this.head = 0;
    }
    return value;
  }
  get size() { return this.items.length - this.head; }
  get peakSize() { return this.peak; }
}

export class DoublyLinkedList {
  constructor() { this.head = null; this.tail = null; this.length = 0; }
  pushFront(value) {
    const node = { value, prev: null, next: this.head };
    if (this.head) this.head.prev = node; else this.tail = node;
    this.head = node; this.length += 1; return node;
  }
  pushBack(value) {
    const node = { value, prev: this.tail, next: null };
    if (this.tail) this.tail.next = node; else this.head = node;
    this.tail = node; this.length += 1; return node;
  }
  remove(node) {
    if (!node) return undefined;
    if (node.prev) node.prev.next = node.next; else this.head = node.next;
    if (node.next) node.next.prev = node.prev; else this.tail = node.prev;
    this.length -= 1; return node.value;
  }
  popBack() { return this.remove(this.tail); }
  *values() { for (let node = this.head; node; node = node.next) yield node.value; }
  get size() { return this.length; }
}

export class HashMap {
  constructor(capacity = 16) { this.buckets = Array.from({ length: capacity }, () => []); this.count = 0; }
  hash(key) {
    const value = String(key); let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
    return (hash >>> 0) % this.buckets.length;
  }
  set(key, value) {
    const bucket = this.buckets[this.hash(key)];
    const pair = bucket.find((entry) => entry[0] === key);
    if (pair) pair[1] = value; else { bucket.push([key, value]); this.count += 1; }
    if (this.loadFactor > 0.75) this.resize();
    return this;
  }
  get(key) { return this.buckets[this.hash(key)].find((entry) => entry[0] === key)?.[1]; }
  has(key) { return this.buckets[this.hash(key)].some((entry) => entry[0] === key); }
  delete(key) {
    const bucket = this.buckets[this.hash(key)]; const index = bucket.findIndex((entry) => entry[0] === key);
    if (index < 0) return false; bucket.splice(index, 1); this.count -= 1; return true;
  }
  resize() {
    const entries = [...this.entries()]; this.buckets = Array.from({ length: this.buckets.length * 2 }, () => []); this.count = 0;
    for (const [key, value] of entries) this.set(key, value);
  }
  *entries() { for (const bucket of this.buckets) yield* bucket; }
  get size() { return this.count; }
  get loadFactor() { return this.count / this.buckets.length; }
}

export class PriorityQueue {
  constructor(compare = (a, b) => a - b, limit = Infinity) { this.heap = []; this.compare = compare; this.limit = limit; }
  push(value) {
    this.heap.push(value); let index = this.heap.length - 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.compare(this.heap[index], this.heap[parent]) >= 0) break;
      [this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]]; index = parent;
    }
    if (this.heap.length > this.limit) this.pop();
    return this.heap.length;
  }
  pop() {
    if (!this.heap.length) return undefined;
    const first = this.heap[0]; const last = this.heap.pop();
    if (this.heap.length) {
      this.heap[0] = last; let index = 0;
      while (true) {
        const left = index * 2 + 1; const right = left + 1;
        let smallest = index;
        if (left < this.heap.length && this.compare(this.heap[left], this.heap[smallest]) < 0) smallest = left;
        if (right < this.heap.length && this.compare(this.heap[right], this.heap[smallest]) < 0) smallest = right;
        if (smallest === index) break;
        [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]]; index = smallest;
      }
    }
    return first;
  }
  peek() { return this.heap[0]; }
  get size() { return this.heap.length; }
}
