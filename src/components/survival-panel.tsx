import { useState } from "react";
import { Trash2 } from "lucide-react";
import { SurvivalForm, CountedStemList } from "@/components/survival-form";
import {
  SURVIVAL_METHODS,
  survivalMethodLabel,
  survivalRate,
  useOps,
  type SurvivalCheck,
  type SurvivalMethod,
} from "@/lib/ops";
import { nf0, nf1, cn } from "@/lib/utils";

export function SurvivalPanel({
  plotId,
  defaultProjectId,
  onSaved,
}: {
  plotId?: string;
  defaultProjectId?: string;
  onSaved?: () => void;
}) {
  const projects = useOps((s) => s.projects);
  const addSurvival = useOps((s) => s.addSurvival);
  const [method, setMethod] = useState<SurvivalMethod>("o-tieu-chuan");
  const [formKey, setFormKey] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {SURVIVAL_METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMethod(m.id);
              setFormKey((n) => n + 1);
            }}
            className={cn(
              "h-11 rounded-full px-4 text-sm font-medium transition-colors duration-(--motion-quick)",
              method === m.id ? "bg-primary text-primary-fg" : "bg-bg-subtle text-muted hover:text-fg",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      <SurvivalForm
        key={`${method}-${formKey}`}
        projects={projects}
        plotId={plotId}
        defaultProjectId={defaultProjectId}
        hideProject={Boolean(defaultProjectId) && !plotId}
        method={method}
        onSubmit={(draft) => {
          addSurvival({
            ...draft,
            plotId: plotId ?? draft.plotId,
            projectId: defaultProjectId || draft.projectId,
            method,
          });
          setFormKey((n) => n + 1);
          onSaved?.();
        }}
      />
    </div>
  );
}

export function SurvivalSummaryCard({
  record,
  onOpen,
  onRemove,
}: {
  record: SurvivalCheck;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const rate = survivalRate(record.planted, record.alive);
  const dead = record.dead ?? Math.max(0, record.planted - record.alive);
  const replanted = record.replanted ?? 0;

  return (
    <li className="rounded-xl bg-bg-elevated p-5 shadow-(--shadow-border)">
      <div className="flex items-start justify-between gap-3">
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onOpen}>
          <p className="font-medium">{record.name}</p>
          <p className="mt-1 text-sm text-muted">
            {survivalMethodLabel(record.method || "o-tieu-chuan")}
          </p>
        </button>
        <button
          type="button"
          className="flex size-11 shrink-0 items-center justify-center text-muted hover:text-danger"
          onClick={(e) => {
            e.stopPropagation();
            if (!confirm("Xóa đợt điều tra này?")) return;
            onRemove();
          }}
          aria-label="Xóa đợt"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <button type="button" className="mt-4 grid w-full grid-cols-4 gap-2 text-left" onClick={onOpen}>
        <Stat k="Sống" v={nf0.format(record.alive)} tone="ok" />
        <Stat k="Chết" v={nf0.format(dead)} tone="danger" />
        <Stat k="Trồng dặm" v={nf0.format(replanted)} tone="info" />
        <Stat k="Tỷ lệ" v={`${nf1.format(rate)}%`} />
      </button>
    </li>
  );
}

export function SurvivalDetail({ record }: { record: SurvivalCheck }) {
  const rate = survivalRate(record.planted, record.alive);
  const dead = record.dead ?? Math.max(0, record.planted - record.alive);
  const replanted = record.replanted ?? 0;
  const bang = (record.method || "o-tieu-chuan") === "bang";
  const expectedOnStrip =
    bang && record.widthM > 0 && record.lengthM > 0
      ? Math.floor(record.lengthM / record.widthM) + 1
      : 0;
  const size =
    bang && record.lengthM && record.widthM
      ? `${nf0.format(record.lengthM)} m · khoảng cách cây ${nf1.format(record.widthM)} m`
      : "";

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        {survivalMethodLabel(record.method || "o-tieu-chuan")}
        {size ? ` · ${size}` : ""}
      </p>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat k="Sống" v={nf0.format(record.alive)} tone="ok" />
        <Stat k="Chết" v={nf0.format(dead)} tone="danger" />
        <Stat k="Trồng dặm" v={nf0.format(replanted)} tone="info" />
        <Stat k="Tỷ lệ" v={`${nf1.format(rate)}%`} />
      </dl>
      {expectedOnStrip > 0 ? (
        <p className="text-center text-sm text-muted">
          Dự kiến {nf0.format(expectedOnStrip)} cây trên băng
        </p>
      ) : null}
      <div className="h-1.5 overflow-hidden rounded-full bg-bg-subtle">
        <div className="h-full rounded-full bg-ok" style={{ width: `${Math.min(100, rate)}%` }} />
      </div>
      {record.notes ? <p className="text-sm text-muted">{record.notes}</p> : null}
      {record.stems?.length ? <CountedStemList stems={record.stems} /> : null}
    </div>
  );
}

function Stat({
  k,
  v,
  tone,
}: {
  k: string;
  v: string;
  tone?: "ok" | "danger" | "info";
}) {
  return (
    <div>
      <dt className="text-xs text-subtle">{k}</dt>
      <dd
        className={cn(
          "font-medium tabular-nums",
          tone === "ok" && "text-ok",
          tone === "danger" && "text-danger",
          tone === "info" && "text-info",
        )}
      >
        {v}
      </dd>
    </div>
  );
}
