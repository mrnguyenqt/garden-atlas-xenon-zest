import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-sm bg-bg-subtle px-3 text-sm text-fg shadow-(--shadow-border) placeholder:text-subtle",
        "transition-[box-shadow] duration-(--motion-quick) ease-(--ease-out)",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
