import { useEffect, useState } from "react";
import { Delete } from "lucide-react";
import { useBackToClose } from "@/lib/phone-nav";
import {
  PIN_LEN,
  isSessionUnlocked,
  markAppHidden,
  peekPinLocked,
  pinMatches,
  setSessionUnlocked,
  shouldRelock,
  useSecurity,
} from "@/lib/security";
import { cn } from "@/lib/utils";

export function PinDots({ value, error }: { value: string; error?: boolean }) {
  return (
    <div className="flex justify-center gap-3" aria-hidden>
      {Array.from({ length: PIN_LEN }, (_, i) => (
        <span
          key={i}
          className={cn(
            "size-3 rounded-full transition-colors duration-(--motion-quick)",
            error ? "bg-danger" : i < value.length ? "bg-primary" : "bg-bg-subtle shadow-(--shadow-border)",
          )}
        />
      ))}
    </div>
  );
}

export function PinPad({ onDigit, onBack, disabled }: { onDigit: (d: string) => void; onBack: () => void; disabled?: boolean }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;
  return (
    <div role="group" aria-label="Bàn phím mã PIN" className="mx-auto grid w-full max-w-xs grid-cols-3 gap-2">
      {keys.map((key, i) => {
        if (!key) return <div key={`empty-${i}`} aria-hidden />;
        const back = key === "back";
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            aria-label={back ? "Xóa" : key}
            onClick={() => (back ? onBack() : onDigit(key))}
            className={cn(
              "flex h-14 items-center justify-center rounded-md text-2xl font-medium transition-colors duration-(--motion-quick) active:scale-[0.98]",
              back ? "bg-bg-subtle text-fg" : "bg-fg text-bg",
            )}
          >
            {back ? <Delete className="size-6" /> : key}
          </button>
        );
      })}
    </div>
  );
}

export function SecurityLock() {
  const pinOn = useSecurity((s) => s.pinOn);
  const pinHash = useSecurity((s) => s.pinHash);
  const salt = useSecurity((s) => s.salt);
  const lockDelaySec = useSecurity((s) => s.lockDelaySec);
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (peekPinLocked() && !isSessionUnlocked()) setLocked(true);
  }, []);

  useBackToClose(locked, () => {
    const cap = (window as unknown as { Capacitor?: { Plugins?: { App?: { exitApp?: () => void } } } }).Capacitor;
    cap?.Plugins?.App?.exitApp?.();
  });

  useEffect(() => {
    function sync() {
      if (!pinOn || !pinHash) {
        setLocked(false);
        return;
      }
      if (document.visibilityState === "hidden") {
        markAppHidden();
        return;
      }
      if (shouldRelock(lockDelaySec, pinOn)) {
        setSessionUnlocked(false);
        setPin("");
        setError(false);
        setLocked(true);
      } else if (!isSessionUnlocked()) {
        setLocked(true);
      }
    }
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [pinOn, pinHash, lockDelaySec]);

  async function tryUnlock(next: string) {
    if (next.length !== PIN_LEN || busy) return;
    setBusy(true);
    const ok = await pinMatches(next, salt, pinHash);
    setBusy(false);
    if (ok) {
      setSessionUnlocked(true);
      setPin("");
      setError(false);
      setLocked(false);
      return;
    }
    setError(true);
    setPin("");
    window.setTimeout(() => setError(false), 500);
  }

  function digit(d: string) {
    if (busy || pin.length >= PIN_LEN) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === PIN_LEN) void tryUnlock(next);
  }

  if (!locked) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-bg px-6 pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)] text-fg">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center">
        <img src="/logo.png" alt="" width={56} height={56} className="size-14 rounded-[22%] object-cover" />
        <p className="font-display mt-4 text-2xl italic">Rừng vàng</p>
        <p className="mt-2 text-sm text-muted">{error ? "Sai mã PIN" : "Nhập mã PIN để mở số liệu"}</p>
        <div className="mt-6">
          <PinDots value={pin} error={error} />
        </div>
        <div className="mt-8 w-full">
          <PinPad onDigit={digit} onBack={() => setPin((v) => v.slice(0, -1))} disabled={busy} />
        </div>
      </div>
    </div>
  );
}

export function usePinEntry() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function digit(d: string) {
    setError("");
    setPin((v) => (v.length >= PIN_LEN ? v : v + d));
  }

  function back() {
    setError("");
    setPin((v) => v.slice(0, -1));
  }

  function reset() {
    setPin("");
    setError("");
  }

  return { pin, error, setError, digit, back, reset, full: pin.length === PIN_LEN };
}
