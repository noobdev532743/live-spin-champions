// In-memory pub/sub for relaying TikTok webhook events to connected SSE clients.
// Note: lives in the server worker memory. Single-instance only (fine for one streamer).

type Listener = (data: string) => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function publish(event: unknown): void {
  const data = JSON.stringify(event);
  for (const l of listeners) {
    try { l(data); } catch { /* ignore */ }
  }
}
