import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SPECIES, foldVi, getSpecies, type Species } from "@/lib/catalog";

export type CustomSpecies = {
  slug: string;
  name: string;
  latin: string;
  family: string;
  notes: string;
  treeImage: string;
  leafImage: string;
};

export type CustomSpeciesDraft = Omit<CustomSpecies, "slug" | "treeImage" | "leafImage"> & {
  treeImage?: string;
  leafImage?: string;
};

type State = {
  items: CustomSpecies[];
  renames: Record<string, string>;
  add: (draft: CustomSpeciesDraft) => string;
  remove: (slug: string) => void;
  rename: (slug: string, name: string) => void;
};

export function toSpecies(c: CustomSpecies): Species {
  return {
    slug: c.slug,
    name: c.name,
    latin: c.latin.trim() || c.name,
    family: c.family,
    image: c.treeImage || "",
    tags: [],
    status: "Loài tự thêm",
    woodDensity: 0.55,
    formFactor: 0.45,
    allometric: "chave",
    habitat: "",
    uses: "",
    rotation: "",
    notes: c.notes,
    silviculture: "",
  };
}

export function slugifySpecies(name: string) {
  const base = foldVi(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "loai";
  return `custom-${base}`;
}

export function isCustomSpecies(slug: string) {
  return slug.startsWith("custom-");
}

function withRename(s: Species, renames: Record<string, string> | undefined) {
  const name = renames?.[s.slug]?.trim();
  return name ? { ...s, name } : s;
}

export const useCustomSpecies = create<State>()(
  persist(
    (set, get) => ({
      items: [],
      renames: {},
      add: (draft) => {
        const name = draft.name.trim();
        if (!name) return "";
        const taken = new Set([
          ...get().items.map((i) => i.slug),
          ...SPECIES.map((s) => s.slug),
        ]);
        let slug = slugifySpecies(name);
        if (taken.has(slug)) {
          let n = 2;
          while (taken.has(`${slug}-${n}`)) n += 1;
          slug = `${slug}-${n}`;
        }
        set({
          items: [
            {
              slug,
              name,
              latin: draft.latin.trim(),
              family: draft.family.trim(),
              notes: draft.notes.trim(),
              treeImage: draft.treeImage ?? "",
              leafImage: draft.leafImage ?? "",
            },
            ...get().items,
          ],
        });
        return slug;
      },
      remove: (slug) => {
        const { [slug]: _, ...renames } = get().renames ?? {};
        set({ items: get().items.filter((i) => i.slug !== slug), renames });
      },
      rename: (slug, name) => {
        const next = name.trim();
        if (!next) return;
        if (isCustomSpecies(slug)) {
          set({
            items: get().items.map((i) => (i.slug === slug ? { ...i, name: next } : i)),
          });
          return;
        }
        set({ renames: { ...(get().renames ?? {}), [slug]: next } });
      },
    }),
    {
      name: "rung-species-v1",
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return {
          ...current,
          ...p,
          items: (p.items ?? current.items).map((i) => ({
            ...i,
            treeImage: i.treeImage ?? "",
            leafImage: i.leafImage ?? "",
          })),
          renames: p.renames ?? current.renames,
        };
      },
    },
  ),
);

export function useCatalog() {
  const items = useCustomSpecies((s) => s.items);
  const renames = useCustomSpecies((s) => s.renames);
  return useMemo(
    () => [...items.map(toSpecies), ...SPECIES].map((s) => withRename(s, renames)),
    [items, renames],
  );
}

export function allSpecies(): Species[] {
  const { items, renames } = useCustomSpecies.getState();
  return [...items.map(toSpecies), ...SPECIES].map((s) => withRename(s, renames));
}

export function findSpecies(slug: string) {
  const { items, renames } = useCustomSpecies.getState();
  const custom = items.find((c) => c.slug === slug);
  const base = custom ? toSpecies(custom) : getSpecies(slug);
  if (!base) return;
  return withRename(base, renames);
}
