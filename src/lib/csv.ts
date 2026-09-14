import { nf0, nf1, nf2, nf3 } from "@/lib/utils";

/** Excel tiếng Việt: dấu phân cột `;`, thập phân `,`. */
export const CSV_SEP = ";";

export const FILE_READY_EVENT = "rv-file-ready";

let pendingFile: File | null = null;

export function getPendingExportFile() {
  return pendingFile;
}

export function clearPendingExportFile() {
  pendingFile = null;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(FILE_READY_EVENT, { detail: { name: "" } }));
  }
}

function publishFile(file: File) {
  pendingFile = file;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(FILE_READY_EVENT, { detail: { name: file.name } }));
  }
}

export function toCsv(headers: string[], rows: Array<Array<string | number>>): string {
  const esc = (value: string | number) => {
    const text = String(value ?? "");
    if (/[";\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  return [headers, ...rows].map((row) => row.map(esc).join(CSV_SEP)).join("\r\n");
}

export function csvFile(filename: string, csv: string) {
  return new File([`\uFEFF${csv}\r\n`], filename, { type: "text/csv;charset=utf-8;" });
}

function isPhoneLike() {
  if (typeof navigator === "undefined") return false;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) return true;
  if (typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches) return true;
  return false;
}

function nativeFiles() {
  if (typeof window === "undefined") return null;
  const bridge = (window as Window & { RungVangFiles?: { saveBase64: (name: string, mime: string, b64: string) => string } }).RungVangFiles;
  return bridge && typeof bridge.saveBase64 === "function" ? bridge : null;
}

async function fileToBase64(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let bin = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    bin += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(bin);
}

function fileExtOf(file: File) {
  const n = file.name.toLowerCase();
  if (n.endsWith(".kml")) return ".kml";
  if (n.endsWith(".csv")) return ".csv";
  if (n.endsWith(".xls") && !n.endsWith(".xlsx")) return ".xls";
  if (n.endsWith(".xlsx")) return ".xlsx";
  const mime = (file.type || "").toLowerCase();
  if (mime.includes("kml") || mime.includes("google-earth")) return ".kml";
  if (mime.includes("csv")) return ".csv";
  return ".xlsx";
}

async function saveNative(file: File) {
  const bridge = nativeFiles();
  if (!bridge) return false;
  const ext = fileExtOf(file);
  const mime =
    file.type ||
    (ext === ".kml"
      ? "application/vnd.google-earth.kml+xml"
      : ext === ".csv"
        ? "text/csv"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  const name = safeExportName(file.name, ext);
  const result = bridge.saveBase64(name, mime, await fileToBase64(file));
  return result === "ok";
}

function clickDownload(href: string, name: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.target = "_blank";
  a.rel = "noopener";
  a.style.display = "none";
  document.body.append(a);
  a.click();
  a.remove();
}

/** Tải file về máy. Object URL trước — không await, giữ cử chỉ chạm trên điện thoại. */
export async function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  clickDownload(url, file.name);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

async function shareFile(file: File): Promise<"shared" | "cancel" | false> {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean; share?: (data: ShareData) => Promise<void> };
  if (typeof nav.share !== "function") return false;
  const variants = [
    file,
    new File([file], file.name, { type: "application/octet-stream" }),
  ];
  for (const item of variants) {
    try {
      if (nav.canShare) {
        try {
          if (!nav.canShare({ files: [item] })) continue;
        } catch {
          /* một số WebView lỗi canShare — vẫn thử share */
        }
      }
      await nav.share({ files: [item], title: file.name, text: file.name });
      return "shared";
    } catch (err) {
      if ((err as Error).name === "AbortError") return "cancel";
    }
  }
  return false;
}

type SavePicker = (options?: {
  suggestedName?: string;
  excludeAcceptAllOption?: boolean;
  types?: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{
  createWritable: () => Promise<{
    write: (data: BufferSource | Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}>;

/** Máy tính và điện thoại: chọn vị trí lưu file. */
export async function saveFileAs(file: File) {
  if (isPhoneLike()) publishFile(file);
  if (await saveNative(file)) {
    clearPendingExportFile();
    return "saved" as const;
  }
  const picker = (window as Window & { showSaveFilePicker?: SavePicker }).showSaveFilePicker;
  if (typeof picker === "function") {
    try {
      const handle = await picker({
        suggestedName: file.name,
        excludeAcceptAllOption: false,
        types: [
          {
            description: "KML",
            accept: { "application/vnd.google-earth.kml+xml": [".kml"] },
          },
          {
            description: "Excel",
            accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
          },
          {
            description: "CSV (Excel)",
            accept: { "text/csv": [".csv"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(file);
      await writable.close();
      return "saved" as const;
    } catch (err) {
      if ((err as Error).name === "AbortError") return "cancel" as const;
    }
  }
  if (isPhoneLike()) {
    const shared = await shareFile(file);
    if (shared === "cancel") return "cancel" as const;
    if (shared === "shared") {
      clearPendingExportFile();
      return "shared" as const;
    }
  }
  await downloadFile(file);
  return "downloaded" as const;
}

export async function downloadCsv(filename: string, csv: string) {
  await saveFileAs(csvFile(filename, csv));
}

export function csvStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/** Android hay lưu thành `ten.xlsx (1)` — Excel không mở. Đưa (1) trước đuôi. */
export function safeExportName(name: string, ext = ".xlsx") {
  const e = ext.startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
  let base = String(name || "export").trim();
  const dup = base.match(/^(.+?)\.(xlsx|csv|xls|kml)\s*\((\d+)\)\s*$/i);
  if (dup) base = `${dup[1].trim()} (${dup[3]})`;
  else base = base.replace(/\.(xlsx|csv|xls|kml)$/i, "");
  base = base
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "export"}${e}`;
}

export function csvDate(iso: string) {
  return (iso || "").slice(0, 10);
}

export function csvNum(value: number, digits: 0 | 1 | 2 | 3 = 1) {
  if (!Number.isFinite(value)) return "";
  return (digits === 0 ? nf0 : digits === 3 ? nf3 : digits === 2 ? nf2 : nf1).format(value);
}

export function csvNumOrEmpty(value: number, digits: 0 | 1 | 2 | 3 = 1) {
  if (!Number.isFinite(value) || value === 0) return "";
  return csvNum(value, digits);
}
