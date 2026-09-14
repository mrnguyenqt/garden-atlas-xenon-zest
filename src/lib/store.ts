import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getSpecies } from "@/lib/catalog";
import { formatLocationParts, locationFromLegacy, parseLocationParts, plotCodeKey, sameLot } from "@/lib/site";
import { circCmFromDbhCm, perHectare, PI_VOL, plotAreaM2, quadraticMeanDbh, standFormFactor, treeBasalAreaM2, treeVolumeM3, type PlotShape } from "@/lib/forestry";
import { deletePhotoBlob } from "@/lib/photo-db";

export type TreeQuality = "A" | "B" | "C" | "D";

export const TREE_QUALITIES: { id: TreeQuality; label: string }[] = [
  { id: "A", label: "A — Thân thẳng, đẹp" },
  { id: "B", label: "B — Khuyết tật nhẹ" },
  { id: "C", label: "C — Cong queo, sâu bệnh hoặc cụt ngọn, rỗng ruột" },
  { id: "D", label: "D — Cây chết" },
];

export function qualityLabel(q: TreeQuality | string) {
  return TREE_QUALITIES.find((x) => x.id === q)?.label ?? q;
}

export type TreeSource = "chuan" | "nhanh";

export type TreeRecord = {
  id: string;
  speciesSlug?: string;
  speciesName: string;
  circCm: number;
  heightM: number;
  formFactor: number;
  source?: TreeSource;
  quality: TreeQuality;
  notes: string;
};

export type PlotPhoto = {
  id: string;
  src: string;
  takenAt: string;
};

export type Plot = {
  id: string;
  name: string;
  projectId: string;
  location: string;
  forestSlug: string;
  shape: PlotShape;
  radiusM: number;
  widthM: number;
  lengthM: number;
  coordX: number;
  coordY: number;
  gpsLat: number;
  gpsLng: number;
  gpsAccuracyM: number;
  gpsAt: string;
  date: string;
  notes: string;
  surveyor: string;
  stand: string;
  trees: TreeRecord[];
  photos: PlotPhoto[];
};

type PlotState = {
  plots: Plot[];
  addPlot: (plot: Omit<Plot, "id" | "trees" | "photos">) => string;
  updatePlot: (id: string, patch: Partial<Omit<Plot, "id" | "trees" | "photos">>) => void;
  removePlot: (id: string) => void;
  addTree: (plotId: string, tree: Omit<TreeRecord, "id">) => void;
  removeTree: (plotId: string, treeId: string) => void;
  addPhoto: (plotId: string, photo: Omit<PlotPhoto, "id"> & { id?: string }) => string;
  removePhoto: (plotId: string, photoId: string) => void;
  seedDemo: () => string;
};

function uid() {
  return crypto.randomUUID();
}

export function plotArea(plot: Plot): number {
  return plotAreaM2(plot);
}

export function treeFormFactor(tree?: { formFactor?: number }, stand?: string) {
  if (tree?.formFactor === 0.5 || tree?.formFactor === 0.45) return tree.formFactor;
  return standFormFactor(stand);
}

export function summarizePlot(plot: Plot) {
  const area = plotArea(plot);
  const live = plot.trees.filter((t) => t.quality !== "D");
  const g = live.reduce((s, t) => s + treeBasalAreaM2(t.circCm), 0);
  const v = live.reduce(
    (s, t) => s + treeVolumeM3(t.circCm, t.heightM, treeFormFactor(t, plot.stand)),
    0,
  );
  const dbhs = live.map((t) => t.circCm / PI_VOL);
  const heights = live.map((t) => t.heightM);
  return {
    areaM2: area,
    n: live.length,
    nTotal: plot.trees.length,
    nHa: perHectare(live.length, area),
    gM2: g,
    gHa: perHectare(g, area),
    vM3: v,
    mHa: perHectare(v, area),
    dg: quadraticMeanDbh(dbhs),
    hMean: heights.length ? heights.reduce((a, b) => a + b, 0) / heights.length : 0,
  };
}

export function lotKey(plot: Plot) {
  const parts = parseLocationParts(plot.location);
  if (parts.tieuKhu || parts.khoanh || parts.lo) {
    return `${parts.tieuKhu}|${parts.khoanh}|${parts.lo}`;
  }
  return plot.location.trim() || "chua-ghi";
}

export function lotTitle(plot: Plot) {
  const formatted = formatLocationParts(parseLocationParts(plot.location));
  return formatted || plot.location.trim() || "Chưa ghi lô";
}

export function findDuplicatePlot(
  plots: Plot[],
  name: string,
  location: string,
  projectId: string,
  exceptId?: string,
) {
  const code = plotCodeKey(name);
  if (!code) return undefined;
  const project = projectId.trim();
  return plots.find(
    (p) =>
      p.id !== exceptId &&
      plotCodeKey(p.name) === code &&
      sameLot(p.location, location) &&
      (p.projectId ?? "").trim() === project,
  );
}

export function groupPlotsByLot(plots: Plot[]) {
  const map = new Map<string, { key: string; title: string; plots: Plot[] }>();
  for (const p of plots) {
    const key = lotKey(p);
    const existing = map.get(key);
    if (existing) existing.plots.push(p);
    else map.set(key, { key, title: lotTitle(p), plots: [p] });
  }
  return [...map.values()];
}

export function seedProjectPlots(projectId: string) {
  const keo = getSpecies("keo-lai");
  const now = new Date().toISOString();
  const base = {
    projectId,
    forestSlug: "san-xuat",
    shape: "circle" as const,
    radiusM: 12.62,
    widthM: 0,
    lengthM: 0,
    coordX: 0,
    coordY: 0,
    gpsLat: 0,
    gpsLng: 0,
    gpsAccuracyM: 0,
    gpsAt: "",
    date: now,
    surveyor: "Tổ điều tra",
    stand: "Rừng trồng",
    notes: "",
    photos: [] as PlotPhoto[],
  };
  function tree(dbhCm: number, heightM: number, quality: TreeQuality = "A"): TreeRecord {
    return {
      id: uid(),
      speciesSlug: "keo-lai",
      speciesName: keo?.name ?? "Keo lai",
      circCm: circCmFromDbhCm(dbhCm),
      heightM,
      formFactor: 0.5,
      quality,
      notes: "",
    };
  }
  usePlots.setState((s) => ({
    plots: [
      {
        ...base,
        id: uid(),
        name: "OTC-01",
        location: "Tiểu khu 846 · Khoảnh 2 · Lô 1",
        trees: [tree(8.4, 7.2), tree(7.1, 6.4), tree(6.8, 5.9, "B")],
      },
      {
        ...base,
        id: uid(),
        name: "OTC-02",
        location: "Tiểu khu 846 · Khoảnh 2 · Lô 1",
        trees: [tree(9.2, 7.8), tree(5.4, 4.8, "C")],
      },
      {
        ...base,
        id: uid(),
        name: "OTC-03",
        location: "Tiểu khu 846 · Khoảnh 2 · Lô 2",
        trees: [tree(6.1, 5.8, "B"), tree(7.6, 6.9)],
      },
      ...s.plots,
    ],
  }));
}

export const usePlots = create<PlotState>()(
  persist(
    (set, get) => ({
      plots: [],
      addPlot: (plot) => {
        if (findDuplicatePlot(get().plots, plot.name, plot.location, plot.projectId ?? "")) return "";
        const id = uid();
        const next = [{ ...plot, id, trees: [], photos: [] }, ...get().plots];
        set({ plots: next });
        return id;
      },
      updatePlot: (id, patch) => {
        const current = get().plots.find((p) => p.id === id);
        if (!current) return;
        const nextName = patch.name ?? current.name;
        const nextLoc = patch.location ?? current.location;
        const nextProject = patch.projectId ?? current.projectId ?? "";
        if (findDuplicatePlot(get().plots, nextName, nextLoc, nextProject, id)) return;
        set({
          plots: get().plots.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        });
      },
      removePlot: (id) => {
        const plot = get().plots.find((p) => p.id === id);
        for (const ph of plot?.photos ?? []) void deletePhotoBlob(ph.id);
        set({ plots: get().plots.filter((p) => p.id !== id) });
      },
      addTree: (plotId, tree) => {
        set({
          plots: get().plots.map((p) =>
            p.id === plotId ? { ...p, trees: [...p.trees, { ...tree, id: uid() }] } : p,
          ),
        });
      },
      removeTree: (plotId, treeId) => {
        set({
          plots: get().plots.map((p) =>
            p.id === plotId ? { ...p, trees: p.trees.filter((t) => t.id !== treeId) } : p,
          ),
        });
      },
      addPhoto: (plotId, photo) => {
        const id = photo.id || uid();
        set({
          plots: get().plots.map((p) =>
            p.id === plotId ? { ...p, photos: [{ ...photo, id }, ...(p.photos ?? [])] } : p,
          ),
        });
        return id;
      },
      removePhoto: (plotId, photoId) => {
        void deletePhotoBlob(photoId);
        set({
          plots: get().plots.map((p) =>
            p.id === plotId ? { ...p, photos: (p.photos ?? []).filter((x) => x.id !== photoId) } : p,
          ),
        });
      },
      seedDemo: () => {
        const existing = get().plots.find((p) => p.name === "Ô minh họa Yok Đôn");
        if (existing) return existing.id;
        const id = uid();
        const dau = getSpecies("dau-rai");
        const sao = getSpecies("sao-den");
        const giang = getSpecies("giang-huong");
        const trees: TreeRecord[] = [
          { id: uid(), speciesSlug: "dau-rai", speciesName: dau?.name ?? "Dầu rái", circCm: circCmFromDbhCm(42.6), heightM: 28, formFactor: 0.45, quality: "A", notes: "" },
          { id: uid(), speciesSlug: "dau-rai", speciesName: dau?.name ?? "Dầu rái", circCm: circCmFromDbhCm(36.2), heightM: 24, formFactor: 0.45, quality: "A", notes: "" },
          { id: uid(), speciesSlug: "sao-den", speciesName: sao?.name ?? "Sao đen", circCm: circCmFromDbhCm(31.4), heightM: 22, formFactor: 0.45, quality: "B", notes: "" },
          { id: uid(), speciesSlug: "sao-den", speciesName: sao?.name ?? "Sao đen", circCm: circCmFromDbhCm(24.8), heightM: 18, formFactor: 0.45, quality: "B", notes: "" },
          { id: uid(), speciesSlug: "giang-huong", speciesName: giang?.name ?? "Giáng hương", circCm: circCmFromDbhCm(28.1), heightM: 16, formFactor: 0.45, quality: "A", notes: "Tái sinh" },
          { id: uid(), speciesSlug: "dau-rai", speciesName: dau?.name ?? "Dầu rái", circCm: circCmFromDbhCm(18.5), heightM: 14, formFactor: 0.45, quality: "C", notes: "" },
          { id: uid(), speciesSlug: "sao-den", speciesName: sao?.name ?? "Sao đen", circCm: circCmFromDbhCm(47.0), heightM: 32, formFactor: 0.45, quality: "A", notes: "Cây mẹ" },
          { id: uid(), speciesSlug: "dau-rai", speciesName: dau?.name ?? "Dầu rái", circCm: circCmFromDbhCm(22.3), heightM: 17, formFactor: 0.45, quality: "B", notes: "" },
        ];
        set({
          plots: [
            {
              id,
              name: "Ô minh họa Yok Đôn",
              projectId: "",
              location: "Tiểu khu 846 · Khoảnh 2 · Lô 3",
              forestSlug: "dac-dung",
              shape: "circle",
              radiusM: 12.62,
              widthM: 0,
              lengthM: 0,
              coordX: 0,
              coordY: 0,
              gpsLat: 0,
              gpsLng: 0,
              gpsAccuracyM: 0,
              gpsAt: "",
              date: new Date().toISOString(),
              notes: "Ô tròn 500 m² — số liệu minh họa rừng khộp nửa rụng lá.",
              surveyor: "Tổ điều tra",
              stand: "Rừng tự nhiên",
              trees,
              photos: [],
            },
            ...get().plots,
          ],
        });
        return id;
      },
    }),
    {
      name: "rung-plots-v1",
      version: 16,
      skipHydration: true,
      migrate: (persisted) => {
        const state = persisted as PlotState;
        const kinds = new Set(["dac-dung", "phong-ho", "san-xuat"]);
        const stands = new Set(["Rừng tự nhiên", "Rừng trồng", "Diện tích chưa có rừng"]);
        return {
          ...state,
          plots: (state.plots ?? []).map((p) => {
            let stand = p.stand ?? "";
            if (!stands.has(stand)) {
              if (stand === "Đất trống") stand = "Diện tích chưa có rừng";
              else if (stand === "Rừng trồng") stand = "Rừng trồng";
              else stand = stand ? "Rừng tự nhiên" : "Rừng trồng";
            }
            return {
              ...p,
              projectId: p.projectId ?? "",
              location: locationFromLegacy(p),
              surveyor: p.surveyor ?? "",
              stand,
              forestSlug: kinds.has(p.forestSlug) ? p.forestSlug : "san-xuat",
              coordX: p.coordX ?? 0,
              coordY: p.coordY ?? 0,
              gpsLat: p.gpsLat ?? 0,
              gpsLng: p.gpsLng ?? 0,
              gpsAccuracyM: p.gpsAccuracyM ?? 0,
              gpsAt: p.gpsAt ?? "",
              photos: p.photos ?? [],
              trees: (p.trees ?? []).map((t) => {
                const raw = t as TreeRecord & { dbhCm?: number };
                const circCm =
                  raw.circCm > 0 ? raw.circCm : circCmFromDbhCm(raw.dbhCm ?? 0);
                return {
                  ...t,
                  circCm,
                  quality: ((t.quality as string) === "dead" ? "D" : t.quality) as TreeQuality,
                  formFactor: t.formFactor === 0.5 || t.formFactor === 0.45 ? t.formFactor : standFormFactor(stand),
                  source: t.source === "nhanh" ? "nhanh" : "chuan",
                };
              }),
            };
          }),
        };
      },
    },
  ),
);

export function usePlotsHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = usePlots.persist.onFinishHydration(() => setHydrated(true));
    if (usePlots.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}

