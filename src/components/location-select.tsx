import { useState } from "react";
import { Field, Select } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  TIEU_KHU_IDS,
  formatLocationParts,
  khoanhOf,
  loOf,
  parseLocationParts,
  tieuKhuIds,
  type LocationParts,
  type LotTreeKind,
} from "@/lib/site";

const CUSTOM = "__custom__";

function withCurrent(options: string[], current: string) {
  if (!current || options.includes(current)) return options;
  return [current, ...options];
}

function sanitize(raw: string) {
  return raw.replace(/[·,;|/]/g, "");
}

function LocField({
  id,
  label,
  value,
  catalog,
  disabled,
  allowCustom,
  onPick,
}: {
  id: string;
  label: string;
  value: string;
  catalog: string[];
  disabled?: boolean;
  allowCustom?: boolean;
  onPick: (next: string) => void;
}) {
  const [manual, setManual] = useState(() => Boolean(allowCustom && value && !catalog.includes(value)));
  const menu = withCurrent(catalog, value);
  const showInput = Boolean(allowCustom && !disabled && (manual || catalog.length === 0));

  if (showInput) {
    return (
      <Field label={label} htmlFor={id} required>
        <Input
          id={id}
          value={value}
          autoFocus={manual}
          placeholder="Nhập mới"
          autoComplete="off"
          onChange={(e) => onPick(sanitize(e.target.value))}
        />
        {catalog.length > 0 ? (
          <button
            type="button"
            className="self-start text-xs font-medium text-primary"
            onClick={() => setManual(false)}
          >
            Chọn từ danh sách
          </button>
        ) : null}
      </Field>
    );
  }

  return (
    <Field label={label} htmlFor={id} required>
      <Select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value;
          if (next === CUSTOM) {
            setManual(true);
            onPick("");
            return;
          }
          setManual(false);
          onPick(next);
        }}
      >
        <option value="">Chọn</option>
        {allowCustom ? <option value={CUSTOM}>Nhập mới…</option> : null}
        {menu.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function LocationSelect({
  id,
  value,
  onChange,
  kind = "all",
  allowCustom = false,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  kind?: LotTreeKind;
  allowCustom?: boolean;
}) {
  const parts = parseLocationParts(value);
  const tkCatalog = kind === "all" ? TIEU_KHU_IDS : tieuKhuIds(kind);
  const khoanhCatalog = khoanhOf(parts.tieuKhu, kind);
  const loCatalog = loOf(parts.tieuKhu, parts.khoanh, kind);

  function set(next: Partial<LocationParts>) {
    onChange(formatLocationParts({ ...parts, ...next }));
  }

  function setTieuKhu(tieuKhu: string) {
    if (!allowCustom) {
      const allowed = khoanhOf(tieuKhu, kind);
      const khoanh = allowed.includes(parts.khoanh) ? parts.khoanh : "";
      const lo = loOf(tieuKhu, khoanh, kind).includes(parts.lo) ? parts.lo : "";
      set({ tieuKhu, khoanh, lo });
      return;
    }
    const khs = khoanhOf(tieuKhu, kind);
    const khoanh = !tieuKhu
      ? ""
      : !parts.khoanh || khs.length === 0 || khs.includes(parts.khoanh)
        ? parts.khoanh
        : "";
    const los = loOf(tieuKhu, khoanh, kind);
    const lo = !khoanh ? "" : !parts.lo || los.length === 0 || los.includes(parts.lo) ? parts.lo : "";
    set({ tieuKhu, khoanh, lo });
  }

  function setKhoanh(khoanh: string) {
    if (!allowCustom) {
      const lo = loOf(parts.tieuKhu, khoanh, kind).includes(parts.lo) ? parts.lo : "";
      set({ khoanh, lo });
      return;
    }
    const los = loOf(parts.tieuKhu, khoanh, kind);
    const lo = !khoanh ? "" : !parts.lo || los.length === 0 || los.includes(parts.lo) ? parts.lo : "";
    set({ khoanh, lo });
  }

  return (
    <div id={id} role="group" aria-label="Vị trí" className="grid grid-cols-3 gap-3">
      <LocField
        id={`${id}-tk`}
        label="Tiểu khu"
        value={parts.tieuKhu}
        catalog={tkCatalog}
        allowCustom={allowCustom}
        onPick={setTieuKhu}
      />
      <LocField
        id={`${id}-khoanh`}
        label="Khoảnh"
        value={parts.khoanh}
        catalog={khoanhCatalog}
        disabled={!parts.tieuKhu}
        allowCustom={allowCustom}
        onPick={setKhoanh}
      />
      <LocField
        id={`${id}-lo`}
        label="Lô"
        value={parts.lo}
        catalog={loCatalog}
        disabled={!parts.tieuKhu || !parts.khoanh}
        allowCustom={allowCustom}
        onPick={(lo) => set({ lo })}
      />
    </div>
  );
}
