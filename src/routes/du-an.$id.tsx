import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormSheet } from "@/components/form-sheet";
import { ProjectForm } from "@/components/project-form";
import { findSpecies, useCustomSpecies } from "@/lib/custom-species";
import {
  expectedTrees,
  kindLabel,
  statusLabel,
  survivalRate,
  useOps,
  useOpsHydrated,
} from "@/lib/ops";
import { groupPlotsByLot, usePlots, usePlotsHydrated } from "@/lib/store";
import { plotShapeLabel } from "@/lib/forestry";
import { formatDate, nf0, nf1 } from "@/lib/utils";

export const Route = createFileRoute("/du-an/$id")({ component: ProjectDetail });

function ProjectDetail() {
  const { id } = Route.useParams();
  useCustomSpecies((s) => s.items);
  useCustomSpecies((s) => s.renames);
  const hydrated = useOpsHydrated();
  const plotsHydrated = usePlotsHydrated();
  const project = useOps((s) => s.projects.find((p) => p.id === id));
  const allSurvivals = useOps((s) => s.survivals);
  const survivals = allSurvivals.filter((x) => x.projectId === id);
  const allPlots = usePlots((s) => s.plots);
  const plots = allPlots.filter((p) => p.projectId === id);
  const lots = groupPlotsByLot(plots);
  const updateProject = useOps((s) => s.updateProject);
  const removeProject = useOps((s) => s.removeProject);
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [lotKey, setLotKey] = useState<string | null>(null);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-content px-5 py-16">
        <p className="text-muted">Đang mở dự án…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <p className="text-muted">Không tìm thấy dự án này.</p>
        <Button asChild className="mt-6">
          <Link to="/du-an">Về dự án</Link>
        </Button>
      </div>
    );
  }

  const sp = findSpecies(project.speciesSlug);
  const planted = survivals.reduce((n, s) => n + s.planted, 0);
  const alive = survivals.reduce((n, s) => n + s.alive, 0);
  const projectRate = survivalRate(planted, alive);
  const openLot = lots.find((l) => l.key === lotKey);

  return (
    <div className="mx-auto max-w-content px-5 pt-3 pb-8 md:px-10 md:pt-8 md:pb-12">
      <Button asChild className="mb-3">
        <Link to="/du-an">
          <ArrowLeft />
          Dự án
        </Link>
      </Button>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl italic">{project.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {project.location || "Chưa ghi vị trí"} · {kindLabel(project.kind)} · {project.year}
          </p>
          {project.notes ? <p className="mt-2 max-w-prose text-sm text-muted">{project.notes}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            Sửa
          </Button>
          <FormSheet open={editOpen} onClose={() => setEditOpen(false)} title="Sửa dự án">
            {editOpen ? (
              <ProjectForm
                key={project.id}
                initial={project}
                submitLabel="Cập nhật"
                onSubmit={(draft) => {
                  updateProject(project.id, draft);
                  setEditOpen(false);
                }}
              />
            ) : null}
          </FormSheet>
          <Button
            variant="ghost"
            onClick={() => {
              if (!confirm("Xóa dự án này và số liệu gắn với nó?")) return;
              removeProject(project.id);
              void navigate({ to: "/du-an" });
            }}
          >
            <Trash2 />
            <span className="sr-only">Xóa dự án</span>
          </Button>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat k="Trạng thái" v={statusLabel(project.status)} />
        <Stat k="Loài" v={sp?.name ?? project.speciesSlug} />
        <Stat k="Diện tích" v={`${nf1.format(project.areaHa)} ha`} />
        <Stat k="Cây dự kiến" v={nf0.format(expectedTrees(project))} />
      </dl>

      <section className="mt-10">
        <h2 className="font-display text-2xl italic">Lô thuộc dự án</h2>
        {!plotsHydrated ? (
          <p className="mt-6 text-center text-muted">Đang đọc lô…</p>
        ) : lots.length === 0 ? (
          <p className="mt-6 text-center text-muted">
            Chưa có ô tiêu chuẩn gắn dự án này. Lập ô và chọn dự án khi tạo.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {lots.map((lot) => (
              <li key={lot.key}>
                <button
                  type="button"
                  className="w-full rounded-xl bg-bg-elevated px-5 py-4 text-left shadow-(--shadow-border) transition-transform duration-(--motion-quick) hover:-translate-y-0.5"
                  onClick={() => setLotKey(lot.key)}
                >
                  {lot.title} · {nf0.format(lot.plots.length)} ÔTC
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Dialog
        open={Boolean(openLot)}
        onOpenChange={(next) => {
          if (!next) setLotKey(null);
        }}
      >
        <DialogContent title={openLot ? `${openLot.title} · ${nf0.format(openLot.plots.length)} ÔTC` : "Ô tiêu chuẩn"}>
          {openLot ? (
            <ul className="grid gap-2">
              {openLot.plots.map((p) => (
                <li key={p.id}>
                  <Link
                    to="/o-mau/$id"
                    params={{ id: p.id }}
                    className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-bg-subtle px-4 py-3"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-sm text-muted">
                      {plotShapeLabel(p)} · {formatDate(p.date)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </DialogContent>
      </Dialog>

      <section className="mt-10">
        <h2 className="font-display text-2xl italic">Tỷ lệ cây sống dự án</h2>
        {planted > 0 ? (
          <p className="mt-4 rounded-xl bg-bg-elevated px-5 py-4 text-center shadow-(--shadow-border)">
            {nf1.format(projectRate)}% · {nf0.format(alive)}/{nf0.format(planted)} cây
          </p>
        ) : (
          <p className="mt-6 text-center text-muted">Chưa có số liệu tỷ lệ sống.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-bg-elevated p-4 shadow-(--shadow-border)">
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="mt-1 font-medium tabular-nums">{v}</dd>
    </div>
  );
}
