import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormSheet } from "@/components/form-sheet";
import { ProjectForm } from "@/components/project-form";
import { BackToDieuTra } from "@/components/dieu-tra-nav";
import { findSpecies, useCustomSpecies } from "@/lib/custom-species";
import {
  expectedTrees,
  kindLabel,
  statusLabel,
  useOps,
  useOpsHydrated,
} from "@/lib/ops";
import { nf0, nf1 } from "@/lib/utils";

export const Route = createFileRoute("/du-an/")({ component: ProjectsPage });

function ProjectsPage() {
  useCustomSpecies((s) => s.items);
  useCustomSpecies((s) => s.renames);
  const projects = useOps((s) => s.projects);
  const hydrated = useOpsHydrated();
  const addProject = useOps((s) => s.addProject);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const empty = hydrated && projects.length === 0;

  return (
    <div className="mx-auto max-w-content px-5 pt-3 pb-8 md:px-10 md:pt-8 md:pb-12">
      <BackToDieuTra />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl italic">Dự án</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus />
          Dự án mới
        </Button>
        <FormSheet open={open} onClose={() => setOpen(false)} title="Tạo dự án">
          {open ? (
            <ProjectForm
              key="new-project"
              submitLabel="Lưu dự án"
              onSubmit={(draft) => {
                const id = addProject(draft);
                setOpen(false);
                void navigate({ to: "/du-an/$id", params: { id } });
              }}
            />
          ) : null}
        </FormSheet>
      </div>

      {!hydrated ? (
        <p className="mt-16 text-center text-muted">Đang tải dự án…</p>
      ) : empty ? (
        <div className="mt-8 flex flex-col items-center text-center">
          <FolderKanban className="size-8 text-muted" />
          <p className="mt-4 max-w-sm text-muted">Chưa có dự án.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4">
          {projects.map((p) => {
            const sp = findSpecies(p.speciesSlug);
            return (
              <li key={p.id}>
                <Link
                  to="/du-an/$id"
                  params={{ id: p.id }}
                  className="block rounded-xl bg-bg-elevated p-5 shadow-(--shadow-border) transition-transform duration-(--motion-quick) hover:-translate-y-0.5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-2xl italic">{p.name}</h2>
                    <Badge tone={p.status === "hoan-thanh" ? "ok" : "default"}>
                      {statusLabel(p.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {p.location || "Chưa ghi vị trí"} · {kindLabel(p.kind)} · {p.year}
                  </p>
                  <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Cell k="Loài" v={sp?.name ?? p.speciesSlug} />
                    <Cell k="Diện tích" v={`${nf1.format(p.areaHa)} ha`} />
                    <Cell k="Mật độ" v={`${nf0.format(p.density)} /ha`} />
                    <Cell k="Cây dự kiến" v={nf0.format(expectedTrees(p))} />
                  </dl>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-subtle">{k}</dt>
      <dd className="font-medium tabular-nums">{v}</dd>
    </div>
  );
}
