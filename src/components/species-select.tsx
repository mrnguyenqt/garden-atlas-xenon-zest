import { useEffect, useMemo, useRef, useState } from "react";
import { foldVi, speciesMatches, type Species } from "@/lib/catalog";
import { findSpecies, useCatalog, useCustomSpecies } from "@/lib/custom-species";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SpeciesSelect({
  id,
  value,
  onChange,
  formatOption = defaultLabel,
  showLatin = true,
  placeholder = "Gõ tên Việt hoặc Latin…",
}: {
  id: string;
  value: string;
  onChange: (slug: string) => void;
  formatOption?: (s: Species) => string;
  showLatin?: boolean;
  placeholder?: string;
}) {
  const catalog = useCatalog();
  const addCustom = useCustomSpecies((s) => s.add);
  const selected = findSpecies(value);
  const box = useRef<HTMLDivElement>(null);
  const formatRef = useRef(formatOption);
  formatRef.current = formatOption;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(selected ? formatOption(selected) : "");
  const [hi, setHi] = useState(0);

  const matches = useMemo(
    () => catalog.filter((s) => speciesMatches(s, open ? q : "")).slice(0, 40),
    [catalog, open, q],
  );
  const canAdd =
    Boolean(q.trim()) &&
    !catalog.some((s) => foldVi(s.name) === foldVi(q.trim()));

  useEffect(() => {
    if (open) return;
    const next = findSpecies(value);
    setQ(next ? formatRef.current(next) : "");
  }, [value, open]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) {
        setOpen(false);
        const next = findSpecies(value);
        setQ(next ? formatRef.current(next) : "");
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [value]);

  function pick(s: Species) {
    onChange(s.slug);
    setQ(formatRef.current(s));
    setOpen(false);
  }

  function addNew() {
    const slug = addCustom({ name: q.trim(), latin: "", family: "", notes: "" });
    const s = findSpecies(slug);
    if (s) pick(s);
  }

  const addOffset = canAdd ? 1 : 0;

  return (
    <div ref={box} className="min-w-0">
      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        autoComplete="off"
        placeholder={placeholder}
        value={q}
        onFocus={(e) => {
          e.target.select();
          setQ("");
          setOpen(true);
          setHi(0);
        }}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setHi(0);
        }}
        onKeyDown={(e) => {
          const last = matches.length + addOffset - 1;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHi((i) => Math.min(i + 1, Math.max(last, 0)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHi((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && open) {
            e.preventDefault();
            if (canAdd && hi === 0) addNew();
            else {
              const s = matches[hi - addOffset];
              if (s) pick(s);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
            const next = findSpecies(value);
            setQ(next ? formatRef.current(next) : "");
          }
        }}
      />
      {open ? (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="mt-1 max-h-52 overflow-x-hidden overflow-y-auto rounded-sm bg-bg-subtle py-1 shadow-(--shadow-border)"
        >
          {canAdd ? (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={hi === 0}
                className={cn(
                  "flex min-h-11 w-full items-center px-3 text-left text-sm",
                  hi === 0 ? "bg-bg-elevated text-fg" : "text-muted hover:bg-bg-elevated hover:text-fg",
                )}
                onMouseEnter={() => setHi(0)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={addNew}
              >
                Thêm loài «{q.trim()}»
              </button>
            </li>
          ) : null}
          {matches.length === 0 && !canAdd ? (
            <li className="px-3 py-2 text-sm text-muted">Không thấy loài khớp.</li>
          ) : (
            matches.map((s, i) => {
              const idx = i + addOffset;
              return (
                <li key={s.slug}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={s.slug === value}
                    className={cn(
                      "flex min-h-11 w-full flex-col items-start justify-center px-3 py-1.5 text-left text-sm",
                      idx === hi ? "bg-bg-elevated text-fg" : "text-muted hover:bg-bg-elevated hover:text-fg",
                    )}
                    onMouseEnter={() => setHi(idx)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(s)}
                  >
                    <span className="font-medium break-words text-fg">{s.name}</span>
                    {showLatin && s.latin ? (
                      <span className="max-w-full text-xs break-words text-subtle italic">{s.latin}</span>
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}

function defaultLabel(s: Species) {
  return s.latin && s.latin !== s.name ? `${s.name} — ${s.latin}` : s.name;
}
