import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-md bg-bg-subtle px-3 py-2.5 text-sm text-fg shadow-(--shadow-border) placeholder:text-subtle",
        "transition-[box-shadow] duration-(--motion-quick) ease-(--ease-out)",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
      {...props}
    />
  );
}
