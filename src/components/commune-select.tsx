import { Check } from "lucide-react";
import { Field } from "@/components/ui/field";
import { COMMUNE_UNITS, parseCommunes, toggleCommune } from "@/lib/site";
import { cn } from "@/lib/utils";

export function CommuneSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const selected = parseCommunes(value);

  return (
    <Field label="Xã / phường" htmlFor={id} required>
      <div
        id={id}
        role="group"
        aria-label="Xã / phường"
        className="grid grid-cols-2 gap-2"
      >
        {COMMUNE_UNITS.map((c) => {
          const on = selected.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(toggleCommune(value, c.id))}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-sm px-3 py-2 text-left text-sm leading-tight transition-[background-color,box-shadow,color] duration-(--motion-quick) ease-(--ease-out)",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                on
                  ? "bg-primary text-primary-fg"
                  : "bg-bg-subtle text-fg shadow-(--shadow-border) hover:shadow-(--shadow-border-hover)",
              )}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-xs",
                  on ? "bg-primary-fg/15" : "shadow-(--shadow-border)",
                )}
                aria-hidden
              >
                {on ? <Check className="size-3" /> : null}
              </span>
              {c.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-subtle">Chọn một hoặc nhiều xã, phường.</p>
    </Field>
  );
}
