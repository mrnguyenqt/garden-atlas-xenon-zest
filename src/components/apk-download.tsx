import { useState } from "react";
import { Smartphone } from "lucide-react";
import { APP_BUILD } from "@/lib/app-version";
import { cn } from "@/lib/utils";

export const APK_FILE = `${APP_BUILD}.apk`;
export const APK_HREF = `/${APP_BUILD}.apk?download=1`;

function isPhoneLike() {
  if (typeof navigator === "undefined") return false;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) return true;
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(pointer: coarse)").matches);
}

async function saveBlob(blob: Blob, name: string) {
  const picker = (
    window as Window & {
      showSaveFilePicker?: (opts: {
        suggestedName?: string;
        types?: { description: string; accept: Record<string, string[]> }[];
      }) => Promise<{
        createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
      }>;
    }
  ).showSaveFilePicker;

  if (!isPhoneLike() && typeof picker === "function") {
    try {
      const handle = await picker({
        suggestedName: name,
        types: [
          {
            description: "Android APK",
            accept: { "application/vnd.android.package-archive": [".apk"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return "saved" as const;
    } catch (err) {
      if ((err as Error).name === "AbortError") return "cancel" as const;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return "downloaded" as const;
}

export function ApkDownload({
  compact = false,
  variant = "primary",
}: {
  compact?: boolean;
  variant?: "primary" | "chrome";
}) {
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState("");

  async function onClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setPct(0);
    try {
      const res = await fetch(APK_HREF, { cache: "no-store" });
      if (!res.ok) throw new Error("missing");
      const total = Number(res.headers.get("content-length") ?? 0);
      const mime = "application/vnd.android.package-archive";
      let blob: Blob;
      if (!res.body) {
        blob = new Blob([await res.arrayBuffer()], { type: mime });
        setPct(100);
      } else {
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.byteLength;
            if (total > 0) setPct(Math.min(99, Math.round((received / total) * 100)));
          }
        }
        blob = new Blob(chunks, { type: mime });
        setPct(100);
      }
      const result = await saveBlob(blob, APK_FILE);
      if (result === "cancel") setPct(0);
    } catch {
      setError("Không tải được từ khung xem. Dùng nút tải trong cửa sổ chat.");
      window.open(APK_HREF, "_blank", "noopener");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      <a
        href={APK_HREF}
        download={APK_FILE}
        target="_blank"
        rel="noopener"
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 rounded-xl px-5 shadow-(--shadow-border) transition-transform duration-(--motion-quick) hover:-translate-y-0.5",
          compact ? "min-h-12 py-2" : "min-h-16 py-4",
          variant === "chrome" ? "rounded-md bg-chrome-fg text-chrome" : "bg-primary text-primary-fg",
        )}
      >
        <Smartphone className="size-5 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{busy ? `Đang tải ${pct}%` : APK_FILE}</span>
          {compact ? null : (
            <span className={cn("mt-0.5 block text-sm", variant === "chrome" ? "text-chrome/80" : "text-primary-fg/80")}>
              {busy ? "Chọn nơi lưu trên máy tính" : "60 MB · bấm để lưu về máy tính"}
            </span>
          )}
        </span>
      </a>
      {error ? <p className="text-center text-xs text-danger">{error}</p> : null}
    </div>
  );
}
