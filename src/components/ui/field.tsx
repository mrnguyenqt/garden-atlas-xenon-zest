import {
  Children,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { useBackToClose } from "@/lib/phone-nav";
import { cn } from "@/lib/utils";

export function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

const EMPTY = "__empty__";
const MENU_MAX = 224;

function optionText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(optionText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return optionText(node.props.children);
  return "";
}

function readOptions(children: ReactNode) {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>(child)) return [];
    const raw = child.props.value;
    const value = raw == null || raw === "" ? EMPTY : String(raw);
    return [{ value, label: optionText(child.props.children) || value, disabled: Boolean(child.props.disabled) }];
  });
}

/** Menu nhỏ ngay dưới ô — không phủ toàn màn hình (điện thoại và máy tính). */
export function Select({ className, children, value, onChange, id, disabled, ...rest }: ComponentProps<"select">) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const [box, setBox] = useState({ top: 0, left: 0, width: 0, maxH: MENU_MAX });
  useBackToClose(open, () => setOpen(false));
  const options = readOptions(children);
  const selected = value == null || value === "" ? EMPTY : String(value);
  const label = options.find((o) => o.value === selected)?.label ?? "";

  function place() {
    const el = btn.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 4;
    const below = window.innerHeight - r.bottom - 8;
    const above = r.top - 8;
    const openUp = below < 96 && above > below;
    const maxH = Math.min(MENU_MAX, Math.max(96, openUp ? above : below));
    setBox({
      top: openUp ? r.top - maxH - gap : r.bottom + gap,
      left: r.left,
      width: r.width,
      maxH,
    });
  }

  useLayoutEffect(() => {
    if (!open) return;
    place();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: Event) {
      const t = e.target as Node;
      if (wrap.current?.contains(t) || menu.current?.contains(t)) return;
      setOpen(false);
    }
    function onMove() {
      place();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc, { passive: true });
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  function pick(next: string) {
    const native = next === EMPTY ? "" : next;
    onChange?.({ target: { value: native } } as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  }

  return (
    <div ref={wrap} className="relative min-w-0">
      <button
        ref={btn}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={rest["aria-label"]}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-11 w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-sm bg-bg-subtle px-3 text-left text-sm text-fg shadow-(--shadow-border)",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          "disabled:opacity-50",
          className,
        )}
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted", open && "rotate-180")} aria-hidden />
      </button>
      {open
        ? createPortal(
            <ul
              ref={menu}
              role="listbox"
              style={{
                top: box.top,
                left: Math.max(8, Math.min(box.left, window.innerWidth - box.width - 8)),
                width: Math.min(box.width, window.innerWidth - 16),
                maxHeight: box.maxH,
                pointerEvents: "auto",
              }}
              className="fixed z-[120] overflow-y-auto rounded-sm bg-bg-elevated py-1 shadow-(--shadow-border)"
            >
              {options.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={opt.value === selected}
                    disabled={opt.disabled}
                    onClick={() => pick(opt.value)}
                    className={cn(
                      "flex min-h-11 w-full items-center px-3 text-left text-sm",
                      opt.value === selected ? "bg-primary/10 font-medium text-fg" : "text-fg",
                      "disabled:opacity-40",
                    )}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
