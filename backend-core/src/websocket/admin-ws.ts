/**
 * Admin WebSocket - prefers HTTP-only cookie `finera_admin_access`; optional `?token=` for tooling.
 */

import { WebSocketServer } from "ws";
import type { Server } from "http";
import jwt from "jsonwebtoken";
import { getConfig } from "../config/index.js";
import { ADMIN_ACCESS_COOKIE, type AdminJwtPayload } from "../middlewares/adminAuth.js";

let wss: WebSocketServer | null = null;

function cookieValue(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return undefined;
}

export function attachAdminWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: "/ws/admin" });
  wss.on("connection", (ws, req) => {
    try {
      const url = new URL(req.url ?? "", "http://localhost");
      const token =
        url.searchParams.get("token") ?? cookieValue(req.headers.cookie, ADMIN_ACCESS_COOKIE);
      if (!token) {
        ws.close(4001, "missing admin session");
        return;
      }
      const config = getConfig();
      const decoded = jwt.verify(token, config.JWT_SECRET) as AdminJwtPayload;
      if (decoded.type !== "access" || decoded.kind !== "admin") {
        ws.close(4003, "not admin");
        return;
      }
      ws.send(JSON.stringify({ type: "dashboard:update", message: "connected", at: new Date().toISOString() }));
    } catch {
      ws.close(4002, "invalid token");
    }
  });
}

export function broadcastAdmin(msg: Record<string, unknown>): void {
  if (!wss) return;
  const data = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(data);
  }
}
