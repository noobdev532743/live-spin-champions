// Spin Stars — TikTok Live → Webhook bridge
// Jalankan di PC kamu sambil TikTok Live berjalan.
//
// Setup:
//   1) cd bridge
//   2) npm install
//   3) Edit USERNAME & TARGET di bawah (atau pakai env var)
//   4) npm start
//
// Atau via env:
//   TIKTOK_USERNAME=kohcun TARGET_URL=https://live-spin-champions.lovable.app npm start

import { WebcastPushConnection } from "tiktok-live-connector";

const USERNAME = (process.env.TIKTOK_USERNAME || "kohcun").replace(/^@/, "");
const TARGET   = process.env.TARGET_URL || "https://live-spin-champions.lovable.app";
const ENDPOINT = `${TARGET.replace(/\/$/, "")}/api/event`;

console.log(`🎯 Bridge → ${ENDPOINT}`);
console.log(`👤 TikTok user: @${USERNAME}`);

const tiktok = new WebcastPushConnection(USERNAME, {
  processInitialData: false,
  enableExtendedGiftInfo: true,
});

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

tiktok.connect()
  .then((state) => console.log(`✅ Connected to room ${state.roomId} (viewers: ${state.viewerCount ?? "?"})`))
  .catch((err) => {
    console.error(`❌ Failed to connect: ${err.message}`);
    console.error(`   Pastikan @${USERNAME} sedang LIVE.`);
    process.exit(1);
  });

tiktok.on("follow", (d) => send("follow", d));
tiktok.on("share",  (d) => send("share",  d));
tiktok.on("like",   (d) => send("like",   d));
tiktok.on("gift",   (d) => {
  // tiktok-live kirim event "gift" berkali-kali untuk streak gift; ambil hanya yang final.
  if (d.giftType === 1 && !d.repeatEnd) return;
  send("gift", d);
});

tiktok.on("disconnected", () => console.log("⚠ disconnected — coba reconnect manual (restart script)."));
tiktok.on("streamEnd",    () => console.log("📴 stream ended."));
