#!/usr/bin/env node
/**
 * Spin Stars — TikTok Live Bridge
 *
 * Usage:
 *   node tiktok-bridge.mjs <tiktok_username> [game_url]
 *
 * Examples:
 *   node tiktok-bridge.mjs my_handle
 *   node tiktok-bridge.mjs my_handle https://live-spin-champions.lovable.app
 *
 * Connects to TikTok Live (free, via tiktok-live-connector) and forwards
 * follow / share / like / gift events to your Spin Stars game's /api/event.
 */

import { WebcastPushConnection } from "tiktok-live-connector";

const username = (process.argv[2] || "").replace(/^@/, "");
const gameUrl = (process.argv[3] || "https://live-spin-champions.lovable.app").replace(/\/$/, "");

if (!username) {
  console.error("\n❌ Usage: node tiktok-bridge.mjs <tiktok_username> [game_url]\n");
  process.exit(1);
}

const endpoint = `${gameUrl}/api/event?u=${encodeURIComponent(username)}`;
console.log(`\n🌟 Spin Stars Bridge`);
console.log(`   TikTok user : @${username}`);
console.log(`   Forwarding  : ${endpoint}\n`);

const tiktok = new WebcastPushConnection(username, {
  enableExtendedGiftInfo: true,
  processInitialData: false,
});

async function send(action, data) {
  const payload = {
    username: data.uniqueId || data.nickname || "viewer",
    action,
    avatarUrl: data.profilePictureUrl,
    giftValue: data.giftValue,
    ts: Date.now(),
  };
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) console.warn(`   ⚠ ${action} HTTP ${res.status}`);
    else console.log(`   ✓ ${action.padEnd(7)} @${payload.username}`);
  } catch (e) {
    console.warn(`   ⚠ failed to send ${action}:`, e.message);
  }
}

tiktok
  .connect()
  .then((state) => {
    console.log(`✅ Connected to roomId ${state.roomId}\n`);
  })
  .catch((err) => {
    console.error(`\n❌ Could not connect to @${username}:`, err.message);
    console.error(`   Make sure @${username} is currently LIVE on TikTok.\n`);
    process.exit(1);
  });

tiktok.on("follow", (d) => send("follow", d));
tiktok.on("share", (d) => send("share", d));
tiktok.on("like", (d) => send("like", { ...d, giftValue: d.likeCount }));
tiktok.on("gift", (d) => {
  // Only count completed gifts (streak ended) so we don't double-fire
  if (d.giftType === 1 && !d.repeatEnd) return;
  send("gift", { ...d, giftValue: (d.diamondCount || 1) * (d.repeatCount || 1) });
});

tiktok.on("disconnected", () => console.log("⚠ disconnected — will auto-retry"));
tiktok.on("streamEnd", () => {
  console.log("📴 stream ended");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n👋 bye");
  tiktok.disconnect();
  process.exit(0);
});
