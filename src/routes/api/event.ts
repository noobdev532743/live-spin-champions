import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/event")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const username = String(body.username ?? "anon").slice(0, 32);
          const action = String(body.action ?? "like");
          if (!["follow", "share", "gift", "like"].includes(action)) {
            return new Response(JSON.stringify({ error: "invalid action" }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...cors },
            });
          }
          const event = {
            id: Math.random().toString(36).slice(2),
            username,
            action,
            targetId: body.targetId,
            giftValue: typeof body.giftValue === "number" ? body.giftValue : undefined,
            ts: Date.now(),
          };
          // Broadcast via SSE-less approach: we just respond — clients poll OR use BroadcastChannel locally.
          // For cross-device relay, this endpoint is the entry point; clients can also POST to /api/event
          // and the relay page (/relay) listens via BroadcastChannel within the same browser.
          return new Response(JSON.stringify({ ok: true, event }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...cors },
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: "bad request" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...cors },
          });
        }
      },
    },
  },
});
