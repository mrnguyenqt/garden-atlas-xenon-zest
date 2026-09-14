import * as XLSX from "xlsx";
import { safeExportName } from "@/lib/csv";

export type ExcelSheet = {
  name: string;
  headers: string[];
  rows: Array<Array<string | number>>;
};

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function excelFile(filename: string, sheets: ExcelSheet[]) {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows]);
    ws["!cols"] = sheet.headers.map((h) => ({ wch: Math.min(28, Math.max(12, h.length + 2)) }));
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31) || "Sheet");
  }
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  return new File([out], safeExportName(filename, ".xlsx"), { type: XLSX_TYPE });
}