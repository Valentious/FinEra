/** Presets for client demo / presentation mode (`/mobile-preview`). */

export const MOBILE_SIM_DEVICE_STORAGE_KEY = "finera-mobile-sim-device";

export const MOBILE_SIM_DEVICES = {
  iphone: {
    w: 375,
    h: 812,
    statusH: 47,
    label: "iPhone",
    frameRadius: "2.5rem" as const,
    island: true,
  },
  android: {
    w: 360,
    h: 800,
    statusH: 36,
    label: "Android",
    frameRadius: "1.5rem" as const,
    island: false,
  },
} as const;

export type MobileSimDeviceId = keyof typeof MOBILE_SIM_DEVICES;

export function getMobileSimPreviewUrl(): string {
  const u = new URL(import.meta.env.BASE_URL || "/", window.location.origin);
  u.searchParams.set("simEmbedded", "1");
  return u.href;
}
