import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useBackToClose } from "@/lib/phone-nav";

/** Toàn màn hình — không dùng Radix (WebView khoá ô nhập lần 2). */
export function FormSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useBackToClose(open, onClose);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.style.removeProperty("pointer-events");
    const html = document.documentElement;
    html.style.removeProperty("pointer-events");
    return () => {
      document.body.style.overflow = prev;
      document.body.style.removeProperty("pointer-events");
    };
  }, [open]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-bg"
      style={{ pointerEvents: "auto" }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 pb-2"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <h2 className="font-display min-w-0 text-xl leading-snug italic">{title}</h2>
        <button
          type="button"
          aria-label="Đóng"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-bg-subtle text-fg shadow-(--shadow-border)"
          onClick={onClose}
        >
          <X className="size-5" />
        </button>
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto px-5 py-3"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))", WebkitOverflowScrolling: "touch" }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
