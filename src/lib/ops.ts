import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getSpecies } from "@/lib/catalog";
import { locationFromLegacy } from "@/lib/site";

export const PROJECT_KINDS = [
  { id: "trong", label: "Trồng rừng" },
  { id: "cham-soc", label: "Chăm sóc rừng" },
  { id: "bao-ve", label: "Bảo vệ rừng" },
] as const;

export const PROJECT_STATUS = [
  { id: "dang-lam", label: "Đang triển khai" },
  { id: "hoan-thanh", label: "Hoàn thành" },
  { id: "tam-dung", label: "Tạm dừng" },
] as const;

export const TREE_STATUS = [
  { id: "song", label: "Sống" },
  { id: "benh", label: "Bệnh" },
  { id: "chet", label: "Chết" },
  { id: "khai-thac", label: "Đã khai thác" },
] as const;

export const SURVEY_WAVES = ["1 tháng", "3 tháng", "6 tháng", "12 tháng", "24 tháng"] as const;

export const SURVIVAL_METHODS = [
  { id: "o-tieu-chuan", label: "Ô tiêu chuẩn" },
  { id: "bang", label: "Băng" },
] as const;

export type SurvivalMethod = (typeof SURVIVAL_METHODS)[number]["id"];

export type ProjectKind = (typeof PROJECT_KINDS)[number]["id"];
export type ProjectStatus = (typeof PROJECT_STATUS)[number]["id"];
export type TreeStatus = (typeof TREE_STATUS)[number]["id"];

export type Project = {
  id: string;
  name: string;
  location: string;
  kind: ProjectKind;
  status: ProjectStatus;
  areaHa: number;
  speciesSlug: string;
  year: number;
  density: number;
  notes: string;
};

export type StemStatus = "song" | "chet" | "dam";

export const STEM_STATUS: { id: StemStatus; label: string; tone: "ok" | "danger" | "info" }[] = [
  { id: "song", label: "Sống", tone: "ok" },
  { id: "chet", label: "Chết", tone: "danger" },
  { id: "dam", label: "Trồng dặm", tone: "info" },
];

export type CountedStem = {
  id: string;
  status: StemStatus;
  at: string;
};

export type SurvivalCheck = {
  id: string;
  projectId: string;
  plotId?: string;
  method: SurvivalMethod;
  speciesSlug: string;
  name: string;
  date: string;
  planted: number;
  alive: number;
  dead: number;
  replanted: number;
  stems: CountedStem[];
  widthM: number;
  lengthM: number;
  notes: string;
};

export type ManagedTree = {
  id: string;
  code: string;
  projectId: string;
  speciesSlug?: string;
  speciesName: string;
  location: string;
  dbhCm: number;
  heightM: number;
  plantedDate: string;
  status: TreeStatus;
  notes: string;
};

export type ProjectDraft = Omit<Project, "id">;
export type SurvivalDraft = Omit<SurvivalCheck, "id">;
export type ManagedTreeDraft = Omit<ManagedTree, "id">;

type OpsState = {
  projects: Project[];
  survivals: SurvivalCheck[];
  trees: ManagedTree[];
  addProject: (draft: ProjectDraft) => string;
  updateProject: (id: string, patch: Partial<ProjectDraft>) => void;
  removeProject: (id: string) => void;
  addSurvival: (draft: SurvivalDraft) => string;
  updateSurvival: (id: string, patch: Partial<SurvivalDraft>) => void;
  removeSurvival: (id: string) => void;
  addTree: (draft: ManagedTreeDraft) => string;
  updateTree: (id: string, patch: Partial<ManagedTreeDraft>) => void;
  removeTree: (id: string) => void;
  seedDemo: () => string;
};

function uid() {
  return crypto.randomUUID();
}

export function kindLabel(id: string) {
  return PROJECT_KINDS.find((k) => k.id === id)?.label ?? id;
}

export function statusLabel(id: string) {
  return PROJECT_STATUS.find((s) => s.id === id)?.label ?? id;
}

export function treeStatusLabel(id: string) {
  return TREE_STATUS.find((s) => s.id === id)?.label ?? id;
}

export function stemStatusLabel(id: string) {
  return STEM_STATUS.find((s) => s.id === id)?.label ?? id;
}

export function survivalMethodLabel(id: string) {
  return SURVIVAL_METHODS.find((m) => m.id === id)?.label ?? id;
}

export function survivalRate(planted: number, alive: number) {
  if (planted <= 0) return 0;
  return (alive / planted) * 100;
}

export function expectedTrees(project: Project) {
  return Math.round(project.areaHa * project.density);
}

export const useOps = create<OpsState>()(
  persist(
    (set, get) => ({
      projects: [],
      survivals: [],
      trees: [],
      addProject: (draft) => {
        const id = uid();
        set({ projects: [{ ...draft, id }, ...get().projects] });
        return id;
      },
      updateProject: (id, patch) => {
        set({
          projects: get().projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        });
      },
      removeProject: (id) => {
        set({
          projects: get().projects.filter((p) => p.id !== id),
          survivals: get().survivals.filter((s) => s.projectId !== id),
          trees: get().trees.filter((t) => t.projectId !== id),
        });
      },
      addSurvival: (draft) => {
        const id = uid();
        set({ survivals: [{ ...draft, id }, ...get().survivals] });
        return id;
      },
      updateSurvival: (id, patch) => {
        set({
          survivals: get().survivals.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        });
      },
      removeSurvival: (id) => {
        set({ survivals: get().survivals.filter((s) => s.id !== id) });
      },
      addTree: (draft) => {
        const id = uid();
        set({ trees: [{ ...draft, id }, ...get().trees] });
        return id;
      },
      updateTree: (id, patch) => {
        set({
          trees: get().trees.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        });
      },
      removeTree: (id) => {
        set({ trees: get().trees.filter((t) => t.id !== id) });
      },
      seedDemo: () => {
        const existing = get().projects.find((p) => p.name === "Keo lai Ea H'leo 2024");
        if (existing) return existing.id;
        const keo = getSpecies("keo-lai");
        const duoc = getSpecies("duoc-doi");
        const p1 = uid();
        const p2 = uid();
        set({
          projects: [
            {
              id: p1,
              name: "Keo lai Ea H'leo 2024",
              location: "Xã Hải Lăng · Xã Nam Hải Lăng",
              kind: "trong",
              status: "dang-lam",
              areaHa: 12.5,
              speciesSlug: "keo-lai",
              year: 2024,
              density: 1667,
              notes: "Cự ly 3 × 2 m. Đất bazan tầng trung bình.",
            },
            {
              id: p2,
              name: "Đước Cần Giờ 2023",
              location: "Xã Triệu Phong · Phường Quảng Trị",
              kind: "trong",
              status: "hoan-thanh",
              areaHa: 8,
              speciesSlug: "duoc-doi",
              year: 2023,
              density: 10000,
              notes: "Phục hồi đai rừng ngập mặn. Cự ly 1 × 1 m.",
            },
            ...get().projects,
          ],
          survivals: [
            {
              id: uid(),
              projectId: p1,
              speciesSlug: "keo-lai",
              name: "Keo lai",
              date: "2025-06-18",
              planted: 200,
              alive: 168,
              dead: 32,
              replanted: 32,
              stems: [],
              method: "o-tieu-chuan",
              widthM: 0,
              lengthM: 0,
              notes: "Hạn cuối mùa khô. Trồng dặm 32 hốc.",
            },
            {
              id: uid(),
              projectId: p1,
              speciesSlug: "keo-lai",
              name: "Keo lai",
              date: "2024-09-12",
              planted: 200,
              alive: 186,
              dead: 14,
              replanted: 0,
              stems: [],
              method: "o-tieu-chuan",
              widthM: 0,
              lengthM: 0,
              notes: "Chết chủ yếu ở sườn dốc.",
            },
            {
              id: uid(),
              projectId: p2,
              speciesSlug: "duoc-doi",
              name: "Đước đôi",
              date: "2024-08-02",
              planted: 250,
              alive: 231,
              dead: 19,
              replanted: 0,
              stems: [],
              method: "bang",
              widthM: 10,
              lengthM: 50,
              notes: "Sóng lớn tháng 11 làm đổ 19 cây.",
            },
            ...get().survivals,
          ],
          trees: [
            {
              id: uid(),
              code: "KL-01",
              projectId: p1,
              speciesSlug: "keo-lai",
              speciesName: keo?.name ?? "Keo lai",
              location: "Tiểu khu 846 · Khoảnh 2 · Lô 1",
              dbhCm: 8.4,
              heightM: 7.2,
              plantedDate: "2024-06-10",
              status: "song",
              notes: "Cây mẫu đo tăng trưởng",
            },
            {
              id: uid(),
              code: "KL-02",
              projectId: p1,
              speciesSlug: "keo-lai",
              speciesName: keo?.name ?? "Keo lai",
              location: "Tiểu khu 846 · Khoảnh 2 · Lô 2",
              dbhCm: 6.1,
              heightM: 5.8,
              plantedDate: "2024-06-10",
              status: "benh",
              notes: "Đốm lá",
            },
            {
              id: uid(),
              code: "DC-01",
              projectId: p2,
              speciesSlug: "duoc-doi",
              speciesName: duoc?.name ?? "Đước đôi",
              location: "Tiểu khu 834 · Khoảnh 4 · Lô 4",
              dbhCm: 4.2,
              heightM: 2.4,
              plantedDate: "2023-07-20",
              status: "song",
              notes: "",
            },
            ...get().trees,
          ],
        });
        return p1;
      },
    }),
    {
      name: "rung-ops-v1",
      version: 8,
      skipHydration: true,
      migrate: (persisted) => {
        const state = persisted as OpsState;
        return {
          ...state,
          projects: (state.projects ?? []).map((p) => ({
            ...p,
            location: locationFromLegacy(p),
          })),
          survivals: (state.survivals ?? []).map((s) => ({
            ...s,
            plotId: s.plotId ?? "",
            method: s.method || "o-tieu-chuan",
            speciesSlug: s.speciesSlug ?? "",
            dead: s.dead ?? Math.max(0, (s.planted ?? 0) - (s.alive ?? 0)),
            replanted: s.replanted ?? 0,
            stems: s.stems ?? [],
            widthM: s.widthM ?? 0,
            lengthM: s.lengthM ?? 0,
          })),
          trees: (state.trees ?? []).map((t) => ({
            ...t,
            location: locationFromLegacy(t),
          })),
        };
      },
    },
  ),
);

export function useOpsHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useOps.persist.onFinishHydration(() => setHydrated(true));
    if (useOps.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}
