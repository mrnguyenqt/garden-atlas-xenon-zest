import { formatDate } from "@/lib/utils";
import type { Plot } from "@/lib/store";

export type LibraryPhoto = {
  id: string;
  src: string;
  takenAt: string;
  plotId: string;
  plotName: string;
  location: string;
  caption: string;
};

export function dayKey(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return (iso || "").slice(0, 10) || "khac";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dayHeading(key: string) {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  const yesterdayKey = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
  if (key === todayKey) return "Hôm nay";
  if (key === yesterdayKey) return "Hôm qua";
  return formatDate(key);
}

export function collectLibraryPhotos(plots: Plot[]): LibraryPhoto[] {
  const items: LibraryPhoto[] = [];
  for (const plot of plots) {
    for (const photo of plot.photos ?? []) {
      items.push({
        id: photo.id,
        src: photo.src,
        takenAt: photo.takenAt,
        plotId: plot.id,
        plotName: plot.name,
        location: plot.location,
        caption: [plot.name, plot.location].filter(Boolean).join(" · "),
      });
    }
  }
  items.sort((a, b) => (a.takenAt < b.takenAt ? 1 : a.takenAt > b.takenAt ? -1 : 0));
  return items;
}

export function groupPhotosByDay(photos: LibraryPhoto[]) {
  const groups: { key: string; label: string; items: LibraryPhoto[] }[] = [];
  const map = new Map<string, LibraryPhoto[]>();
  for (const photo of photos) {
    const key = dayKey(photo.takenAt);
    const list = map.get(key);
    if (list) list.push(photo);
    else map.set(key, [photo]);
  }
  const keys = [...map.keys()].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  for (const key of keys) {
    groups.push({ key, label: dayHeading(key), items: map.get(key) ?? [] });
  }
  return groups;
}
