import { useEffect, useRef, useState } from "react";
import { fetchAdminSession, getAdminWebSocketUrl } from "../services/adminApi";

export type WsMessage = {
  type: string;
  event?: string;
  payload?: Record<string, unknown>;
  at?: string;
  message?: string;
};

export function useAdminWebSocket(enabled: boolean) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let ws: WebSocket | null = null;

    fetchAdminSession().then((ok) => {
      if (!ok || cancelled) return;
      ws = new WebSocket(getAdminWebSocketUrl());
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      ws.onerror = () => setConnected(false);
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data as string) as WsMessage;
          setLastMessage(data);
        } catch {
          setLastMessage({ type: "parse_error", message: String(ev.data) });
        }
      };
    });

    return () => {
      cancelled = true;
      ws?.close();
      wsRef.current = null;
    };
  }, [enabled]);

  return { connected, lastMessage };
}
