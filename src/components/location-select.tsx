import { Field, Select } from "@/components/ui/field";
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

function withCurrent(options: string[], current: string) {
  if (!current || options.includes(current)) return options;
  return [current, ...options];
}

export function LocationSelect({
  id,
  value,
  onChange,
  kind = "all",
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  kind?: LotTreeKind;
}) {
  const parts = parseLocationParts(value);
  const khoanhOptions = withCurrent(khoanhOf(parts.tieuKhu, kind), parts.khoanh);
  const loOptions = withCurrent(loOf(parts.tieuKhu, parts.khoanh, kind), parts.lo);
  const tkOptions = withCurrent(kind === "all" ? TIEU_KHU_IDS : tieuKhuIds(kind), parts.tieuKhu);

  function set(next: Partial<LocationParts>) {
    onChange(formatLocationParts({ ...parts, ...next }));
  }

  return (
    <div id={id} role="group" aria-label="Vị trí" className="grid grid-cols-3 gap-3">
      <Field label="Tiểu khu" htmlFor={`${id}-tk`} required>
        <Select
          id={`${id}-tk`}
          value={parts.tieuKhu}
          onChange={(e) => {
            const tieuKhu = e.target.value;
            const allowed = khoanhOf(tieuKhu, kind);
            const khoanh = allowed.includes(parts.khoanh) ? parts.khoanh : "";
            const lo = loOf(tieuKhu, khoanh, kind).includes(parts.lo) ? parts.lo : "";
            set({ tieuKhu, khoanh, lo });
          }}
        >
          <option value="">Chọn</option>
          {tkOptions.map((tk) => (
            <option key={tk} value={tk}>
              {tk}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Khoảnh" htmlFor={`${id}-khoanh`} required>
        <Select
          id={`${id}-khoanh`}
          value={parts.khoanh}
          disabled={!parts.tieuKhu}
          onChange={(e) => {
            const khoanh = e.target.value;
            const lo = loOf(parts.tieuKhu, khoanh, kind).includes(parts.lo) ? parts.lo : "";
            set({ khoanh, lo });
          }}
        >
          <option value="">Chọn</option>
          {khoanhOptions.map((kh) => (
            <option key={kh} value={kh}>
              {kh}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Lô" htmlFor={`${id}-lo`} required>
        <Select
          id={`${id}-lo`}
          value={parts.lo}
          disabled={!parts.tieuKhu || !parts.khoanh}
          onChange={(e) => set({ lo: e.target.value })}
        >
          <option value="">Chọn</option>
          {loOptions.map((lo) => (
            <option key={lo} value={lo}>
              {lo}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
