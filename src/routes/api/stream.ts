import { createFileRoute } from "@tanstack/react-router";
import { subscribe } from "@/server/event-bus";

export const Route = (createFileRoute("/api/stream") as any)({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const channel = (url.searchParams.get("u") || "default").toLowerCase();
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
          start(controller) {
            const send = (data: string) => {
              try { controller.enqueue(encoder.encode(`data: ${data}\n\n`)); } catch { /* closed */ }
            };
            send(JSON.stringify({ type: "hello", channel, ts: Date.now() }));
            const unsub = subscribe(channel, send);

            // keepalive
            const ka = setInterval(() => {
              try { controller.enqueue(encoder.encode(`: ka\n\n`)); } catch { /* closed */ }
            }, 25_000);

            const close = () => { clearInterval(ka); unsub(); try { controller.close(); } catch { /* ignore */ } };
            request.signal.addEventListener("abort", close);
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});
