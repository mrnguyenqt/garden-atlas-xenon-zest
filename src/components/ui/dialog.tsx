import { useEffect, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useBackToClose } from "@/lib/phone-nav";
import { cn } from "@/lib/utils";

export function Dialog(props: DialogPrimitive.DialogProps) {
  useBackToClose(Boolean(props.open), () => props.onOpenChange?.(false));
  useEffect(() => {
    if (props.open) return;
    document.body.style.removeProperty("pointer-events");
  }, [props.open]);
  return <DialogPrimitive.Root modal={false} {...props} />;
}
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  title,
}: {
  className?: string;
  children: ReactNode;
  title: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-bg/80 data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out" />
      <DialogPrimitive.Content
        className={cn(
          "dialog-sheet fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-bg-elevated p-5 shadow-(--shadow-border)",
          "data-[state=open]:animate-modal-in data-[state=closed]:animate-modal-out",
          "max-h-[min(32rem,80dvh)] min-w-0 overflow-x-hidden overflow-y-auto",
          className,
        )}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => {
          const root = e.currentTarget;
          const first = root.querySelector<HTMLElement>("input, textarea, button[aria-haspopup='listbox']");
          if (first) {
            e.preventDefault();
            window.setTimeout(() => first.focus(), 50);
          }
        }}
        style={{ pointerEvents: "auto" }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <DialogPrimitive.Title className="font-display text-xl leading-snug text-fg text-balance">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close className="flex size-11 items-center justify-center rounded-sm text-muted transition-colors hover:bg-bg-subtle hover:text-fg">
            <X className="size-4" />
            <span className="sr-only">Đóng</span>
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
