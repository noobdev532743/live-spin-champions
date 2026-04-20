import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { ViewerEvent } from "@/game/types";

// Public TikTok Live chat-reader server (open source, by @zerodytrash).
// Source: https://github.com/zerodytrash/TikTok-Chat-Reader
// This server bridges to TikTok Live and emits events over Socket.IO.
const DEFAULT_BRIDGE = "https://tiktok-chat-reader.zerody.one";

export type BridgeStatus = "idle" | "connecting" | "live" | "error" | "disconnected";

interface Options {
  username: string;
  enabled: boolean;
  bridgeUrl?: string;
  onEvent: (ev: ViewerEvent) => void;
  onLog?: (msg: string) => void;
}

/**
 * Auto-connects to a public TikTok Live bridge and streams live
 * follow / share / like / gift events for the given username.
 */
export function useTikTokLive({ username, enabled, bridgeUrl = DEFAULT_BRIDGE, onEvent, onLog }: Options) {
  const [status, setStatus] = useState<BridgeStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const onEventRef = useRef(onEvent);
  const onLogRef = useRef(onLog);
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);
  useEffect(() => { onLogRef.current = onLog; }, [onLog]);

  useEffect(() => {
    if (!enabled || !username) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setStatus("idle");
      return;
    }

    setStatus("connecting");
    setError(null);
    onLogRef.current?.(`🔌 connecting to bridge for @${username}…`);

    const socket = io(bridgeUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      onLogRef.current?.(`🔗 bridge socket open — joining @${username}`);
      socket.emit("setUniqueId", username, {
        enableExtendedGiftInfo: true,
      });
    });

    socket.on("tiktokConnected", (state: any) => {
      setStatus("live");
      onLogRef.current?.(`🟢 LIVE on TikTok — roomId ${state?.roomId ?? "?"}`);
    });

    socket.on("tiktokDisconnected", (msg: string) => {
      setStatus("error");
      const m = String(msg ?? "");
      if (/recaptcha/i.test(m)) {
        setError("Public bridge sedang di-rate-limit oleh TikTok (reCAPTCHA). Pakai TikFinity di PC sebagai gantinya.");
        onLogRef.current?.(`🚫 bridge ditolak TikTok (reCAPTCHA). Gunakan TikFinity di PC — lihat panduan di bawah.`);
      } else {
        setError(m || "disconnected");
        onLogRef.current?.(`🔴 bridge disconnected: ${m || "unknown"}`);
      }
    });

    socket.on("disconnect", () => {
      setStatus("disconnected");
    });

    socket.on("connect_error", (err) => {
      setStatus("error");
      setError(err?.message ?? "connect error");
      onLogRef.current?.(`⚠ bridge connect error: ${err?.message ?? err}`);
    });

    socket.on("streamEnd", () => {
      setStatus("disconnected");
      onLogRef.current?.(`🛑 stream ended`);
    });

    socket.on("roomUser", (msg: any) => {
      if (typeof msg?.viewerCount === "number") setViewerCount(msg.viewerCount);
    });

    const emit = (action: ViewerEvent["action"], data: any, giftValue?: number) => {
      const uname = String(data?.uniqueId ?? data?.nickname ?? "anon").slice(0, 32);
      onEventRef.current({
        id: Math.random().toString(36).slice(2),
        username: uname,
        action,
        avatarUrl: data?.profilePictureUrl,
        giftValue,
        ts: Date.now(),
      });
    };

    socket.on("follow", (d: any) => emit("follow", d));
    socket.on("share", (d: any) => emit("share", d));
    socket.on("like", (d: any) => emit("like", d));
    socket.on("gift", (d: any) => {
      // Only count gift once it's finished streaking
      if (d?.giftType === 1 && !d?.repeatEnd) return;
      const value = (d?.diamondCount ?? 0) * (d?.repeatCount ?? 1);
      emit("gift", d, value || undefined);
    });
    // member = "joined the live", treat as follow-style spawn
    socket.on("member", (d: any) => emit("follow", d));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [username, enabled, bridgeUrl]);

  return { status, error, viewerCount };
}
