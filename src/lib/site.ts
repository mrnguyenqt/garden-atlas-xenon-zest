import { statusLotTree } from "@/lib/lot-info";
import { projectLotTree } from "@/lib/lot-projects";

export type LocationParts = {
  tieuKhu: string;
  khoanh: string;
  lo: string;
};

const EMPTY: LocationParts = { tieuKhu: "", khoanh: "", lo: "" };

function natCmp(a: string, b: string) {
  return a.localeCompare(b, "vi", { numeric: true, sensitivity: "base" });
}

function mergeLotTrees(
  a: Record<string, Record<string, string[]>>,
  b: Record<string, Record<string, string[]>>,
) {
  const out: Record<string, Record<string, string[]>> = {};
  for (const src of [a, b]) {
    for (const [tk, khs] of Object.entries(src)) {
      out[tk] ??= {};
      for (const [kh, los] of Object.entries(khs)) {
        const list = out[tk][kh] ?? [];
        for (const lo of los) if (!list.includes(lo)) list.push(lo);
        out[tk][kh] = list;
      }
    }
  }
  for (const khs of Object.values(out)) {
    for (const kh of Object.keys(khs)) khs[kh] = khs[kh].slice().sort(natCmp);
  }
  return out;
}

const STATUS_LOTS = statusLotTree();
const PROJECT_LOTS = projectLotTree();
const ALL_LOTS = mergeLotTrees(STATUS_LOTS, PROJECT_LOTS);

export type LotTreeKind = "all" | "status" | "project";

export function lotTree(kind: LotTreeKind = "all") {
  if (kind === "status") return STATUS_LOTS;
  if (kind === "project") return PROJECT_LOTS;
  return ALL_LOTS;
}

export const TIEU_KHU: Record<string, string[]> = Object.fromEntries(
  Object.entries(ALL_LOTS).map(([tk, khs]) => [tk, Object.keys(khs).sort(natCmp)]),
);

export const TIEU_KHU_IDS = Object.keys(ALL_LOTS).sort(natCmp);

export function tieuKhuIds(kind: LotTreeKind = "all") {
  return Object.keys(lotTree(kind)).sort(natCmp);
}

export const COMMUNE_UNITS = [
  { id: "hai-lang", label: "Xã Hải Lăng" },
  { id: "nam-hai-lang", label: "Xã Nam Hải Lăng" },
  { id: "trieu-phong", label: "Xã Triệu Phong" },
  { id: "phuong-quang-tri", label: "Phường Quảng Trị" },
] as const;

export type CommuneId = (typeof COMMUNE_UNITS)[number]["id"];

export function khoanhOf(tieuKhu: string, kind: LotTreeKind = "all") {
  return Object.keys(lotTree(kind)[tieuKhu] ?? {}).sort(natCmp);
}

export function loOf(tieuKhu: string, khoanh: string, kind: LotTreeKind = "all") {
  return lotTree(kind)[tieuKhu]?.[khoanh] ?? [];
}

export function lotExists(tieuKhu: string, khoanh: string, lo: string) {
  return loOf(tieuKhu, khoanh).includes(lo);
}

export function lotLookup(tieuKhu: string, khoanh: string, lo: string) {
  const tk = STATUS_LOTS[tieuKhu];
  const khoanhList = tk ? Object.keys(tk) : [];
  const loList = loOf(tieuKhu, khoanh, "status");
  const tieuKhuLoCount = tk ? Object.values(tk).reduce((n, list) => n + list.length, 0) : 0;
  return {
    tieuKhu,
    khoanh,
    lo,
    found: loList.includes(lo),
    khoanhList,
    loList,
    tieuKhuLoCount,
    khoanhCount: khoanhList.length,
  };
}

function capture(value: string, re: RegExp) {
  return value.match(re)?.[1]?.trim() ?? "";
}

export function parseLocationParts(value: string): LocationParts {
  if (!value.trim()) return { ...EMPTY };
  return {
    tieuKhu: capture(value, /(?:Tiểu khu|TK)\s*([^·,;|/]+)/i),
    khoanh: capture(value, /Khoảnh\s*([^·,;|/]+)/i),
    lo: capture(value, /Lô\s*([^·,;|/]+)/i),
  };
}

export function formatLocationParts(parts: LocationParts) {
  return [
    parts.tieuKhu.trim() && `Tiểu khu ${parts.tieuKhu.trim()}`,
    parts.khoanh.trim() && `Khoảnh ${parts.khoanh.trim()}`,
    parts.lo.trim() && `Lô ${parts.lo.trim()}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function plotCodeKey(name: string) {
  return name.replace(/^OTC-?/i, "").trim().toLowerCase();
}

export function sameLot(a: string, b: string) {
  const pa = parseLocationParts(a);
  const pb = parseLocationParts(b);
  const fold = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
  return fold(pa.tieuKhu) === fold(pb.tieuKhu) && fold(pa.khoanh) === fold(pb.khoanh) && fold(pa.lo) === fold(pb.lo);
}

export function locationFromLegacy(row: {
  location?: string;
  tieuKhu?: string;
  khoanh?: string;
  lo?: string;
}) {
  if (row.location?.trim()) return row.location.trim();
  return formatLocationParts({
    tieuKhu: row.tieuKhu ?? "",
    khoanh: row.khoanh ?? "",
    lo: row.lo ?? "",
  });
}

function foldPlace(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/^(xa|phuong)\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseCommunes(value: string): CommuneId[] {
  if (!value.trim()) return [];
  const picked = new Set<CommuneId>();
  for (const part of value.split(/[·,;|/]+/)) {
    const key = foldPlace(part);
    if (!key) continue;
    const match = COMMUNE_UNITS.find((c) => foldPlace(c.label) === key);
    if (match) picked.add(match.id);
  }
  return COMMUNE_UNITS.map((c) => c.id).filter((id) => picked.has(id));
}

export function formatCommunes(ids: readonly string[]) {
  const order = COMMUNE_UNITS.map((c) => c.id);
  return [...new Set(ids)]
    .sort((a, b) => order.indexOf(a as CommuneId) - order.indexOf(b as CommuneId))
    .map((id) => COMMUNE_UNITS.find((c) => c.id === id)?.label)
    .filter(Boolean)
    .join(" · ");
}

export function toggleCommune(value: string, id: CommuneId) {
  const current = parseCommunes(value);
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  return formatCommunes(next);
}
