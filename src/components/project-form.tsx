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

const EMPTY: ProjectDraft = {
  name: "",
  location: "",
  kind: "trong",
  status: "dang-lam",
  areaHa: 1,
  speciesSlug: "keo-lai",
  year: new Date().getFullYear(),
  density: 1667,
  notes: "",
};

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
  const [area, setArea] = useState(String(initial?.areaHa ?? EMPTY.areaHa));
  const [year, setYear] = useState(String(initial?.year ?? EMPTY.year));
  const [density, setDensity] = useState(String(initial?.density ?? EMPTY.density));

  function set<K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.name.trim()) return;
        onSubmit({
          ...draft,
          areaHa: parseNum(area),
          year: parseNum(year) || new Date().getFullYear(),
          density: parseNum(density),
        });
      }}
    >
      <Field label="Tên dự án" htmlFor="prj-name">
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
        <Field label="Loại" htmlFor="prj-kind">
          <Select
            id="prj-kind"
            value={draft.kind}
            onChange={(e) => set("kind", e.target.value as ProjectKind)}
          >
            {PROJECT_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Trạng thái" htmlFor="prj-st">
          <Select
            id="prj-st"
            value={draft.status}
            onChange={(e) => set("status", e.target.value as ProjectStatus)}
          >
            {PROJECT_STATUS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Loài" htmlFor="prj-sp">
        <SpeciesSelect
          id="prj-sp"
          value={draft.speciesSlug}
          onChange={(slug) => set("speciesSlug", slug)}
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Diện tích (ha)" htmlFor="prj-ha">
          <Input
            id="prj-ha"
            inputMode="decimal"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="12,5"
            autoComplete="off"
          />
        </Field>
        <Field label="Năm" htmlFor="prj-year">
          <Input
            id="prj-year"
            inputMode="numeric"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="2024"
            autoComplete="off"
          />
        </Field>
        <Field label="Mật độ /ha" htmlFor="prj-den">
          <Input
            id="prj-den"
            inputMode="numeric"
            value={density}
            onChange={(e) => setDensity(e.target.value)}
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
      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}

function parseNum(s: string) {
  const n = Number(s.trim().replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
