/** π dùng khi tính thể tích gỗ theo quy định (không dùng Math.PI). */
export const PI_VOL = 3.14;

export function roundVolumeM3(v: number) {
  return Math.round(v * 1000) / 1000;
}

/** Chu vi C1.3 (cm) từ đường kính D1.3 (cm). */
export function circCmFromDbhCm(dbhCm: number) {
  return Math.round(dbhCm * PI_VOL * 10) / 10;
}

/** g = C² / 4π (m²). circCm = chu vi tại 1,3 m, cm. */
export function treeBasalAreaM2(circCm: number): number {
  const cM = circCm / 100;
  return (cM * cM) / (4 * PI_VOL);
}

/** V = (C² / 4π) × Hvn × f, lấy 3 chữ số thập phân. */
export function treeVolumeM3(circCm: number, heightM: number, formFactor: number): number {
  return roundVolumeM3(treeBasalAreaM2(circCm) * heightM * formFactor);
}

export const VOLUME_FORMULA =
  "V = (C₁.₃² / 4π) × Hvn × f. C₁.₃: chu vi tại 1,3 m (m). π = 3,14. Hvn: chiều dài toàn cây từ gốc đến ngọn (m). f: 0,5 cây trồng hoặc 0,45 cây tự nhiên. V lấy 3 chữ số thập phân. Sai số tương đối mỗi lần đo ±10%.";

/** Thể tích gỗ khúc/gỗ tròn: V = π · ((d1+d2)/4)² · L. d cm, L m. */
export function logVolumeM3(d1Cm: number, d2Cm: number, lengthM: number): number {
  const d1 = d1Cm / 100;
  const d2 = d2Cm / 100;
  return roundVolumeM3(PI_VOL * ((d1 + d2) / 4) ** 2 * lengthM);
}

export const LOG_FORMULA =
  "V = π · ((d1 + d2) / 4)² · L. d1, d2: đường kính hai đầu lóng gỗ (m). L: chiều dài khúc gỗ (m). π = 3,14.";

export type PlotShape = "circle" | "square" | "rect";

export function plotAreaM2(input: {
  shape: PlotShape;
  radiusM?: number;
  widthM?: number;
  lengthM?: number;
}): number {
  if (input.shape === "circle") {
    const r = input.radiusM ?? 0;
    return Math.PI * r * r;
  }
  if (input.shape === "square") {
    const s = input.widthM ?? 0;
    return s * s;
  }
  return (input.widthM ?? 0) * (input.lengthM ?? 0);
}

export function perHectare(value: number, areaM2: number): number {
  if (areaM2 <= 0) return 0;
  return value * (10000 / areaM2);
}

export function plotShapeLabel(input: {
  shape: PlotShape;
  radiusM?: number;
  widthM?: number;
  lengthM?: number;
}) {
  if (input.shape === "square" && (input.widthM ?? 0) === 10) return "OTC 100 m²";
  if (input.shape === "rect") {
    const w = input.widthM ?? 0;
    const l = input.lengthM ?? 0;
    return w && l ? `Theo băng · ${w} × ${l} m` : "Theo băng";
  }
  const area = Math.round(plotAreaM2(input));
  if (area) return `OTC ${area} m²`;
  return "Ô";
}

export const PLOT_PRESETS = [
  { id: "a100", label: "100 m²", shape: "square" as const, radiusM: 0, widthM: 10, lengthM: 10 },
  { id: "a500", label: "500 m²", shape: "circle" as const, radiusM: 12.62, widthM: 0, lengthM: 0 },
  { id: "bang", label: "Theo băng", shape: "rect" as const, radiusM: 0, widthM: 10, lengthM: 50 },
] as const;

export const STAND_STATUS = [
  "Rừng tự nhiên",
  "Rừng trồng",
  "Diện tích chưa có rừng",
] as const;

/** f hình số thân: rừng trồng 0,5; rừng tự nhiên 0,45. */
export const STEM_FORMS = [
  { f: 0.5, label: "f = 0,5 (Cây trồng)" },
  { f: 0.45, label: "f = 0,45 (Cây tự nhiên)" },
] as const;

export function standFormFactor(stand?: string) {
  return stand === "Rừng trồng" ? 0.5 : 0.45;
}

export function stemFormLabel(f: number) {
  return STEM_FORMS.find((x) => x.f === f)?.label ?? `f = ${f}`;
}

export const FOREST_KINDS = [
  { id: "dac-dung", label: "Rừng đặc dụng" },
  { id: "phong-ho", label: "Rừng phòng hộ" },
  { id: "san-xuat", label: "Rừng sản xuất" },
] as const;

export function forestKindLabel(id: string) {
  return FOREST_KINDS.find((k) => k.id === id)?.label ?? id;
}

export function quadraticMeanDbh(dbhs: number[]): number {
  if (!dbhs.length) return 0;
  const meanSq = dbhs.reduce((sum, d) => sum + d * d, 0) / dbhs.length;
  return Math.sqrt(meanSq);
}

/** Mật độ trồng (cây/ha) từ cự ly hàng × cây (m). */
export function plantingDensity(rowM: number, treeM: number): number {
  if (rowM <= 0 || treeM <= 0) return 0;
  return 10000 / (rowM * treeM);
}

/**
 * Sinh khối trên mặt đất (kg).
 * Chave et al. 2014 (rừng mưa nhiệt đới): AGB = 0.0673 × (ρ D² H)^0.976
 * Komiyama et al. 2005 (đước): AGB = 0.251 × ρ × D^2.46
 */
export function abovegroundBiomassKg(input: {
  dbhCm: number;
  heightM: number;
  woodDensity: number;
  allometric: "chave" | "komiyama";
}): number {
  const { dbhCm, heightM, woodDensity, allometric } = input;
  if (dbhCm <= 0) return 0;
  if (allometric === "komiyama") {
    return 0.251 * woodDensity * dbhCm ** 2.46;
  }
  const inner = woodDensity * dbhCm * dbhCm * heightM;
  if (inner <= 0) return 0;
  return 0.0673 * inner ** 0.976;
}

export function carbonFromAgbKg(agbKg: number): { tC: number; tCO2e: number } {
  const tC = (agbKg / 1000) * 0.47;
  return { tC, tCO2e: tC * (44 / 12) };
}

export const COMMON_SPACINGS = [
  { row: 2, tree: 2, label: "2 × 2 m" },
  { row: 3, tree: 2, label: "3 × 2 m" },
  { row: 3, tree: 3, label: "3 × 3 m" },
  { row: 4, tree: 2, label: "4 × 2 m" },
  { row: 4, tree: 3, label: "4 × 3 m" },
] as const;
