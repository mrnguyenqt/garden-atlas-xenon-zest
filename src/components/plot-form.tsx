import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Select } from "@/components/ui/field";
import { LocationSelect } from "@/components/location-select";
import { GpsVerifyButton } from "@/components/gps-verify";
import { gpsAccuracyGrade, isGpsVerified } from "@/lib/gps";
import { FormSheet } from "@/components/form-sheet";
import { usePlots, findDuplicatePlot, type Plot } from "@/lib/store";
import { useOps } from "@/lib/ops";
import { FOREST_KINDS, PLOT_PRESETS, STAND_STATUS } from "@/lib/forestry";
import { formatDate, formatTime } from "@/lib/utils";

const CODE_PREFIX = "OTC-";

const SURVEYORS = [
  "Nguyễn Đức Nhi",
  "Nguyễn Trần Đăng Nguyên",
  "Lê Văn Hùng",
  "Trương Đức Trung",
  "Thái Văn Lâm",
  "Nguyễn Khánh Trường",
  "Trương Đình Lâm",
  "Nguyễn Xuân Phong",
  "Trương Văn Trí",
  "Nguyễn Cửu Tuấn",
  "Võ Văn Thảo",
];

function rankSurveyors(list: string[], plots: Plot[], extra = "") {
  const counts = new Map<string, number>();
  for (const p of plots) {
    if (!p.surveyor) continue;
    counts.set(p.surveyor, (counts.get(p.surveyor) ?? 0) + 1);
  }
  const ranked = [...list].sort((a, b) => {
    const diff = (counts.get(b) ?? 0) - (counts.get(a) ?? 0);
    if (diff) return diff;
    return list.indexOf(a) - list.indexOf(b);
  });
  if (extra && !list.includes(extra)) return [extra, ...ranked];
  return ranked;
}

function withCodePrefix(name: string) {
  if (name.startsWith(CODE_PREFIX)) return name;
  return CODE_PREFIX + name.replace(/^OTC-?/i, "");
}

export type PlotDraft = Omit<Plot, "id" | "trees" | "photos">;

const EMPTY: PlotDraft = {
  name: "OTC-",
  projectId: "",
  location: "",
  forestSlug: "san-xuat",
  shape: "circle",
  radiusM: 12.62,
  widthM: 10,
  lengthM: 50,
  coordX: 0,
  coordY: 0,
  gpsLat: 0,
  gpsLng: 0,
  gpsAccuracyM: 0,
  gpsAt: "",
  date: "",
  notes: "",
  surveyor: "",
  stand: "Rừng trồng",
};

function matchPreset(d: PlotDraft) {
  if (d.shape === "square" && d.widthM === 10) return "a100";
  if (d.shape === "rect") return "bang";
  return "a500";
}

export function openPlotPage(id: string) {
  window.location.assign(`/o-mau/${id}`);
}

export function PlotForm({
  initial,
  excludeId,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<PlotDraft>;
  excludeId?: string;
  submitLabel: string;
  onSubmit: (draft: PlotDraft) => void;
}) {
  const [draft, setDraft] = useState<PlotDraft>(() => ({
    ...EMPTY,
    ...initial,
    name: withCodePrefix(initial?.name ?? EMPTY.name),
    date: initial?.date || new Date().toISOString(),
  }));
  const [preset, setPreset] = useState<string>(() => matchPreset({ ...EMPTY, ...initial }));
  const [dupError, setDupError] = useState("");
  const [gpsError, setGpsError] = useState("");
  const projects = useOps((s) => s.projects);
  const plots = usePlots((s) => s.plots);
  const surveyors = rankSurveyors(SURVEYORS, plots, draft.surveyor);

  function set<K extends keyof PlotDraft>(key: K, value: PlotDraft[K]) {
    setDupError("");
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function applyPreset(id: string) {
    setPreset(id);
    const p = PLOT_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setDraft((d) => ({
      ...d,
      shape: p.shape,
      radiusM: p.radiusM,
      widthM: p.widthM,
      lengthM: p.lengthM,
    }));
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const name = withCodePrefix(draft.name.trim());
        if (!name.slice(CODE_PREFIX.length).trim()) return;
        if (findDuplicatePlot(plots, name, draft.location, draft.projectId ?? "", excludeId)) {
          setDupError("Số hiệu ô đã có trong cùng tiểu khu, khoảnh, lô của dự án này.");
          return;
        }
        if (!excludeId && !isGpsVerified(draft)) {
          setGpsError("Bắt buộc kiểm tra GPS trước khi lưu ô mới.");
          return;
        }
        const parsed = excludeId ? draft.date : new Date().toISOString();
        onSubmit({
          ...draft,
          name,
          date: parsed,
          radiusM: Number(draft.radiusM) || 0,
          widthM: Number(draft.widthM) || 0,
          lengthM: Number(draft.lengthM) || 0,
          coordX: draft.coordX || 0,
          coordY: draft.coordY || 0,
          gpsLat: draft.gpsLat || 0,
          gpsLng: draft.gpsLng || 0,
          gpsAccuracyM: draft.gpsAccuracyM || 0,
          gpsAt: draft.gpsAt || "",
        });
      }}
    >
      <Field label="Dự án" htmlFor="plot-prj">
        <Select
          id="plot-prj"
          value={draft.projectId}
          onChange={(e) => set("projectId", e.target.value)}
        >
          <option value="">Chưa gắn dự án</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Số hiệu ô" htmlFor="plot-name">
        <div className="flex h-11 overflow-hidden rounded-sm bg-bg-subtle shadow-(--shadow-border) focus-within:ring-2 focus-within:ring-primary/40">
          <span className="flex items-center pl-3 text-sm text-muted select-none">{CODE_PREFIX}</span>
          <input
            id="plot-name"
            required
            className="h-11 min-w-0 flex-1 bg-transparent pr-3 text-sm text-fg outline-none placeholder:text-subtle"
            value={draft.name.startsWith(CODE_PREFIX) ? draft.name.slice(CODE_PREFIX.length) : draft.name}
            onChange={(e) => {
              const rest = e.target.value.replace(/^OTC-?/i, "");
              set("name", CODE_PREFIX + rest);
            }}
            placeholder="01"
            autoComplete="off"
          />
        </div>
        {dupError ? <p className="text-sm text-danger">{dupError}</p> : null}
      </Field>
      <LocationSelect
          id="plot-loc"
          value={draft.location}
          onChange={(location) => set("location", location)}
        />
      {gpsAccuracyGrade(draft.gpsAccuracyM).ok ? null : (
      <GpsVerifyButton
        onFix={(fix) => {
          setGpsError("");
          setDraft((d) => ({
            ...d,
            coordX: fix.x,
            coordY: fix.y,
            gpsLat: fix.lat,
            gpsLng: fix.lng,
            gpsAccuracyM: fix.accuracyM,
            gpsAt: fix.at,
          }));
        }}
      />
      )}
      {gpsError ? <p className="text-sm text-danger">{gpsError}</p> : null}
      {!excludeId && !isGpsVerified(draft) && !gpsError ? (
        <p className="text-xs text-muted">Bắt buộc kiểm tra GPS để lưu ô mới.</p>
      ) : null}
      {draft.gpsAt ? (
        <p className="text-xs tabular-nums text-muted">
          Độ chính xác ±{Math.round(draft.gpsAccuracyM || 0)} m · {gpsAccuracyGrade(draft.gpsAccuracyM).label}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Loại rừng" htmlFor="plot-forest">
          <Select
            id="plot-forest"
            value={draft.forestSlug}
            onChange={(e) => set("forestSlug", e.target.value)}
          >
            {FOREST_KINDS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Trạng thái" htmlFor="plot-stand">
          <Select id="plot-stand" value={draft.stand} onChange={(e) => set("stand", e.target.value)}>
            {STAND_STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Cỡ ô" htmlFor="plot-preset">
        <Select id="plot-preset" value={preset} onChange={(e) => applyPreset(e.target.value)}>
          {PLOT_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
      </Field>
      {preset === "bang" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Chiều dài băng (m)" htmlFor="plot-l">
            <Input
              id="plot-l"
              inputMode="decimal"
              value={draft.lengthM}
              onChange={(e) => set("lengthM", Number(e.target.value))}
            />
          </Field>
          <Field label="Chiều rộng băng (m)" htmlFor="plot-w">
            <Input
              id="plot-w"
              inputMode="decimal"
              value={draft.widthM}
              onChange={(e) => set("widthM", Number(e.target.value))}
            />
          </Field>
        </div>
      ) : null}
      <Field label="Người lập" htmlFor="plot-surveyor">
        <Select
          id="plot-surveyor"
          value={draft.surveyor}
          onChange={(e) => set("surveyor", e.target.value)}
        >
          <option value="">Chọn</option>
          {surveyors.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Ngày lập">
        <p className="flex h-11 items-center rounded-sm bg-bg-subtle px-3 text-sm tabular-nums text-muted shadow-(--shadow-border)">
          {formatDate(draft.date)} · {formatTime(draft.date)}
        </p>
      </Field>
      <Field label="Ghi chú" htmlFor="plot-notes">
        <Textarea
          id="plot-notes"
          value={draft.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Lập địa, dốc, cháy…"
        />
      </Field>
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}

export function PlotEditDialog({
  plot,
  open,
  onOpenChange,
}: {
  plot: Plot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updatePlot = usePlots((s) => s.updatePlot);
  if (!plot) return null;
  const { id, trees: _trees, photos: _photos, ...initial } = plot;
  return (
    <FormSheet open={open} onClose={() => onOpenChange(false)} title="Sửa ô">
      <PlotForm
        key={id}
        initial={initial}
        excludeId={id}
        submitLabel="Lưu thay đổi"
        onSubmit={(draft) => {
          updatePlot(id, draft);
          onOpenChange(false);
        }}
      />
    </FormSheet>
  );
}
