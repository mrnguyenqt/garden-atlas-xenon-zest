import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleDot, FileDown, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormSheet } from "@/components/form-sheet";
import { PlotEditDialog, PlotForm, openPlotPage } from "@/components/plot-form";
import { BackToDieuTra } from "@/components/dieu-tra-nav";
import { usePlots, usePlotsHydrated } from "@/lib/store";
import { useOps } from "@/lib/ops";
import { exportPlotCsv } from "@/lib/export-survey";
import { forestKindLabel, plotShapeLabel } from "@/lib/forestry";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/o-mau/o-tieu-chuan")({ component: StandardPlotsPage });

function StandardPlotsPage() {
  const plots = usePlots((s) => s.plots);
  const hydrated = usePlotsHydrated();
  const addPlot = usePlots((s) => s.addPlot);
  const removePlot = usePlots((s) => s.removePlot);
  const survivals = useOps((s) => s.survivals);
  const projects = useOps((s) => s.projects);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const empty = hydrated && plots.length === 0;

  return (
    <div className="mx-auto max-w-content px-5 pt-3 pb-8 md:px-10 md:pt-8 md:pb-12">
      <BackToDieuTra />
      <div className="flex flex-col items-center text-center">
        <h1 className="font-display text-4xl italic">Lập ô tiêu chuẩn</h1>
        <Button className="mt-4" onClick={() => setOpen(true)}>
          <Plus />
          Lập ô tiêu chuẩn mới
        </Button>
        <FormSheet open={open} onClose={() => setOpen(false)} title="Lập ô tiêu chuẩn">
          {open ? (
            <PlotForm
              key="new-plot"
              submitLabel="Lưu ô"
              onSubmit={(draft) => {
                const id = addPlot(draft);
                if (!id) return;
                setOpen(false);
                openPlotPage(id);
              }}
            />
          ) : null}
        </FormSheet>
      </div>

      {!hydrated ? (
        <p className="mt-16 text-center text-muted">Đang tải ô tiêu chuẩn…</p>
      ) : empty ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <CircleDot className="size-8 text-muted" />
          <p className="mt-4 max-w-sm text-muted">Chưa có ô tiêu chuẩn.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4">
          {plots.map((p) => {
            const forest = forestKindLabel(p.forestSlug);
            const project = projects.find((x) => x.id === p.projectId);
            return (
              <li key={p.id} className="flex items-stretch rounded-xl bg-bg-elevated shadow-(--shadow-border)">
                <Link
                  to="/o-mau/$id"
                  params={{ id: p.id }}
                  className="min-w-0 flex-1 p-5 transition-transform duration-(--motion-quick) hover:-translate-y-0.5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-2xl italic">{p.name}</h2>
                    <p className="text-sm text-muted">{formatDate(p.date)}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {project ? `${project.name} · ` : ""}
                    {p.location || "Chưa ghi vị trí"}
                    {forest ? ` · ${forest}` : ""}
                    {p.stand ? ` · ${p.stand}` : ""}
                  </p>
                  <p className="mt-3 text-sm">
                    {plotShapeLabel(p)}
                    {p.surveyor ? ` · ${p.surveyor}` : ""}
                  </p>
                </Link>
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    className="m-2 mb-0 flex size-11 items-center justify-center text-muted hover:text-fg"
                    onClick={() => setEditId(p.id)}
                    aria-label={`Sửa ô ${p.name}`}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="m-2 mt-0 flex size-11 items-center justify-center text-muted hover:text-danger"
                    onClick={() => {
                      if (!confirm(`Xóa ô ${p.name}?`)) return;
                      removePlot(p.id);
                    }}
                    aria-label={`Xóa ô ${p.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="m-2 mt-0 flex size-11 items-center justify-center text-muted hover:text-fg"
                    onClick={() => void exportPlotCsv(p, survivals, projects)}
                    aria-label={`Xuất Excel ${p.name}`}
                  >
                    <FileDown className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <PlotEditDialog
        plot={plots.find((p) => p.id === editId) ?? null}
        open={Boolean(editId)}
        onOpenChange={(next) => {
          if (!next) setEditId(null);
        }}
      />
    </div>
  );
}
