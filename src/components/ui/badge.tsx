import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  children,
}: {
  className?: string;
  tone?: "default" | "danger" | "ok";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        tone === "default" && "bg-bg-subtle text-muted",
        tone === "danger" && "bg-danger/15 text-danger",
        tone === "ok" && "bg-ok/15 text-ok",
        className,
      )}
    >
      {children}
    </span>
  );
}
