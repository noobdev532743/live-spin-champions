import { createFileRoute } from "@tanstack/react-router";
import { publish } from "@/server/event-bus";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = (createFileRoute("/api/event") as any)({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          const channel = (url.searchParams.get("u") || "default").toLowerCase();
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
            avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl : undefined,
            targetId: body.targetId,
            giftValue: typeof body.giftValue === "number" ? body.giftValue : undefined,
            ts: Date.now(),
          };
          publish(channel, event);
          return new Response(JSON.stringify({ ok: true, event }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...cors },
          });
        } catch {
          return new Response(JSON.stringify({ error: "bad request" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...cors },
          });
        }
      },
    },
  },
});
