# Spin Stars — TikTok Live Bridge

Jembatan kecil yang baca event TikTok Live (follow / like / share / gift) dari akun kamu, lalu POST ke `/api/event` Spin Stars. **Gratis, open source, tidak kena reCAPTCHA**.

## Yang dibutuhkan

- Node.js 18+ ([download](https://nodejs.org/))
- TikTok Live kamu **sedang berjalan** (bridge tidak bisa konek kalau belum live)

## Setup (1 menit)

```bash
cd bridge
npm install
```

Lalu jalankan sesuai OS kamu (ganti `kohcun` dengan username TikTok kamu, tanpa `@`):

**Windows PowerShell:**
```powershell
$env:TIKTOK_USERNAME="kohcun"
npm start
```

**Windows CMD:**
```cmd
set TIKTOK_USERNAME=kohcun && npm start
```

**macOS / Linux:**
```bash
TIKTOK_USERNAME=kohcun npm start
```

Output yang sehat:

```
🎯 Bridge → https://live-spin-champions.lovable.app/api/event
👤 TikTok user: @kohcun
✅ Connected to room 1234567890 (viewers: 42)
→ like   @viewer1  [200] {"ok":true,...}
→ gift   @bigfan   [200] {"ok":true,...}
```

Setiap event yang masuk langsung spawn spinner di arena.

## Custom target URL

Kalau kamu test di preview, set `TARGET_URL` juga:

**PowerShell:**
```powershell
$env:TIKTOK_USERNAME="kohcun"
$env:TARGET_URL="https://id-preview--ee13df3f-3b8c-4126-b5bf-9faa92c24b48.lovable.app"
npm start
```

**macOS / Linux:**
```bash
TIKTOK_USERNAME=kohcun TARGET_URL=https://id-preview--ee13df3f-3b8c-4126-b5bf-9faa92c24b48.lovable.app npm start
```

## Troubleshooting

- **`Failed to connect`** → akun belum live, atau username salah. Mulai live dulu, lalu jalankan ulang.
- **Tidak ada event masuk** tapi connected → coba kirim like/follow dari HP lain untuk verifikasi.
- **Mau jalan terus**: pakai `pm2 start index.js --name spinstars-bridge`.

## Cara kerja

Pakai library open source [`tiktok-live-connector`](https://github.com/zerodytrash/TikTok-Live-Connector) yang nge-tap WebSocket TikTok Live secara langsung dari PC kamu (bukan browser), jadi tidak kena rate limit reCAPTCHA. Bridge POST ke `/api/event` → server SSE broadcast ke `/relay` → game spawn spinner.
