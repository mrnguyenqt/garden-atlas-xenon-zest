export type LocationParts = {
  tieuKhu: string;
  khoanh: string;
  lo: string;
};

const EMPTY: LocationParts = { tieuKhu: "", khoanh: "", lo: "" };

/** Tiểu khu → khoảnh from forest-lot inventory. */
export const TIEU_KHU: Record<string, string[]> = {
  "814B": ["6A", "7", "8"],
  "818": ["4A", "7", "9", "10", "11", "12", "13", "14"],
  "831": [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "7A",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "16a",
    "16b",
    "16c",
    "16d",
    "17",
    "18",
    "18a",
    "18b",
    "18c",
    "19",
  ],
  "834": ["1", "2", "3", "4", "5"],
  "843": ["1", "2", "3", "4", "5", "6", "7", "8"],
  "844": ["2", "3", "4", "5", "6", "7", "8", "9", "10"],
  "844E": ["1", "2"],
  "845A": ["1", "2", "2A", "4", "5"],
  "845E": ["1", "2"],
  "846": ["1", "2", "3", "4", "5", "6"],
  "852A": ["1", "2", "3", "4", "5", "6"],
  "853S": ["4", "5", "6", "7", "8", "9"],
  "858A": ["1", "2", "3", "4"],
  "858S": ["1", "2", "3"],
};

export const TIEU_KHU_IDS = Object.keys(TIEU_KHU);

export const COMMUNE_UNITS = [
  { id: "hai-lang", label: "Xã Hải Lăng" },
  { id: "nam-hai-lang", label: "Xã Nam Hải Lăng" },
  { id: "trieu-phong", label: "Xã Triệu Phong" },
  { id: "phuong-quang-tri", label: "Phường Quảng Trị" },
] as const;

export type CommuneId = (typeof COMMUNE_UNITS)[number]["id"];

export function khoanhOf(tieuKhu: string) {
  return TIEU_KHU[tieuKhu] ?? [];
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
