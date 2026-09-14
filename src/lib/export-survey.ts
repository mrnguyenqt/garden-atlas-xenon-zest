import { csvDate, csvNum, csvNumOrEmpty, csvStamp, saveFileAs } from "@/lib/csv";
import { excelFile } from "@/lib/excel";
import { forestKindLabel, plotAreaM2 } from "@/lib/forestry";
import { findSpecies } from "@/lib/custom-species";
import { expectedTreesOnStrip, survivalMethodLabel, survivalRate, type SurvivalCheck } from "@/lib/ops";
import { parseLocationParts } from "@/lib/site";
import { treeFormFactor, type Plot } from "@/lib/store";

function fileBase(name: string) {
  const cleaned = String(name || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "o-tieu-chuan";
}

function projectNameOf(projects: { id: string; name: string }[], id: string) {
  if (!id) return projects.length === 1 ? projects[0].name : "";
  return projects.find((p) => p.id === id)?.name ?? (projects.length === 1 ? projects[0].name : "");
}

function survivalProjectName(
  s: SurvivalCheck,
  plot: Plot | undefined,
  projects: { id: string; name: string }[],
) {
  return (
    projectNameOf(projects, s.projectId) ||
    projectNameOf(projects, plot?.projectId ?? "") ||
    ""
  );
}

export const TRU_LUONG_HEADERS = [
  "Dự án",
  "STT",
  "Số hiệu ô",
  "Tiểu khu",
  "Khoảnh",
  "Lô",
  "Toạ độ X",
  "Toạ độ Y",
  "Loại rừng",
  "Trạng thái rừng",
  "Diện tích ô (m²)",
  "Ngày",
  "Người lập",
  "Loài",
  "C1.3 (cm)",
  "Hvn (m)",
  "f",
  "Phẩm chất",
  "Ghi chú",
];

export const TY_LE_SONG_HEADERS = [
  "Dự án",
  "STT",
  "Số hiệu ô",
  "Tiểu khu",
  "Khoảnh",
  "Lô",
  "Chế độ",
  "Loài",
  "Ngày",
  "Dài băng (m)",
  "Khoảng cách cây (m)",
  "Dự kiến cây trên băng",
  "Trồng",
  "Sống",
  "Chết",
  "Trồng dặm",
  "Tỷ lệ sống (%)",
  "Ghi chú",
];

function byPlotDate(a: Plot, b: Plot) {
  const da = a.date || "";
  const db = b.date || "";
  if (da !== db) return da.localeCompare(db);
  return (a.name || "").localeCompare(b.name || "", "vi");
}

export function truLuongTable(
  plots: Plot[],
  projects: { id: string; name: string }[] = [],
): [string[], Array<Array<string | number>>] {
  const rows: Array<Array<string | number>> = [];
  let stt = 0;
  for (const p of [...plots].sort(byPlotDate)) {
    const loc = parseLocationParts(p.location);
    const project = projectNameOf(projects, p.projectId);
    const plotMeta = [
      p.name,
      loc.tieuKhu,
      loc.khoanh,
      loc.lo,
      p.coordX ? String(Math.round(p.coordX)) : "",
      p.coordY ? String(Math.round(p.coordY)) : "",
      forestKindLabel(p.forestSlug),
      p.stand || "",
      csvNum(Math.round(plotAreaM2(p)), 0),
      csvDate(p.date),
      p.surveyor || "",
    ];
    if (p.trees.length === 0) {
      stt += 1;
      rows.push([project, stt, ...plotMeta, "", "", "", "", "", ""]);
      continue;
    }
    for (const t of p.trees) {
      stt += 1;
      const f = t.source === "nhanh" ? "" : csvNum(treeFormFactor(t, p.stand), 2);
      rows.push([
        project,
        stt,
        ...plotMeta,
        t.speciesName,
        csvNum(t.circCm, 1),
        csvNum(t.heightM, 1),
        f,
        t.quality,
        t.notes,
      ]);
    }
  }
  return [TRU_LUONG_HEADERS, rows];
}

export function tyLeSongTable(
  survivals: SurvivalCheck[],
  plots: Plot[],
  projects: { id: string; name: string }[] = [],
): [string[], Array<Array<string | number>>] {
  const plotOf = (id?: string) => plots.find((p) => p.id === id);
  const ordered = [...survivals].sort((a, b) => {
    const pa = plotOf(a.plotId);
    const pb = plotOf(b.plotId);
    const da = pa?.date || a.date || "";
    const db = pb?.date || b.date || "";
    if (da !== db) return da.localeCompare(db);
    const byName = (pa?.name || "").localeCompare(pb?.name || "", "vi");
    if (byName) return byName;
    return (a.date || "").localeCompare(b.date || "");
  });
  const rows = ordered.map((s, i) => {
    const plot = plotOf(s.plotId);
    const loc = parseLocationParts(plot?.location ?? "");
    const bang = s.method === "bang";
    const expected = expectedTreesOnStrip(s.lengthM, s.widthM);
    return [
      survivalProjectName(s, plot, projects),
      i + 1,
      plot?.name ?? "",
      loc.tieuKhu,
      loc.khoanh,
      loc.lo,
      survivalMethodLabel(s.method || "o-tieu-chuan"),
      s.name || findSpecies(s.speciesSlug)?.name || s.speciesSlug,
      csvDate(s.date),
      bang || s.lengthM > 0 ? csvNumOrEmpty(s.lengthM, 1) : "",
      bang || s.widthM > 0 ? csvNumOrEmpty(s.widthM, 1) : "",
      expected > 0 ? csvNum(expected, 0) : "",
      csvNum(s.planted, 0),
      csvNum(s.alive, 0),
      csvNum(s.dead ?? Math.max(0, s.planted - s.alive), 0),
      csvNum(s.replanted ?? 0, 0),
      csvNum(survivalRate(s.planted, s.alive), 1),
      s.notes,
    ];
  });
  return [TY_LE_SONG_HEADERS, rows];
}

export async function exportPlotCsv(
  plot: Plot,
  survivals: SurvivalCheck[],
  projects: { id: string; name: string }[] = [],
) {
  const stamp = csvStamp();
  const base = fileBase(plot.name);
  const [volHeaders, volRows] = truLuongTable([plot], projects);
  const sheets = [{ name: "Trữ lượng", headers: volHeaders, rows: volRows }];
  const mine = (survivals ?? []).filter((s) => s.plotId === plot.id);
  if (mine.length) {
    const [svHeaders, svRows] = tyLeSongTable(mine, [plot], projects);
    sheets.push({ name: "Tỷ lệ sống", headers: svHeaders, rows: svRows });
  }
  await saveFileAs(excelFile(`${base}-${stamp}.xlsx`, sheets));
}
