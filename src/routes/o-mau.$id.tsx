import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Plus, Sprout, Trash2 } from "lucide-react";
import { SPECIES } from "@/lib/catalog";
import { findSpecies } from "@/lib/custom-species";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FormSheet } from "@/components/form-sheet";
import { Input } from "@/components/ui/input";
import { Field, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { SpeciesSelect } from "@/components/species-select";
import { MeasureDisplay, MeasurePad, NumPad, applyNumKey } from "@/components/num-pad";
import { PlotEditDialog } from "@/components/plot-form";
import { PlotPhotos } from "@/components/plot-photos";
import { GpsStatus, GpsVerifyButton } from "@/components/gps-verify";
import { gpsAccuracyGrade, isGpsVerified } from "@/lib/gps";
import { SurvivalPanel, SurvivalSummaryCard, SurvivalDetail } from "@/components/survival-panel";
import { useOps } from "@/lib/ops";
import { useBackToClose } from "@/lib/phone-nav";
import { summarizePlot, TREE_QUALITIES, treeFormFactor, usePlots, usePlotsHydrated, type TreeQuality, type TreeRecord } from "@/lib/store";
import { forestKindLabel, plotShapeLabel, STEM_FORMS, treeBasalAreaM2, treeVolumeM3 } from "@/lib/forestry";
import { cn, formatDate, formatHa, nf0, nf1, nf3 } from "@/lib/utils";

export const Route = createFileRoute("/o-mau/$id")({ component: PlotDetail });

function PlotDetail() {
  const { id } = Route.useParams();
  const hydrated = usePlotsHydrated();
  const plot = usePlots((s) => s.plots.find((p) => p.id === id));
  const addTree = usePlots((s) => s.addTree);
  const removeTree = usePlots((s) => s.removeTree);
  const removePlot = usePlots((s) => s.removePlot);
  const updatePlot = usePlots((s) => s.updatePlot);
  const allSurvivals = useOps((s) => s.survivals);
  const projects = useOps((s) => s.projects);
  const removeSurvival = useOps((s) => s.removeSurvival);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [svOpen, setSvOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  if (!plot) {
    if (!hydrated) {
      return (
        <div className="mx-auto max-w-content px-5 py-16">
          <p className="text-muted">Đang mở ô điều tra…</p>
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-content px-5 py-16 text-center">
        <p className="text-muted">Không tìm thấy ô điều tra này.</p>
        <Button asChild className="mt-6">
          <Link to="/o-mau/o-tieu-chuan">Về ô tiêu chuẩn</Link>
        </Button>
      </div>
    );
  }
  const s = summarizePlot(plot);
  const forest = forestKindLabel(plot.forestSlug);
  const project = projects.find((x) => x.id === plot.projectId);
  const survivals = allSurvivals.filter((x) => x.plotId === plot.id);
  const viewing = survivals.find((x) => x.id === viewId);

  return (
    <div className="mx-auto max-w-content overflow-x-hidden px-5 pt-3 pb-8 md:px-10 md:pt-8 md:pb-12">
      <Button asChild className="mb-3">
        <Link to="/o-mau/o-tieu-chuan">
          <ArrowLeft />
          Ô tiêu chuẩn
        </Link>
      </Button>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl italic">{plot.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {project ? `${project.name} · ` : ""}
            {plot.location || "Chưa ghi vị trí"} · {formatDate(plot.date)}
            {forest ? ` · ${forest}` : ""}
            {plot.stand ? ` · ${plot.stand}` : ""}
          </p>
          <p className="mt-1 text-sm text-muted">
            {plotShapeLabel(plot)}
            {plot.surveyor ? ` · ${plot.surveyor}` : ""}
          </p>
          {plot.coordX || plot.coordY ? (
            <p className="mt-1 text-sm text-muted tabular-nums">
              {[
                plot.coordX ? `X: ${Math.round(plot.coordX)}` : null,
                plot.coordY ? `Y: ${Math.round(plot.coordY)}` : null,
              ]
                .filter(Boolean)
                .join("; ")}
            </p>
          ) : null}
          <div className="mt-2">
            <GpsStatus
              gpsLat={plot.gpsLat}
              gpsLng={plot.gpsLng}
              gpsAccuracyM={plot.gpsAccuracyM}
              gpsAt={plot.gpsAt}
            />
          </div>
          {plot.notes ? <p className="mt-2 max-w-prose text-sm text-muted">{plot.notes}</p> : null}
        </div>
        <div
          className={cn(
            "grid w-full items-center gap-2 sm:w-80",
            gpsAccuracyGrade(plot.gpsAccuracyM).ok && isGpsVerified(plot)
              ? "grid-cols-[1fr_auto]"
              : "grid-cols-[1fr_1fr_auto]",
          )}
        >
          {gpsAccuracyGrade(plot.gpsAccuracyM).ok && isGpsVerified(plot) ? null : (
          <GpsVerifyButton
            compact
            className="min-w-0"
            onFix={(fix) => {
              updatePlot(plot.id, {
                coordX: fix.x,
                coordY: fix.y,
                gpsLat: fix.lat,
                gpsLng: fix.lng,
                gpsAccuracyM: fix.accuracyM,
                gpsAt: fix.at,
              });
            }}
          />
          )}
          <Button variant="secondary" size="sm" className="h-9 w-full min-w-0" onClick={() => setEditOpen(true)}>
            <Pencil />
            Sửa
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 shrink-0 px-0"
            onClick={() => {
              if (!confirm("Xóa cả ô điều tra này?")) return;
              removePlot(plot.id);
              void navigate({ to: "/o-mau/o-tieu-chuan" });
            }}
          >
            <Trash2 />
            <span className="sr-only">Xóa ô</span>
          </Button>
        </div>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display min-w-0 shrink text-xl leading-tight whitespace-nowrap italic md:text-2xl">
            Điều tra trữ lượng
          </h2>
          <Button size="sm" className="shrink-0" onClick={() => setOpen(true)}>
            <Plus />
            Thêm cây
          </Button>
          <FormSheet open={open} onClose={() => setOpen(false)} title="Nhập cây">
            {open ? (
              <TreeForm
                key="new-trees"
                defaultForm={treeFormFactor(undefined, plot.stand)}
                onSubmit={(trees) => {
                  for (const tree of trees) addTree(plot.id, tree);
                  setOpen(false);
                }}
              />
            ) : null}
          </FormSheet>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {plot.shape === "rect" ? (
            <Stat k="Chiều dài băng" v={`${nf1.format(plot.lengthM)} m`} />
          ) : (
            <Stat k="Diện tích ô" v={formatHa(s.areaM2)} />
          )}
          <Stat k="Số cây sống" v={nf0.format(s.n)} />
          <Stat k="N (mật độ)" v={`${nf0.format(s.nHa)} cây/ha`} />
          <Stat k="G (tiết diện)" v={`${nf1.format(s.gHa)} m²/ha`} />
          <Stat k="M (trữ lượng)" v={`${nf1.format(s.mHa)} m³/ha`} />
          <Stat k="Dg / Htb" v={`${nf1.format(s.dg)} cm · ${nf1.format(s.hMean)} m`} />
        </dl>

        {plot.trees.length === 0 ? (
          <p className="mt-6 text-center text-muted">Chưa có cây. Đo chu vi C1.3 tại 1,3 m, đo chiều dài toàn cây Hvn từ gốc đến ngọn.</p>
        ) : (
          <div className="mt-4 w-full max-w-full overflow-hidden rounded-xl bg-bg-elevated shadow-(--shadow-border)">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="text-xs tracking-wide text-muted uppercase">
                <tr className="border-b border-border">
                  <th className="w-[28%] px-2 py-2 font-medium">Loài</th>
                  <th className="w-[13%] px-1 py-2 font-medium">C1.3</th>
                  <th className="w-[12%] px-1 py-2 font-medium">Hvn</th>
                  <th className="w-[14%] px-1 py-2 font-medium">g</th>
                  <th className="w-[14%] px-1 py-2 font-medium">V</th>
                  <th className="w-[10%] px-1 py-2 font-medium">Cấp</th>
                  <th className="w-9 px-0 py-2 font-medium">
                    <span className="sr-only">Xóa</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {plot.trees.map((t) => {
                  const f = treeFormFactor(t, plot.stand);
                  const g = treeBasalAreaM2(t.circCm);
                  const v = treeVolumeM3(t.circCm, t.heightM, f);
                  return (
                    <tr key={t.id} className="border-b border-border last:border-0">
                      <td className="truncate px-2 py-2">
                        {t.speciesSlug ? (
                          <Link
                            to="/loai/$slug"
                            params={{ slug: t.speciesSlug }}
                            className="block truncate hover:text-primary"
                          >
                            {t.speciesName}
                          </Link>
                        ) : (
                          <span className="block truncate">{t.speciesName}</span>
                        )}
                      </td>
                      <td className="px-1 py-2 tabular-nums">{nf1.format(t.circCm)}</td>
                      <td className="px-1 py-2 tabular-nums">{nf1.format(t.heightM)}</td>
                      <td className="px-1 py-2 tabular-nums">{nf3.format(g)}</td>
                      <td className="px-1 py-2 tabular-nums">{nf3.format(v)}</td>
                      <td className="px-1 py-2">
                        <Badge tone={t.quality === "D" ? "danger" : t.quality === "A" ? "ok" : "default"}>
                          {t.quality}
                        </Badge>
                      </td>
                      <td className="px-0 py-1">
                        <button
                          type="button"
                          className="flex size-9 items-center justify-center text-muted hover:text-danger"
                          onClick={() => removeTree(plot.id, t.id)}
                          aria-label="Xóa cây"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-6 text-xs text-subtle">
          Phẩm chất D (cây chết) không tính vào N, G, M.
        </p>
      </section>

      <PlotPhotos plot={plot} />

      <section className="mt-10">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display min-w-0 shrink text-lg leading-tight whitespace-nowrap italic md:text-2xl">
            Điều tra tỷ lệ cây sống
          </h2>
          <Dialog open={svOpen} onOpenChange={setSvOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="shrink-0">
                <Sprout />
                Đợt mới
              </Button>
            </DialogTrigger>
            <DialogContent title="Tỷ lệ cây sống">
              <SurvivalPanel plotId={plot.id} onSaved={() => setSvOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
        {survivals.length === 0 ? (
          <p className="mt-6 text-center text-muted">Chưa có đợt. Ấn Đợt mới để đếm cây sống, chết và trồng dặm.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {survivals.map((sv) => (
              <SurvivalSummaryCard
                key={sv.id}
                record={sv}
                onOpen={() => setViewId(sv.id)}
                onRemove={() => {
                  removeSurvival(sv.id);
                  if (viewId === sv.id) setViewId(null);
                }}
              />
            ))}
          </ul>
        )}
      </section>
      <Dialog open={Boolean(viewing)} onOpenChange={(next) => { if (!next) setViewId(null); }}>
        <DialogContent title={viewing?.name ?? "Tỷ lệ cây sống"}>
          {viewing ? <SurvivalDetail record={viewing} /> : null}
        </DialogContent>
      </Dialog>
      <PlotEditDialog plot={plot} open={editOpen} onOpenChange={setEditOpen} />
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

type QuickRow = { circ: string; h: string; quality: TreeQuality };

function emptyQuickRow(): QuickRow {
  return { circ: "", h: "", quality: "A" };
}

function TreeForm({
  defaultForm,
  onSubmit,
}: {
  defaultForm: number;
  onSubmit: (trees: Omit<TreeRecord, "id">[]) => void;
}) {
  const [mode, setMode] = useState<"chuan" | "nhanh">("chuan");
  const [slug, setSlug] = useState(SPECIES[0].slug);
  const [custom, setCustom] = useState("");
  const [circ, setCirc] = useState("75");
  const [h, setH] = useState("18");
  const [form, setForm] = useState(defaultForm === 0.5 ? 0.5 : 0.45);
  const [quality, setQuality] = useState<TreeQuality>("A");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<QuickRow[]>(() => Array.from({ length: 8 }, emptyQuickRow));
  const [pad, setPad] = useState<{ i: number; field: "circ" | "h" } | null>(null);
  const [fresh, setFresh] = useState(true);
  useBackToClose(Boolean(pad), () => setPad(null));
  const known = findSpecies(slug);
  const quick = mode === "nhanh";

  function patchRow(i: number, patch: Partial<QuickRow>) {
    setRows((cur) => {
      const next = cur.map((row, j) => (j === i ? { ...row, ...patch } : row));
      const last = next[next.length - 1];
      if (last && (last.circ || last.h) && next.length < 40) next.push(emptyQuickRow());
      return next;
    });
  }

  function openPad(i: number, field: "circ" | "h") {
    setPad({ i, field });
    setFresh(true);
  }

  function pressPad(key: string) {
    if (!pad) return;
    if (key === "ok") {
      setPad(null);
      return;
    }
    setRows((cur) => {
      const row = cur[pad.i];
      if (!row) return cur;
      const current = pad.field === "circ" ? row.circ : row.h;
      const nextVal = applyNumKey(current, key, fresh && key !== "back");
      const next = cur.map((r, j) => (j === pad.i ? { ...r, [pad.field]: nextVal } : r));
      const last = next[next.length - 1];
      if (last && (last.circ || last.h) && next.length < 40) next.push(emptyQuickRow());
      return next;
    });
    setFresh(false);
  }

  return (
    <form
      className="flex w-full min-w-0 max-w-full flex-col gap-4 overflow-x-hidden"
      onSubmit={(e) => {
        e.preventDefault();
        const name = (!quick && custom.trim()) || known?.name || slug;
        const speciesSlug = !quick && custom.trim() ? undefined : slug;
        if (quick) {
          const trees = rows
            .map((row) => ({
              circCm: Number(row.circ.replace(",", ".")),
              heightM: Number(row.h.replace(",", ".")),
              quality: row.quality,
            }))
            .filter((row) => row.circCm > 0 && row.heightM > 0)
            .map((row) => ({
              speciesSlug,
              speciesName: name,
              circCm: row.circCm,
              heightM: row.heightM,
              formFactor: 0,
              source: "nhanh" as const,
              quality: row.quality,
              notes: "",
            }));
          if (!trees.length) return;
          onSubmit(trees);
          return;
        }
        const circCm = Number(circ);
        const heightM = Number(h);
        if (!(circCm > 0) || !(heightM > 0)) return;
        onSubmit([
          {
            speciesSlug,
            speciesName: name,
            circCm,
            heightM,
            formFactor: form,
            source: "chuan" as const,
            quality,
            notes,
          },
        ]);
      }}
    >
      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Cách nhập">
        <button
          type="button"
          role="tab"
          aria-selected={!quick}
          className={cn(
            "h-11 rounded-sm text-sm font-medium",
            !quick ? "bg-primary text-primary-fg" : "bg-bg-subtle text-muted hover:text-fg",
          )}
          onClick={() => {
            setMode("chuan");
            setPad(null);
          }}
        >
          Tiêu chuẩn
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={quick}
          className={cn(
            "h-11 rounded-sm text-sm font-medium",
            quick ? "bg-primary text-primary-fg" : "bg-bg-subtle text-muted hover:text-fg",
          )}
          onClick={() => setMode("nhanh")}
        >
          Nhanh
        </button>
      </div>
      <Field label="Loài" htmlFor="tree-sp">
        <SpeciesSelect id="tree-sp" value={slug} onChange={setSlug} />
      </Field>
      {quick ? (
        <div className="min-w-0">
          <div className="grid grid-cols-[1fr_1fr_4.75rem] gap-2 px-0.5 text-xs text-muted">
            <span>C1.3 (cm)</span>
            <span>Hvn (m)</span>
            <span>PC</span>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {rows.map((row, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="grid grid-cols-[1fr_1fr_4.75rem] gap-2">
                  <MeasureDisplay
                    id={`q-c-${i}`}
                    value={row.circ}
                    active={pad?.i === i && pad.field === "circ"}
                    emptyLabel=""
                    onOpen={() => openPad(i, "circ")}
                  />
                  <MeasureDisplay
                    id={`q-h-${i}`}
                    value={row.h}
                    active={pad?.i === i && pad.field === "h"}
                    emptyLabel=""
                    onOpen={() => openPad(i, "h")}
                  />
                  <Select
                    aria-label={`Phẩm chất hàng ${i + 1}`}
                    className="h-11 min-w-0 gap-0.5 px-1.5 text-center"
                    value={row.quality}
                    onChange={(e) => patchRow(i, { quality: e.target.value as TreeQuality })}
                  >
                    {TREE_QUALITIES.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.id}
                      </option>
                    ))}
                  </Select>
                </div>
                {pad?.i === i ? <NumPad onKey={pressPad} /> : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <Field label="Hoặc tên khác" htmlFor="tree-custom">
            <Input
              id="tree-custom"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Để trống nếu dùng danh lục"
            />
          </Field>
          <MeasurePad
            dbhId="tree-d"
            heightId="tree-h"
            dbh={circ}
            height={h}
            onDbh={setCirc}
            onHeight={setH}
          />
          <Field label="f (hình số thân cây)" htmlFor="tree-f">
            <Select
              id="tree-f"
              value={String(form)}
              onChange={(e) => setForm(Number(e.target.value) === 0.5 ? 0.5 : 0.45)}
            >
              {STEM_FORMS.map((x) => (
                <option key={x.f} value={String(x.f)}>
                  {x.label}
                </option>
              ))}
            </Select>
            <p className="text-xs text-subtle">V = (C₁.₃² / 4π) × Hvn × f · π = 3,14 · C nhập cm, đổi sang mét khi tính.</p>
          </Field>
          <Field label="Phẩm chất" htmlFor="tree-q">
            <Select
              id="tree-q"
              value={quality}
              onChange={(e) => setQuality(e.target.value as TreeQuality)}
            >
              {TREE_QUALITIES.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ghi chú" htmlFor="tree-n">
            <Input id="tree-n" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </>
      )}
      <Button type="submit">{quick ? "Lưu các cây" : "Lưu cây"}</Button>
    </form>
  );
}
