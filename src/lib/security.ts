import { create } from "zustand";
import { persist } from "zustand/middleware";

export const PIN_LEN = 4;
export const LOCK_DELAYS = [
  { id: 0, label: "Ngay khi rời app" },
  { id: 30, label: "Sau 30 giây" },
  { id: 120, label: "Sau 2 phút" },
] as const;

export type LockDelay = (typeof LOCK_DELAYS)[number]["id"];

type SecurityState = {
  pinOn: boolean;
  pinHash: string;
  salt: string;
  screenshotBlock: boolean;
  lockDelaySec: LockDelay;
  setPinOn: (on: boolean) => void;
  setPinSecret: (salt: string, hash: string) => void;
  clearPin: () => void;
  setScreenshotBlock: (on: boolean) => void;
  setLockDelaySec: (sec: LockDelay) => void;
};

let sessionUnlocked = false;
let hiddenAt = 0;

export function isSessionUnlocked() {
  return sessionUnlocked;
}

export function setSessionUnlocked(on: boolean) {
  sessionUnlocked = on;
  if (on) hiddenAt = 0;
}

export function markAppHidden() {
  hiddenAt = Date.now();
}

export function shouldRelock(lockDelaySec: number, pinOn: boolean) {
  if (!pinOn || !sessionUnlocked) return pinOn && !sessionUnlocked;
  if (hiddenAt <= 0) return false;
  return Date.now() - hiddenAt >= lockDelaySec * 1000;
}

export const useSecurity = create<SecurityState>()(
  persist(
    (set) => ({
      pinOn: false,
      pinHash: "",
      salt: "",
      screenshotBlock: false,
      lockDelaySec: 30,
      setPinOn: (pinOn) => set({ pinOn }),
      setPinSecret: (salt, pinHash) => set({ salt, pinHash, pinOn: true }),
      clearPin: () => {
        sessionUnlocked = false;
        set({ pinOn: false, pinHash: "", salt: "" });
      },
      setScreenshotBlock: (screenshotBlock) => set({ screenshotBlock }),
      setLockDelaySec: (lockDelaySec) => set({ lockDelaySec }),
    }),
    { name: "rung-security-v1", skipHydration: true },
  ),
);

export function peekPinLocked() {
  try {
    const raw = localStorage.getItem("rung-security-v1");
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { state?: { pinOn?: boolean; pinHash?: string } };
    return Boolean(parsed?.state?.pinOn && parsed?.state?.pinHash);
  } catch {
    return false;
  }
}

function bytesToHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function newSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPin(pin: string, salt: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${pin}`));
  return bytesToHex(buf);
}

export async function pinMatches(pin: string, salt: string, hash: string) {
  if (!salt || !hash || pin.length !== PIN_LEN) return false;
  return (await hashPin(pin, salt)) === hash;
}

type SecureBridge = { setScreenshotBlock: (on: boolean) => void };

function bridge(): SecureBridge | null {
  if (typeof window === "undefined") return null;
  const b = (window as Window & { RungVangSecure?: SecureBridge }).RungVangSecure;
  if (!b || typeof b.setScreenshotBlock !== "function") return null;
  return b;
}

export function applyScreenshotBlock(on: boolean) {
  try {
    bridge()?.setScreenshotBlock(on);
  } catch {
    /* web preview */
  }
}

export const SYSTEM_GUARDS = [
  { label: "Sao lưu ADB / đám mây", detail: "Tắt — số liệu không trích ra máy khác" },
  { label: "HTTP rõ", detail: "Cấm — chỉ HTTPS" },
  { label: "Debuggable", detail: "Tắt — bản phát hành" },
  { label: "WebView", detail: "Tắt debug, cấm mixed content" },
  { label: "FileProvider", detail: "Không xuất, giới hạn thư mục" },
] as const;
