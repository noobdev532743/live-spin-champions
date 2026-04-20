// Shared in-memory pub/sub for SSE fan-out within a single Worker isolate.
// Good enough for one streamer + their open game tabs. For multi-region
// scale you'd swap this for Durable Objects / Redis pub-sub.

type Subscriber = (data: string) => void;

const subscribers = new Map<string, Set<Subscriber>>();

export function subscribe(channel: string, fn: Subscriber): () => void {
  let set = subscribers.get(channel);
  if (!set) {
    set = new Set();
    subscribers.set(channel, set);
  }
  set.add(fn);
  return () => {
    set!.delete(fn);
    if (set!.size === 0) subscribers.delete(channel);
  };
}

export function publish(channel: string, payload: unknown) {
  const set = subscribers.get(channel);
  if (!set) return;
  const data = JSON.stringify(payload);
  for (const fn of set) {
    try { fn(data); } catch { /* ignore */ }
  }
}
