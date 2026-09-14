import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nf1, nf2 } from "@/lib/utils";

export type TrackPoint = {
  lat: number;
  lng: number;
  at: number;
  ele?: number;
};

export type SavedTrack = {
  id: string;
  name: string;
  createdAt: string;
  lengthM: number;
  durationMs: number;
  points: number;
  segments: TrackPoint[][];
};

export type TrackDraft = {
  segs: TrackPoint[][];
  sessionStart: number;
  pausedTotal: number;
  pauseAt: number;
  phase: "run" | "pause";
};

type TrackState = {
  tracks: SavedTrack[];
  draft: TrackDraft | null;
  addTrack: (draft: Omit<SavedTrack, "id">) => string;
  removeTrack: (id: string) => void;
  saveDraft: (draft: TrackDraft) => void;
  clearDraft: () => void;
};

function uid() {
  return crypto.randomUUID();
}

export function formatTrackLen(m: number) {
  if (m >= 1000) return `${nf2.format(m / 1000)} km`;
  return `${nf1.format(m)} m`;
}

export function formatTrackElapsed(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function trackTitle(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Đường đi";
  const date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `Đường đi ${date} ${time}`;
}

export function trackSegCount(t: SavedTrack) {
  const n = t.segments.filter((s) => s.length >= 2).length;
  return n || t.segments.filter((s) => s.length > 0).length;
}

export const useTracks = create<TrackState>()(
  persist(
    (set, get) => ({
      tracks: [],
      draft: null,
      addTrack: (draft) => {
        const id = uid();
        set({ tracks: [{ ...draft, id }, ...get().tracks] });
        return id;
      },
      removeTrack: (id) => {
        set({ tracks: get().tracks.filter((t) => t.id !== id) });
      },
      saveDraft: (draft) => set({ draft }),
      clearDraft: () => set({ draft: null }),
    }),
    { name: "rung-tracks-v1", skipHydration: true },
  ),
);

export function useTracksHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useTracks.persist.onFinishHydration(() => setHydrated(true));
    if (useTracks.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);
  return hydrated;
}
