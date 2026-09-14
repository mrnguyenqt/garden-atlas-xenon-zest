import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Select } from "@/components/ui/field";
import { SpeciesSelect } from "@/components/species-select";
import { findSpecies } from "@/lib/custom-species";
import { SPECIES } from "@/lib/catalog";
import {
  STEM_STATUS,
  survivalRate,
  type CountedStem,
  type Project,
  type StemStatus,
  type SurvivalDraft,
  type SurvivalMethod,
} from "@/lib/ops";
import { cn, formatTime, nf0, nf1 } from "@/lib/utils";

function tally(stems: CountedStem[]) {
  return {
    alive: stems.filter((s) => s.status === "song").length,
    dead: stems.filter((s) => s.status === "chet").length,
    replanted: stems.filter((s) => s.status === "dam").length,
  };
}

export function SurvivalForm({
  projects,
  initial,
  defaultProjectId,
  plotId,
  method,
  hideProject,
  onSubmit,
}: {
  projects: Project[];
  initial?: Partial<SurvivalDraft>;
  defaultProjectId?: string;
  plotId?: string;
  method: SurvivalMethod;
  hideProject?: boolean;
  onSubmit: (draft: SurvivalDraft) => void;
}) {
  const [projectId, setProjectId] = useState(
    initial?.projectId || defaultProjectId || projects[0]?.id || "",
  );
  const [slug, setSlug] = useState(initial?.speciesSlug || SPECIES[0].slug);
  const [stems, setStems] = useState<CountedStem[]>(initial?.stems ?? []);
  const [widthM, setWidthM] = useState(String(initial?.widthM || 10));
  const [lengthM, setLengthM] = useState(String(initial?.lengthM || 50));
  const [notes, setNotes] = useState(initial?.notes || "");
  const bang = method === "bang";
  const { alive, dead, replanted } = tally(stems);
  const planted = alive + dead;
  const rate = survivalRate(planted, alive);
  const spacing = Number(widthM);
  const length = Number(lengthM);
  const expectedOnStrip =
    bang && spacing > 0 && length > 0 ? Math.floor(length / spacing) + 1 : 0;

  function addStem(status: StemStatus) {
    setStems((list) => [...list, { id: crypto.randomUUID(), status, at: new Date().toISOString() }]);
  }

  if (!plotId && projects.length === 0) {
    return <p className="text-sm text-muted">Cần tạo dự án trước khi nhập tỷ lệ sống.</p>;
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const known = findSpecies(slug);
        if ((!plotId && !projectId) || planted + replanted <= 0) return;
        onSubmit({
          projectId: projectId || "",
          plotId,
          method,
          speciesSlug: slug,
          name: known?.name || slug,
          date: new Date().toISOString(),
          planted,
          alive,
          dead,
          replanted,
          stems,
          widthM: bang ? Number(widthM) || 0 : 0,
          lengthM: bang ? Number(lengthM) || 0 : 0,
          notes,
        });
      }}
    >
      {!plotId && !hideProject ? (
        <Field label="Dự án" htmlFor="sv-prj">
          <Select id="sv-prj" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      <Field label="Loài cây" htmlFor="sv-sp">
        <SpeciesSelect
          id="sv-sp"
          value={slug}
          onChange={setSlug}
          formatOption={(s) => s.name}
          showLatin={false}
          placeholder="Gõ tên loài…"
        />
      </Field>
      {bang ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Chiều dài băng (m)" htmlFor="sv-len">
            <Input
              id="sv-len"
              type="number"
              min={1}
              step={0.1}
              required
              value={lengthM}
              onChange={(e) => setLengthM(e.target.value)}
            />
          </Field>
          <Field label="Khoảng cách cây (m)" htmlFor="sv-w">
            <Input
              id="sv-w"
              type="number"
              min={0.1}
              step={0.1}
              required
              value={widthM}
              onChange={(e) => setWidthM(e.target.value)}
            />
          </Field>
        </div>
      ) : null}
      <div className="grid grid-cols-3 gap-2">
        <CountTap label="Cây sống" value={alive} tone="ok" onInc={() => addStem("song")} />
        <CountTap label="Cây chết" value={dead} tone="danger" onInc={() => addStem("chet")} />
        <CountTap label="Cây trồng dặm" value={replanted} tone="info" onInc={() => addStem("dam")} />
      </div>
      <div className="text-center text-sm text-muted">
        <p>
          {planted + replanted === 0
            ? "Ấn từng ô để đếm."
            : `Tỷ lệ sống ${nf1.format(rate)}% (trên tổng ${nf0.format(planted)} cây)`}
        </p>
        {bang && expectedOnStrip > 0 ? (
          <p className="mt-1">Dự kiến {nf0.format(expectedOnStrip)} cây trên băng</p>
        ) : null}
      </div>
      <CountedStemList
        stems={stems}
        onRemove={(id) => setStems((list) => list.filter((s) => s.id !== id))}
      />
      <Field label="Ghi chú" htmlFor="sv-n">
        <Input id="sv-n" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="sticky bottom-0 z-10 -mx-5 mt-1 border-t border-border bg-bg-elevated px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button type="submit" className="w-full">
          Lưu đợt điều tra
        </Button>
      </div>
    </form>
  );
}

export function CountedStemList({
  stems,
  onRemove,
}: {
  stems: CountedStem[];
  onRemove?: (id: string) => void;
}) {
  if (stems.length === 0) {
    return (
      <div>
        <p className="text-sm font-medium">Danh sách cây đã đếm</p>
        <p className="mt-2 text-sm text-muted">Chưa đếm cây nào.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium">Danh sách cây đã đếm</p>
      <ol className="mt-2 max-h-48 overflow-y-auto rounded-lg bg-bg-subtle">
        {stems.map((stem, i) => {
          const meta = STEM_STATUS.find((s) => s.id === stem.status);
          return (
            <li
              key={stem.id}
              className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-0"
            >
              <span className="w-6 shrink-0 text-xs tabular-nums text-subtle">{i + 1}</span>
              <span
                className={cn(
                  "flex-1 text-sm font-medium",
                  meta?.tone === "ok" && "text-ok",
                  meta?.tone === "danger" && "text-danger",
                  meta?.tone === "info" && "text-info",
                )}
              >
                {meta?.label ?? stem.status}
              </span>
              {stem.at ? (
                <span className="text-xs tabular-nums text-subtle">{formatTime(stem.at)}</span>
              ) : null}
              {onRemove ? (
                <button
                  type="button"
                  className="flex size-9 items-center justify-center text-muted hover:text-danger"
                  onClick={() => onRemove(stem.id)}
                  aria-label={`Xóa cây ${i + 1}`}
                >
                  <Trash2 className="size-3.5" />
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CountTap({
  label,
  value,
  tone,
  onInc,
}: {
  label: string;
  value: number;
  tone: "ok" | "danger" | "info";
  onInc: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onInc}
      className={cn(
        "flex min-h-24 flex-col items-center justify-center rounded-lg px-2 py-3 transition-transform duration-(--motion-quick) active:scale-[0.98]",
        tone === "ok" && "bg-ok/20 text-ok",
        tone === "danger" && "bg-danger/20 text-danger",
        tone === "info" && "bg-info/20 text-info",
      )}
    >
      <span className="font-display text-3xl italic tabular-nums">{value}</span>
      <span className="mt-1 text-center text-xs opacity-80">{label}</span>
    </button>
  );
}
