import { createFileRoute } from "@tanstack/react-router";
import { subscribe } from "@/server/eventBus";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = (createFileRoute("/api/stream") as any)({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      GET: async () => {
        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            const send = (data: string) => {
              try { controller.enqueue(encoder.encode(`data: ${data}\n\n`)); } catch { /* closed */ }
            };
            // initial hello so the client knows the stream is open
            send(JSON.stringify({ type: "hello", ts: Date.now() }));
            const unsub = subscribe(send);
            // heartbeat every 20s to keep connection alive
            const hb = setInterval(() => {
              try { controller.enqueue(encoder.encode(`: ping\n\n`)); } catch { /* closed */ }
            }, 20000);
            // cleanup when stream is cancelled
            (controller as any)._cleanup = () => { clearInterval(hb); unsub(); };
          },
          cancel() {
            const c: any = this as any;
            c._cleanup?.();
          },
        });
        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            ...cors,
          },
        });
      },
    },
  },
});
