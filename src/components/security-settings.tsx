import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";
import { PinDots, PinPad, usePinEntry } from "@/components/security-lock";
import { useBackToClose } from "@/lib/phone-nav";
import {
  LOCK_DELAYS,
  PIN_LEN,
  SYSTEM_GUARDS,
  applyScreenshotBlock,
  hashPin,
  newSalt,
  pinMatches,
  setSessionUnlocked,
  useSecurity,
  type LockDelay,
} from "@/lib/security";
import { cn } from "@/lib/utils";

type Step = "home" | "set" | "confirm" | "off" | "change";

export function SecuritySettings() {
  const pinOn = useSecurity((s) => s.pinOn);
  const pinHash = useSecurity((s) => s.pinHash);
  const salt = useSecurity((s) => s.salt);
  const screenshotBlock = useSecurity((s) => s.screenshotBlock);
  const lockDelaySec = useSecurity((s) => s.lockDelaySec);
  const setScreenshot = useSecurity((s) => s.setScreenshotBlock);
  const setDelay = useSecurity((s) => s.setLockDelaySec);
  const setSecret = useSecurity((s) => s.setPinSecret);
  const clearPin = useSecurity((s) => s.clearPin);

  const [step, setStep] = useState<Step>("home");
  const [pending, setPending] = useState("");
  const entry = usePinEntry();
  useBackToClose(step !== "home", () => {
    entry.reset();
    setPending("");
    setStep("home");
  });

  useEffect(() => {
    applyScreenshotBlock(screenshotBlock);
  }, [screenshotBlock]);

  function goHome() {
    entry.reset();
    setPending("");
    setStep("home");
  }

  async function onFull(nextStep: Step) {
    if (entry.pin.length !== PIN_LEN) return;
    if (nextStep === "set") {
      setPending(entry.pin);
      entry.reset();
      setStep("confirm");
      return;
    }
    if (nextStep === "confirm") {
      if (entry.pin !== pending) {
        entry.reset();
        entry.setError("Hai lần nhập không khớp");
        return;
      }
      const s = newSalt();
      const hash = await hashPin(entry.pin, s);
      setSecret(s, hash);
      setSessionUnlocked(true);
      goHome();
      return;
    }
    const ok = await pinMatches(entry.pin, salt, pinHash);
    if (!ok) {
      entry.reset();
      entry.setError("Sai mã PIN");
      return;
    }
    if (nextStep === "off") {
      clearPin();
      goHome();
      return;
    }
    entry.reset();
    setStep("set");
  }

  useEffect(() => {
    if (step === "home" || entry.pin.length !== PIN_LEN) return;
    const t = window.setTimeout(() => void onFull(step), 80);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only fire when PIN is full
  }, [entry.pin, step]);

  if (step !== "home") {
    const title =
      step === "off" ? "Nhập mã PIN hiện tại" : step === "change" ? "Nhập mã PIN hiện tại" : step === "confirm" ? "Nhập lại mã PIN mới" : "Nhập mã PIN mới (4 số)";
    return (
      <div>
        <p className="text-center text-sm text-muted">{title}</p>
        {entry.error ? <p className="mt-2 text-center text-sm text-danger">{entry.error}</p> : null}
        <div className="mt-5">
          <PinDots value={entry.pin} error={Boolean(entry.error)} />
        </div>
        <div className="mt-6">
          <PinPad onDigit={entry.digit} onBack={entry.back} />
        </div>
        <Button type="button" variant="secondary" className="mt-4 w-full" onClick={goHome}>
          Huỷ
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <ToggleRow
        label="Khóa bằng mã PIN"
        hint="4 số — mở app mới thấy số liệu"
        on={pinOn}
        onClick={() => setStep(pinOn ? "off" : "set")}
      />
      {pinOn ? (
        <>
          <button
            type="button"
            onClick={() => setStep("change")}
            className="flex min-h-11 items-center justify-between rounded-xl bg-bg-subtle px-4 text-left text-sm font-medium"
          >
            Đổi mã PIN
          </button>
          <Field label="Tự khóa" htmlFor="lock-delay">
            <Select
              id="lock-delay"
              value={String(lockDelaySec)}
              onChange={(e) => setDelay(Number(e.target.value) as LockDelay)}
            >
              {LOCK_DELAYS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>
        </>
      ) : null}
      <ToggleRow
        label="Chặn chụp màn hình"
        hint="Ẩn app khi chụp hoặc ghi hình"
        on={screenshotBlock}
        onClick={() => setScreenshot(!screenshotBlock)}
      />

      <p className="mt-2 text-xs tracking-[0.16em] text-muted uppercase">Bảo vệ hệ thống</p>
      <ul className="grid gap-2">
        {SYSTEM_GUARDS.map((row) => (
          <li key={row.label} className="rounded-xl bg-bg-subtle px-4 py-3">
            <p className="flex items-center justify-between gap-3 text-sm font-medium">
              {row.label}
              <span className="text-ok">Đạt</span>
            </p>
            <p className="mt-0.5 text-xs text-muted">{row.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  on,
  onClick,
}: {
  label: string;
  hint: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 items-center justify-between gap-3 rounded-xl bg-bg-subtle px-4 text-left"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-xs text-muted">{hint}</span>
      </span>
      <span className={cn("shrink-0 text-sm font-medium", on ? "text-ok" : "text-muted")}>{on ? "Bật" : "Tắt"}</span>
    </button>
  );
}
