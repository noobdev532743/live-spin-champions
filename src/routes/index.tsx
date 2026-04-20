import { createFileRoute, Link } from "@tanstack/react-router";
import { Arena } from "@/components/game/Arena";
import { HUD } from "@/components/game/HUD";
import { Leaderboard } from "@/components/game/Leaderboard";
import { ControlPanel } from "@/components/game/ControlPanel";
import { EventTicker } from "@/components/game/EventTicker";
import { PostGame } from "@/components/game/PostGame";
import { SettingsPanel } from "@/components/game/SettingsPanel";
import { EventBridge } from "@/components/game/EventBridge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spin Stars — TikTok Live Battle Game" },
      { name: "description", content: "Lovable claymation spinning-top battle. Follow, share, and gift to power your favorite avatar." },
      { property: "og:title", content: "Spin Stars — TikTok Live Battle" },
      { property: "og:description", content: "Cute claymation spinning-top battle royale powered by viewer actions." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-gradient-sky pb-6">
      <EventBridge />

      {/* Brand bar */}
      <header className="flex items-center justify-between px-4 pt-3 pb-2 max-w-7xl mx-auto">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          <span className="text-primary">Spin</span> Stars ✨
        </h1>
        <Link to="/relay" className="text-[10px] font-bold rounded-full bg-card px-2 py-1 shadow">RELAY</Link>
      </header>

      {/* Two-column layout */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col lg:flex-row gap-4">

          {/* LEFT column: Arena + Events + Leaderboard */}
          <div className="flex-1 min-w-0 space-y-3">
            <HUD />

            {/* Arena */}
            <div className="relative rounded-3xl bg-card/40 p-3 shadow-clay overflow-hidden flex items-center justify-center">
              <Arena />
            </div>

            <EventTicker />

            <Leaderboard />
          </div>

          {/* RIGHT column: Settings + Controls */}
          <div className="w-full lg:w-80 shrink-0 space-y-3">
            <SettingsPanel />
            <ControlPanel />

            <p className="text-[10px] text-center text-muted-foreground px-4 leading-snug">
              Stream this on TikTok Live — viewer follows, shares, likes & gifts power the spinning tops in real time.
              Last avatar standing wins. Use the relay endpoint to connect TikFinity.
            </p>
          </div>
        </div>
      </div>

      <PostGame />
    </div>
  );
}
