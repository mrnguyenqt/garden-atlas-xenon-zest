import { THEME_MODES, useTheme, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

const SWATCH: Record<ThemeMode, { bg: string; fg: string; bar: string }> = {
  dark: { bg: "#0c100e", fg: "#e8eee9", bar: "#1a7a38" },
  light: { bg: "#fbf6ea", fg: "#14351c", bar: "#1a7a38" },
  system: { bg: "#fbf6ea", fg: "#0c100e", bar: "#1a7a38" },
};

export function AppearancePicker() {
  const mode = useTheme((s) => s.mode);
  const setMode = useTheme((s) => s.setMode);

  return (
    <div className="grid gap-2">
      {THEME_MODES.map((item) => {
        const on = mode === item.id;
        const sw = SWATCH[item.id];
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id as ThemeMode)}
            className={cn(
              "flex min-h-14 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-(--motion-quick)",
              on ? "bg-primary text-primary-fg" : "bg-bg-subtle text-fg hover:bg-bg-subtle/80",
            )}
          >
            <span
              className="relative size-11 shrink-0 overflow-hidden rounded-lg shadow-(--shadow-border)"
              style={{ background: sw.bg }}
              aria-hidden
            >
              <span className="absolute inset-x-0 top-0 h-3" style={{ background: sw.bar }} />
              <span className="absolute top-5 left-1.5 right-1.5 h-1 rounded-full" style={{ background: sw.fg, opacity: 0.85 }} />
              <span className="absolute top-7 left-1.5 w-6 h-1 rounded-full" style={{ background: sw.fg, opacity: 0.4 }} />
              {item.id === "system" ? (
                <span className="absolute inset-y-0 right-0 w-1/2" style={{ background: "#0c100e" }} />
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{item.label}</span>
              <span className={cn("mt-0.5 block text-sm", on ? "text-primary-fg/80" : "text-muted")}>{item.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
