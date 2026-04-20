import { createFileRoute } from "@tanstack/react-router";
import { publish } from "@/server/eventBus";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const ALLOWED = ["follow", "share", "gift", "like"] as const;
type Action = typeof ALLOWED[number];

// TikFinity / TikTokLive bridges send wildly different shapes. Normalize them.
function normalize(raw: any, urlAction?: string | null, urlUser?: string | null) {
  const data = raw?.data ?? raw ?? {};
  // event type can come from: raw.event, raw.action, raw.type, or URL ?action=
  let action = String(
    raw?.action ?? raw?.event ?? raw?.type ?? urlAction ?? ""
  ).toLowerCase().trim();
  // TikFinity uses "chat", "like", "follow", "share", "gift", "subscribe", "member"
  if (action === "subscribe" || action === "member") action = "follow";
  if (action === "chat") action = "like";
  if (!ALLOWED.includes(action as Action)) return null;

  const username = String(
    data?.uniqueId ?? data?.username ?? data?.user?.uniqueId ?? data?.user?.username ??
    raw?.uniqueId ?? raw?.username ?? urlUser ?? "anon"
  ).slice(0, 32).replace(/^@/, "");

  const giftValue = Number(
    data?.diamondCount ?? data?.giftValue ?? data?.gift?.diamond_count ??
    raw?.diamondCount ?? raw?.giftValue ?? 0
  ) || undefined;

  return {
    id: Math.random().toString(36).slice(2),
    username: username || "anon",
    action: action as Action,
    giftValue,
    ts: Date.now(),
  };
}

export const Route = (createFileRoute("/api/event") as any)({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      // GET makes browser-bar testing trivial: /api/event?action=gift&u=tester
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const event = normalize({}, url.searchParams.get("action"), url.searchParams.get("u") ?? url.searchParams.get("username"));
        if (!event) {
          return new Response(JSON.stringify({ ok: false, error: "missing or invalid action", hint: "use ?action=follow|share|like|gift&u=name" }), {
            status: 400, headers: { "Content-Type": "application/json", ...cors },
          });
        }
        publish(event);
        return new Response(JSON.stringify({ ok: true, event, listeners: "broadcasted" }), {
          status: 200, headers: { "Content-Type": "application/json", ...cors },
        });
      },
      POST: async ({ request }: { request: Request }) => {
        try {
          const url = new URL(request.url);
          let body: any = {};
          const ct = request.headers.get("content-type") ?? "";
          if (ct.includes("application/json")) {
            body = await request.json().catch(() => ({}));
          } else if (ct.includes("form")) {
            const fd = await request.formData();
            body = Object.fromEntries(fd.entries());
          } else {
            const txt = await request.text();
            try { body = JSON.parse(txt); } catch { body = { raw: txt }; }
          }
          const event = normalize(body, url.searchParams.get("action"), url.searchParams.get("u") ?? url.searchParams.get("username"));
          if (!event) {
            return new Response(JSON.stringify({ ok: false, error: "invalid action", got: body }), {
              status: 400, headers: { "Content-Type": "application/json", ...cors },
            });
          }
          publish(event);
          return new Response(JSON.stringify({ ok: true, event }), {
            status: 200, headers: { "Content-Type": "application/json", ...cors },
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ ok: false, error: "bad request", message: String(e?.message ?? e) }), {
            status: 400, headers: { "Content-Type": "application/json", ...cors },
          });
        }
      },
    },
  },
});
