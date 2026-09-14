import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Select } from "@/components/ui/field";
import { SpeciesSelect } from "@/components/species-select";
import { CommuneSelect } from "@/components/commune-select";
import {
  PROJECT_KINDS,
  PROJECT_STATUS,
  type ProjectDraft,
  type ProjectKind,
  type ProjectStatus,
} from "@/lib/ops";
import { parseCommunes } from "@/lib/site";

const EMPTY: ProjectDraft = {
  name: "",
  location: "",
  kind: "" as ProjectKind,
  status: "" as ProjectStatus,
  areaHa: 0,
  speciesSlug: "",
  year: 0,
  density: 0,
  notes: "",
};

function parsePositive(s: string) {
  const n = Number(s.trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

function parseYear(s: string) {
  const n = Number(s.trim());
  return Number.isInteger(n) && n >= 1990 && n <= 2100 ? n : NaN;
}

export function ProjectForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<ProjectDraft>;
  submitLabel: string;
  onSubmit: (draft: ProjectDraft) => void;
}) {
  const [draft, setDraft] = useState<ProjectDraft>({ ...EMPTY, ...initial });
  const [area, setArea] = useState(initial?.areaHa != null ? String(initial.areaHa) : "");
  const [year, setYear] = useState(initial?.year != null ? String(initial.year) : "");
  const [density, setDensity] = useState(initial?.density != null ? String(initial.density) : "");
  const [error, setError] = useState("");

  function set<K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) {
    setError("");
    setDraft((d) => ({ ...d, [key]: value }));
  }

  const areaHa = parsePositive(area);
  const yearN = parseYear(year);
  const densityN = parsePositive(density);
  const missing: string[] = [];
  if (!draft.name.trim()) missing.push("tên dự án");
  if (!parseCommunes(draft.location).length) missing.push("xã / phường");
  if (!draft.kind) missing.push("loại");
  if (!draft.status) missing.push("trạng thái");
  if (!draft.speciesSlug) missing.push("loài");
  if (!Number.isFinite(areaHa)) missing.push("diện tích");
  if (!Number.isFinite(yearN)) missing.push("năm");
  if (!Number.isFinite(densityN)) missing.push("mật độ");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (missing.length) {
          setError(`Nhập đủ: ${missing.join(", ")}.`);
          return;
        }
        onSubmit({
          ...draft,
          name: draft.name.trim(),
          areaHa,
          year: yearN,
          density: densityN,
        });
      }}
    >
      <Field label="Tên dự án" htmlFor="prj-name" required>
        <Input
          id="prj-name"
          required
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Keo lai Ea H'leo 2024"
        />
      </Field>
      <CommuneSelect
        id="prj-loc"
        value={draft.location}
        onChange={(location) => set("location", location)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Loại" htmlFor="prj-kind" required>
          <Select
            id="prj-kind"
            value={draft.kind}
            onChange={(e) => set("kind", e.target.value as ProjectKind)}
          >
            <option value="">Chọn</option>
            {PROJECT_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Trạng thái" htmlFor="prj-st" required>
          <Select
            id="prj-st"
            value={draft.status}
            onChange={(e) => set("status", e.target.value as ProjectStatus)}
          >
            <option value="">Chọn</option>
            {PROJECT_STATUS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Loài" htmlFor="prj-sp" required>
        <SpeciesSelect
          id="prj-sp"
          value={draft.speciesSlug}
          onChange={(slug) => set("speciesSlug", slug)}
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Diện tích (ha)" htmlFor="prj-ha" required>
          <Input
            id="prj-ha"
            required
            inputMode="decimal"
            value={area}
            onChange={(e) => {
              setError("");
              setArea(e.target.value);
            }}
            placeholder="12,5"
            autoComplete="off"
          />
        </Field>
        <Field label="Năm" htmlFor="prj-year" required>
          <Input
            id="prj-year"
            required
            inputMode="numeric"
            value={year}
            onChange={(e) => {
              setError("");
              setYear(e.target.value);
            }}
            placeholder="2026"
            autoComplete="off"
          />
        </Field>
        <Field label="Mật độ /ha" htmlFor="prj-den" required>
          <Input
            id="prj-den"
            required
            inputMode="numeric"
            value={density}
            onChange={(e) => {
              setError("");
              setDensity(e.target.value);
            }}
            placeholder="1667"
            autoComplete="off"
          />
        </Field>
      </div>
      <Field label="Ghi chú" htmlFor="prj-notes">
        <Textarea
          id="prj-notes"
          value={draft.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Cự ly, lập địa…"
        />
      </Field>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" disabled={missing.length > 0}>
        {submitLabel}
      </Button>
    </form>
  );
}
