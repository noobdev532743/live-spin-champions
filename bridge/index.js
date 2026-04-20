// Spin Stars — TikTok Live → Webhook bridge
// Dijalankan otomatis lewat `npm run dev` (paralel dengan vite).
//
// Set username via env var TIKTOK_USERNAME (atau buat file .env di root).
// Default target URL: http://localhost:3000 (di-set lewat npm script).

import { WebcastPushConnection } from "tiktok-live-connector";

const USERNAME = (process.env.TIKTOK_USERNAME || "").replace(/^@/, "").trim();
const TARGET   = process.env.TARGET_URL || "http://localhost:3000";
const ENDPOINT = `${TARGET.replace(/\/$/, "")}/api/event`;

console.log(`🎯 Bridge → ${ENDPOINT}`);

if (!USERNAME) {
  console.log(`⏸  TIKTOK_USERNAME belum di-set. Bridge idle.`);
  console.log(`   Set di PowerShell:  $env:TIKTOK_USERNAME="kohcun"; npm run dev`);
  console.log(`   Atau buat file .env di root project berisi:  TIKTOK_USERNAME=kohcun`);
  // Tetap hidup biar concurrently tidak matiin proses app.
  setInterval(() => {}, 1 << 30);
} else {
  console.log(`👤 TikTok user: @${USERNAME}`);
  startBridge();
}

async function send(action, data = {}) {
  const payload = {
    action,
    username: data.uniqueId || data.username || "anon",
    nickname: data.nickname,
    avatarUrl: data.profilePictureUrl,
    giftValue: data.diamondCount,
  };
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const txt = await res.text();
    console.log(`→ ${action.padEnd(6)} @${payload.username}  [${res.status}] ${txt.slice(0, 80)}`);
  } catch (e) {
    console.error(`✖ ${action} send failed:`, e.message);
  }
}

let retryDelay = 5000;

function startBridge() {
  const tiktok = new WebcastPushConnection(USERNAME, {
    processInitialData: false,
    enableExtendedGiftInfo: true,
  });

  tiktok.connect()
    .then((state) => {
      retryDelay = 5000;
      console.log(`✅ Connected to room ${state.roomId} (viewers: ${state.viewerCount ?? "?"})`);
    })
    .catch((err) => {
      console.error(`❌ Failed to connect: ${err.message}`);
      console.error(`   Retry dalam ${retryDelay / 1000}s — pastikan @${USERNAME} sedang LIVE.`);
      setTimeout(startBridge, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 60000);
    });

  tiktok.on("follow", (d) => send("follow", d));
  tiktok.on("share",  (d) => send("share",  d));
  tiktok.on("like",   (d) => send("like",   d));
  tiktok.on("gift",   (d) => {
    if (d.giftType === 1 && !d.repeatEnd) return;
    send("gift", d);
  });

  tiktok.on("disconnected", () => {
    console.log("⚠ disconnected — reconnect dalam 5s.");
    setTimeout(startBridge, 5000);
  });
  tiktok.on("streamEnd", () => {
    console.log("📴 stream ended — coba reconnect dalam 30s.");
    setTimeout(startBridge, 30000);
  });
}
