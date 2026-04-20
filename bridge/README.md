# Spin Stars — TikTok Live Bridge

A tiny local Node.js script that connects to your TikTok Live and forwards
follow / share / like / gift events to your Spin Stars game in real time.

It uses the free, open-source [`tiktok-live-connector`](https://github.com/zerodytrash/TikTok-Live-Connector)
library (no API keys, no paid services).

## 1. Install once

You need **Node.js 18+** installed on your computer.

```bash
cd bridge
npm install
```

## 2. Open the game and arm it

1. Open the game site (e.g. `https://live-spin-champions.lovable.app`).
2. Go to the **RELAY** page.
3. Type your TikTok username and press **Connect** so the game starts listening.

## 3. Start the bridge (while you're LIVE on TikTok)

```bash
node tiktok-bridge.mjs your_tiktok_handle
```

Or specify a custom game URL:

```bash
node tiktok-bridge.mjs your_tiktok_handle https://your-site.lovable.app
```

You'll see a line scroll past for every viewer action:

```
✓ follow  @viewer1
✓ like    @viewer2
✓ gift    @viewer3
```

Each event spawns / buffs a spinner in the arena. Stop with `Ctrl+C`.

## Troubleshooting

- **"Could not connect"** → make sure you are actually LIVE on TikTok right now.
- **Nothing appears in the game** → make sure you pressed **Connect** in `/relay`
  and that the username matches.
- **Some gifts feel duplicated** → the bridge only counts completed gift streaks,
  so the diamond total is accurate.
