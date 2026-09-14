import { useState } from "react";
import { Delete } from "lucide-react";
import { Field } from "@/components/ui/field";
import { useBackToClose } from "@/lib/phone-nav";
import { cn } from "@/lib/utils";

export function applyNumKey(
  current: string,
  key: string,
  replace: boolean,
  maxInt = 5,
  maxDec = 2,
): string {
  if (key === "back") return current.slice(0, -1);
  if (key === "dot" || key === "comma") {
    const base = replace || !current ? "0" : current;
    if (base.includes(".")) return base;
    return `${base}.`;
  }
  if (!/^\d$/.test(key)) return current;
  const next = replace || current === "0" ? key : current + key;
  const [i = "", d] = next.split(".");
  if (i.length > maxInt) return current;
  if (d !== undefined && d.length > maxDec) return current;
  return next;
}

type DualTarget = "left" | "right";

function DualPad({
  leftId,
  rightId,
  leftLabel,
  rightLabel,
  left,
  right,
  onLeft,
  onRight,
  maxInt = 5,
  maxDec = 2,
  emptyLabel = "0",
}: {
  leftId: string;
  rightId: string;
  leftLabel: string;
  rightLabel: string;
  left: string;
  right: string;
  onLeft: (value: string) => void;
  onRight: (value: string) => void;
  maxInt?: number;
  maxDec?: number;
  emptyLabel?: string;
}) {
  const [active, setActive] = useState<DualTarget | null>(null);
  const [fresh, setFresh] = useState(true);
  useBackToClose(Boolean(active), () => setActive(null));

  function open(next: DualTarget) {
    setActive(next);
    setFresh(true);
  }

  function press(key: string) {
    if (!active) return;
    if (key === "ok") {
      setActive(null);
      return;
    }
    const current = active === "left" ? left : right;
    const set = active === "left" ? onLeft : onRight;
    set(applyNumKey(current, key, fresh && key !== "back", maxInt, maxDec));
    setFresh(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label={leftLabel} htmlFor={leftId}>
          <MeasureDisplay
            id={leftId}
            value={left}
            active={active === "left"}
            emptyLabel={emptyLabel}
            onOpen={() => open("left")}
          />
        </Field>
        <Field label={rightLabel} htmlFor={rightId}>
          <MeasureDisplay
            id={rightId}
            value={right}
            active={active === "right"}
            emptyLabel={emptyLabel}
            onOpen={() => open("right")}
          />
        </Field>
      </div>
      {active ? <NumPad onKey={press} /> : null}
    </div>
  );
}

export function MeasurePad({
  dbhId,
  heightId,
  dbh,
  height,
  onDbh,
  onHeight,
  leftLabel = "C1.3 (cm)",
  rightLabel = "Hvn (m)",
}: {
  dbhId: string;
  heightId: string;
  dbh: string;
  height: string;
  onDbh: (value: string) => void;
  onHeight: (value: string) => void;
  leftLabel?: string;
  rightLabel?: string;
}) {
  return (
    <DualPad
      leftId={dbhId}
      rightId={heightId}
      leftLabel={leftLabel}
      rightLabel={rightLabel}
      left={dbh}
      right={height}
      onLeft={onDbh}
      onRight={onHeight}
    />
  );
}

export function CoordPad({
  x,
  y,
  onX,
  onY,
  leftId = "vn2000-x",
  rightId = "vn2000-y",
  leftLabel = "Toạ độ X",
  rightLabel = "Toạ độ Y",
  maxInt = 8,
  maxDec = 0,
}: {
  x: string;
  y: string;
  onX: (value: string) => void;
  onY: (value: string) => void;
  leftId?: string;
  rightId?: string;
  leftLabel?: string;
  rightLabel?: string;
  maxInt?: number;
  maxDec?: number;
}) {
  return (
    <DualPad
      leftId={leftId}
      rightId={rightId}
      leftLabel={leftLabel}
      rightLabel={rightLabel}
      left={x}
      right={y}
      onLeft={onX}
      onRight={onY}
      maxInt={maxInt}
      maxDec={maxDec}
      emptyLabel=""
    />
  );
}

export function LogPad({
  d1,
  d2,
  length,
  onD1,
  onD2,
  onLength,
}: {
  d1: string;
  d2: string;
  length: string;
  onD1: (value: string) => void;
  onD2: (value: string) => void;
  onLength: (value: string) => void;
}) {
  type Slot = "d1" | "d2" | "len";
  const [active, setActive] = useState<Slot | null>(null);
  const [fresh, setFresh] = useState(true);
  useBackToClose(Boolean(active), () => setActive(null));

  function open(next: Slot) {
    setActive(next);
    setFresh(true);
  }

  function press(key: string) {
    if (!active) return;
    if (key === "ok") {
      setActive(null);
      return;
    }
    const current = active === "d1" ? d1 : active === "d2" ? d2 : length;
    const set = active === "d1" ? onD1 : active === "d2" ? onD2 : onLength;
    set(applyNumKey(current, key, fresh && key !== "back", 5, 2));
    setFresh(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="d1 — đầu lớn (cm)" htmlFor="log-d1">
          <MeasureDisplay id="log-d1" value={d1} active={active === "d1"} emptyLabel="0" onOpen={() => open("d1")} />
        </Field>
        <Field label="d2 — đầu nhỏ (cm)" htmlFor="log-d2">
          <MeasureDisplay id="log-d2" value={d2} active={active === "d2"} emptyLabel="0" onOpen={() => open("d2")} />
        </Field>
      </div>
      <Field label="L — chiều dài khúc (m)" htmlFor="log-l">
        <MeasureDisplay id="log-l" value={length} active={active === "len"} emptyLabel="0" onOpen={() => open("len")} />
      </Field>
      {active ? <NumPad onKey={press} /> : null}
    </div>
  );
}

export function MeasureDisplay({
  id,
  value,
  active,
  emptyLabel,
  onOpen,
}: {
  id: string;
  value: string;
  active: boolean;
  emptyLabel: string;
  onOpen: () => void;
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onOpen}
      className={cn(
        "flex h-11 w-full items-center rounded-sm bg-bg-subtle px-3 text-left text-sm tabular-nums shadow-(--shadow-border)",
        active ? "ring-2 ring-primary/40 text-fg" : value ? "text-fg" : "text-muted",
      )}
    >
      {value || emptyLabel || "Nhập"}
    </button>
  );
}

const ROWS: Array<Array<{ id: string; label?: string; kind: "digit" | "action" | "ok" | "empty" }>> = [
  [
    { id: "1", label: "1", kind: "digit" },
    { id: "2", label: "2", kind: "digit" },
    { id: "3", label: "3", kind: "digit" },
    { id: "back", kind: "action" },
  ],
  [
    { id: "4", label: "4", kind: "digit" },
    { id: "5", label: "5", kind: "digit" },
    { id: "6", label: "6", kind: "digit" },
    { id: "ok", label: "OK", kind: "ok" },
  ],
  [
    { id: "7", label: "7", kind: "digit" },
    { id: "8", label: "8", kind: "digit" },
    { id: "9", label: "9", kind: "digit" },
    { id: "dot", label: ".", kind: "action" },
  ],
  [
    { id: "sp1", kind: "empty" },
    { id: "0", label: "0", kind: "digit" },
    { id: "sp2", kind: "empty" },
    { id: "comma", label: ",", kind: "action" },
  ],
];

export function NumPad({ onKey }: { onKey: (key: string) => void }) {
  return (
    <div
      role="group"
      aria-label="Bàn phím số"
      className="grid w-full min-w-0 grid-cols-4 gap-2 rounded-lg bg-bg-subtle p-2"
    >
      {ROWS.flat().map((key) => {
        if (key.kind === "empty") {
          return (
            <div
              key={key.id}
              className="h-14 rounded-md bg-bg/40"
              aria-hidden
            />
          );
        }
        return (
          <button
            key={key.id}
            type="button"
            aria-label={key.id === "back" ? "Xóa" : key.label}
            onClick={() => onKey(key.id)}
            className={cn(
              "flex h-14 min-w-0 items-center justify-center rounded-md text-2xl font-medium transition-colors duration-(--motion-quick) active:scale-[0.98]",
              key.kind === "digit" && "bg-fg text-bg",
              key.kind === "action" && "bg-bg text-fg",
              key.kind === "ok" && "bg-bg text-ok text-xl font-semibold",
            )}
          >
            {key.id === "back" ? <Delete className="size-6" /> : key.label}
          </button>
        );
      })}
    </div>
  );
}
