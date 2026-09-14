import { useState } from "react";
import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  gpsAccuracyGrade,
  isGpsVerified,
  watchGps,
  type GpsFix,
} from "@/lib/gps";
import { cn, nf0 } from "@/lib/utils";

export function GpsVerifyButton({
  onFix,
  compact = false,
  className,
}: {
  onFix: (fix: GpsFix) => void;
  compact?: boolean;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<GpsFix | null>(null);

  async function locate() {
    setBusy(true);
    setLive(null);
    try {
      const fix = await watchGps(setLive);
      const grade = gpsAccuracyGrade(fix.accuracyM);
      if (!grade.ok) {
        const ok = confirm(
          `Sai số ±${nf0.format(fix.accuracyM)} m — ${grade.label}. ${grade.hint}\nVẫn lưu toạ độ này?`,
        );
        if (!ok) return;
      }
      onFix(fix);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Không lấy được GPS.");
    } finally {
      setBusy(false);
      setLive(null);
    }
  }

  const liveGrade = live ? gpsAccuracyGrade(live.accuracyM) : null;

  return (
    <div className={cn("relative min-w-0", className)}>
      <Button
        type="button"
        variant={compact ? "secondary" : "default"}
        size={compact ? "sm" : "default"}
        className="w-full"
        disabled={busy}
        onClick={() => void locate()}
      >
        <LocateFixed />
        {busy ? "Đang kiểm tra…" : "Kiểm tra GPS"}
      </Button>
      {busy && live && liveGrade ? (
        <p className={cn("absolute top-full left-0 z-10 mt-1 whitespace-nowrap text-xs tabular-nums", liveGrade.ok ? "text-ok" : "text-danger")}>
          ±{nf0.format(live.accuracyM)} m · {liveGrade.label}
        </p>
      ) : null}
    </div>
  );
}

export function GpsStatus({
  gpsLat,
  gpsLng,
  gpsAccuracyM,
  gpsAt,
}: {
  gpsLat?: number;
  gpsLng?: number;
  gpsAccuracyM?: number;
  gpsAt?: string;
}) {
  if (!isGpsVerified({ gpsAt, gpsLat, gpsLng })) {
    return <p className="text-sm text-muted">Chưa kiểm tra GPS.</p>;
  }
  const grade = gpsAccuracyGrade(gpsAccuracyM);
  return (
    <div className="text-sm">
      <p className={cn("font-medium tabular-nums", grade.ok ? "text-ok" : "text-danger")}>
        Độ chính xác ±{nf0.format(gpsAccuracyM ?? 0)} m · {grade.label}
      </p>
      <p className="mt-0.5 text-xs text-subtle">{grade.hint}</p>
    </div>
  );
}
