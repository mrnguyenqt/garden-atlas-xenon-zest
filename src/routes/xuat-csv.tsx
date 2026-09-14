import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, FileDown } from "lucide-react";
import { BackToDieuTra } from "@/components/dieu-tra-nav";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useCustomSpecies } from "@/lib/custom-species";
import { csvStamp, saveFileAs } from "@/lib/csv";
import { excelFile, type ExcelSheet } from "@/lib/excel";
import { truLuongTable, tyLeSongTable } from "@/lib/export-survey";
import { useOps } from "@/lib/ops";
import { usePlots } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/xuat-csv")({ component: ExportPage });

const DATA_KINDS = [
  { id: "all", label: "Tất cả" },
  { id: "tru-luong", label: "Điều tra trữ lượng" },
  { id: "ty-le-song", label: "Điều tra tỷ lệ cây sống" },
] as const;

type DataKind = (typeof DATA_KINDS)[number]["id"];

function ExportPage() {
  useCustomSpecies((s) => s.items);
  useCustomSpecies((s) => s.renames);
  const projects = useOps((s) => s.projects);
  const allSurvivals = useOps((s) => s.survivals);
  const allPlots = usePlots((s) => s.plots);
  const [picked, setPicked] = useState<string | null>(null);
  const [dataKind, setDataKind] = useState<DataKind>("all");
  const [note, setNote] = useState("");
  const project = projects.find((p) => p.id === picked) ?? null;

  function excelPack() {
    if (!project) return [];
    const stamp = csvStamp();
    const plots = allPlots.filter((p) => p.projectId === project.id);
    const plotIds = new Set(plots.map((p) => p.id));
    const survivals = allSurvivals.filter(
      (s) => s.projectId === project.id || (s.plotId && plotIds.has(s.plotId)),
    );
    const sheets: ExcelSheet[] = [];
    if (dataKind === "all" || dataKind === "tru-luong") {
      const [headers, rows] = truLuongTable(plots, [project]);
      sheets.push({ name: "Trữ lượng", headers, rows });
    }
    if (dataKind === "all" || dataKind === "ty-le-song") {
      const [headers, rows] = tyLeSongTable(survivals, allPlots, [project]);
      sheets.push({ name: "Tỷ lệ sống", headers, rows });
    }
    if (!sheets.length) return [];
    const slug = project.name.replace(/\s+/g, "-") || "du-an";
    return [excelFile(`${slug}-${stamp}.xlsx`, sheets)];
  }

  async function exportExcel() {
    setNote("");
    if (!project) {
      setNote("Chọn một dự án để xuất.");
      return;
    }
    const files = excelPack();
    if (!files.length) {
      setNote("Không tạo được file Excel.");
      return;
    }
    try {
      let last: "saved" | "shared" | "downloaded" | "cancel" = "downloaded";
      for (const file of files) last = await saveFileAs(file);
      if (last === "cancel") {
        setNote("Đã hủy.");
        return;
      }
      if (last === "saved") {
        setNote("Chọn thư mục trên máy rồi lưu file Excel.");
        return;
      }
      if (last === "shared") {
        setNote("Đã mở hộp chia sẻ. Chọn Files, Drive hoặc Excel để lưu.");
        return;
      }
      setNote("Đã gửi file Excel. Nếu chưa thấy, mở hộp chia sẻ hoặc thư mục Tải xuống.");
    } catch {
      setNote("Không xuất được. Thử lại.");
    }
  }

  return (
    <div className="mx-auto max-w-content px-5 pt-3 pb-8 md:px-10 md:pt-8 md:pb-12">
      <div className="flex flex-col items-center text-center">
        <BackToDieuTra />
        <h1 className="font-display text-4xl italic">Xuất Excel</h1>
        <p className="mt-3 max-w-prose text-muted">File .xlsx, mở trực tiếp bằng Microsoft Excel hoặc Google Sheets.</p>
      </div>

      {projects.length === 0 && allPlots.length === 0 && allSurvivals.length === 0 ? (
        <p className="mt-10 text-center text-muted">Chưa có số liệu để xuất.</p>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          {projects.length > 0 ? (
            <Field label="Chọn dự án" htmlFor="csv-projects">
              <div id="csv-projects" role="radiogroup" aria-label="Chọn dự án" className="grid gap-2">
                {projects.map((p) => (
                  <PickRow
                    key={p.id}
                    on={picked === p.id}
                    onClick={() => setPicked(p.id)}
                    title={p.name}
                    hint={p.location || "Chưa ghi vị trí"}
                  />
                ))}
              </div>
            </Field>
          ) : null}
          <Field label="Chọn dữ liệu" htmlFor="csv-data">
            <div id="csv-data" role="radiogroup" aria-label="Chọn dữ liệu" className="grid gap-2">
              {DATA_KINDS.map((k) => (
                <PickRow
                  key={k.id}
                  on={dataKind === k.id}
                  onClick={() => setDataKind(k.id)}
                  title={k.label}
                />
              ))}
            </div>
          </Field>
        </div>
      )}
      <div className="mx-auto mt-6 flex w-full max-w-xl flex-col gap-2">
        <Button className="w-full" disabled={!project} onClick={() => void exportExcel()}>
          <FileDown />
          {project ? `Xuất ${project.name}` : "Chọn dự án để xuất"}
        </Button>
        {note ? <p className="text-center text-sm text-muted">{note}</p> : null}
      </div>
    </div>
  );
}

function PickRow({
  on,
  onClick,
  title,
  hint,
}: {
  on: boolean;
  onClick: () => void;
  title: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-sm px-3 py-2 text-left text-sm leading-tight transition-[background-color,box-shadow,color] duration-(--motion-quick) ease-(--ease-out)",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        on
          ? "bg-primary text-primary-fg"
          : "bg-bg-subtle text-fg shadow-(--shadow-border) hover:shadow-(--shadow-border-hover)",
      )}
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-xs",
          on ? "bg-primary-fg/15" : "shadow-(--shadow-border)",
        )}
        aria-hidden
      >
        {on ? <Check className="size-3" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        {hint ? (
          <span className={cn("block text-xs", on ? "text-primary-fg/80" : "text-muted")}>{hint}</span>
        ) : null}
      </span>
    </button>
  );
}
