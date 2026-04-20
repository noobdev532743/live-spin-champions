# Spin Stars — Local Dev (App + TikTok Bridge bareng)

Sekarang `npm run dev` di **root project** otomatis menjalankan **app** + **bridge TikTok Live** bareng. Tidak perlu 2 terminal.

## Setup sekali

```bash
npm install
```

## Jalankan

**Windows PowerShell:**
```powershell
$env:TIKTOK_USERNAME="kohcun"
npm run dev
```

**Windows CMD:**
```cmd
set TIKTOK_USERNAME=kohcun && npm run dev
```

**macOS / Linux:**
```bash
TIKTOK_USERNAME=kohcun npm run dev
```

Atau biar gampang, **buat file `.env` di root project** (sekali set, tidak perlu ketik lagi):

```
TIKTOK_USERNAME=kohcun
```

Lalu cukup:
```bash
npm run dev
```

## Yang terjadi

- App jalan di `http://localhost:3000`
- Bridge konek ke TikTok Live `@kohcun` → POST event ke `http://localhost:3000/api/event`
- Buka `http://localhost:3000/relay` → klik **Connect** → event TikTok langsung spawn spinner

## Log normal

```
[APP]    Local: http://localhost:3000
[BRIDGE] 🎯 Bridge → http://localhost:3000/api/event
[BRIDGE] 👤 TikTok user: @kohcun
[BRIDGE] ✅ Connected to room 1234567890 (viewers: 42)
[BRIDGE] → like   @viewer1  [200] {"ok":true,...}
[BRIDGE] → gift   @bigfan   [200] {"ok":true,...}
```

## Kalau belum live

Bridge auto-retry tiap 5 detik (exponential backoff sampai 60s). Mulai TikTok Live → bridge konek otomatis tanpa restart.

## Kalau `TIKTOK_USERNAME` belum di-set

Bridge tetap idle (tidak crash), app tetap jalan normal — kamu bisa pakai test buttons di `/relay`.

## Override target (kalau test ke production preview)

```bash
TIKTOK_USERNAME=kohcun TARGET_URL=https://live-spin-champions.lovable.app npm run dev
```

## Cara kerja

Pakai library open source [`tiktok-live-connector`](https://github.com/zerodytrash/TikTok-Live-Connector) yang nge-tap WebSocket TikTok Live langsung dari PC kamu (bukan browser), jadi **tidak kena reCAPTCHA**. Bridge POST ke `/api/event` → server SSE broadcast ke `/relay` → game spawn spinner.
