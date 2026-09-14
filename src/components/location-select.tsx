import { Field, Select } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  TIEU_KHU_IDS,
  formatLocationParts,
  khoanhOf,
  parseLocationParts,
  type LocationParts,
} from "@/lib/site";

function withCurrent(options: string[], current: string) {
  if (!current || options.includes(current)) return options;
  return [current, ...options];
}

export function LocationSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const parts = parseLocationParts(value);
  const khoanhOptions = withCurrent(khoanhOf(parts.tieuKhu), parts.khoanh);
  const tkOptions = withCurrent(TIEU_KHU_IDS, parts.tieuKhu);

  function set(next: Partial<LocationParts>) {
    onChange(formatLocationParts({ ...parts, ...next }));
  }

  return (
    <div id={id} role="group" aria-label="Vị trí" className="grid grid-cols-3 gap-3">
      <Field label="Tiểu khu" htmlFor={`${id}-tk`}>
        <Select
          id={`${id}-tk`}
          value={parts.tieuKhu}
          onChange={(e) => {
            const tieuKhu = e.target.value;
            const allowed = khoanhOf(tieuKhu);
            const khoanh = allowed.includes(parts.khoanh) ? parts.khoanh : "";
            set({ tieuKhu, khoanh });
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
      <Field label="Khoảnh" htmlFor={`${id}-khoanh`}>
        <Select
          id={`${id}-khoanh`}
          value={parts.khoanh}
          disabled={!parts.tieuKhu}
          onChange={(e) => set({ khoanh: e.target.value })}
        >
          <option value="">Chọn</option>
          {khoanhOptions.map((kh) => (
            <option key={kh} value={kh}>
              {kh}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Lô" htmlFor={`${id}-lo`}>
        <Input
          id={`${id}-lo`}
          value={parts.lo}
          onChange={(e) => set({ lo: e.target.value })}
          placeholder="Nhập lô"
          inputMode="text"
          autoComplete="off"
        />
      </Field>
    </div>
  );
}
