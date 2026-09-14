import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Route as RouteIcon, Trash2 } from "lucide-react";
import { PhotoGallery } from "@/components/photo-gallery";
import { StoredImg } from "@/components/stored-img";
import { APP_NAME } from "@/lib/app-version";
import { csvStamp, saveFileAs } from "@/lib/csv";
import { toKml } from "@/lib/gps";
import { collectLibraryPhotos, groupPhotosByDay } from "@/lib/photo-library";
import { usePlots } from "@/lib/store";
import {
  formatTrackElapsed,
  formatTrackLen,
  trackSegCount,
  trackTitle,
  useTracks,
  useTracksHydrated,
  type SavedTrack,
} from "@/lib/tracks";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/thu-vien")({ component: LibraryPage });

const TABS = [
  { id: "anh", label: "Ảnh" },
  { id: "track", label: "Tracklog" },
] as const;

function LibraryPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("anh");
  const plots = usePlots((s) => s.plots);
  const photos = useMemo(() => collectLibraryPhotos(plots), [plots]);
  const groups = useMemo(() => groupPhotosByDay(photos), [photos]);
  const [index, setIndex] = useState<number | null>(null);
  const tracks = useTracks((s) => s.tracks);
  const hydrated = useTracksHydrated();

  return (
    <div className="mx-auto max-w-content px-5 pt-3 pb-8 md:px-10 md:pt-8 md:pb-12">
      <h1 className="font-display text-center text-4xl italic">Thư viện</h1>
      <div className="mx-auto mt-6 grid max-w-prose grid-cols-2 gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "h-11 rounded-full px-3 text-sm font-medium",
              tab === t.id ? "bg-primary text-primary-fg" : "bg-bg-subtle text-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "anh" ? (
        photos.length === 0 ? (
          <p className="mt-16 text-center text-muted">Chưa có ảnh.</p>
        ) : (
          <div className="mt-8 flex flex-col gap-8">
            {groups.map((group) => (
              <section key={group.key}>
                <h2 className="font-medium">
                  {group.label}
                  <span className="ml-2 text-sm font-normal text-muted tabular-nums">{group.items.length} ảnh</span>
                </h2>
                <ul className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-4">
                  {group.items.map((ph) => {
                    const i = photos.findIndex((x) => x.id === ph.id);
                    return (
                      <li key={ph.id}>
                        <button
                          type="button"
                          className="block w-full overflow-hidden rounded-lg bg-bg-elevated shadow-(--shadow-border)"
                          onClick={() => setIndex(i)}
                        >
                          <StoredImg src={ph.src} className="aspect-square w-full object-cover" />
                          <span className="block truncate px-2 py-1.5 text-left text-[11px] text-muted">{ph.caption}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )
      ) : !hydrated ? (
        <p className="mt-16 text-center text-muted">Đang tải tracklog…</p>
      ) : tracks.length === 0 ? (
        <p className="mt-16 text-center text-muted">Chưa có tracklog. Ghi trong mục Tracklog rồi Kết thúc để lưu.</p>
      ) : (
        <TrackList tracks={tracks} />
      )}
      {tab === "anh" && index !== null && photos[index] ? (
        <PhotoGallery photos={photos} index={index} onIndex={setIndex} onClose={() => setIndex(null)} />
      ) : null}
    </div>
  );
}

function TrackList({ tracks }: { tracks: SavedTrack[] }) {
  const removeTrack = useTracks((s) => s.removeTrack);
  const [note, setNote] = useState("");

  async function exportOne(t: SavedTrack) {
    const stamp = csvStamp();
    const xml = toKml({
      name: t.name,
      creator: APP_NAME,
      desc: `${formatTrackLen(t.lengthM)} · ${formatTrackElapsed(t.durationMs)} · ${t.points} điểm · ${trackSegCount(t)} đoạn`,
      segments: t.segments,
    });
    try {
      const last = await saveFileAs(
        new File([xml], `${t.name.replace(/\s+/g, "-")}-${stamp}.kml`, { type: "application/vnd.google-earth.kml+xml" }),
      );
      if (last === "cancel") setNote("Đã hủy.");
      else if (last === "saved") setNote("Đã lưu file KML.");
      else setNote("Đã gửi file KML.");
    } catch {
      setNote("Không xuất được KML.");
    }
  }

  return (
    <ul className="mt-8 grid gap-3">
      {tracks.map((t) => {
        const title = t.name.startsWith("Đường đi") ? t.name : trackTitle(t.createdAt);
        const segs = trackSegCount(t);
        return (
          <li key={t.id}>
            <div className="flex items-center gap-3 rounded-xl bg-bg-elevated px-3 py-3 shadow-(--shadow-border)">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <RouteIcon className="size-5" aria-hidden />
              </span>
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => void exportOne(t)}
              >
                <span className="block truncate font-medium">{title}</span>
                <span className="mt-0.5 block truncate text-sm text-muted tabular-nums">
                  {formatTrackLen(t.lengthM)} · {formatTrackElapsed(t.durationMs)} · {t.points} điểm · {segs} đoạn
                </span>
              </button>
              <button
                type="button"
                className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger"
                aria-label={`Xóa ${title}`}
                onClick={() => {
                  if (!confirm(`Xóa ${title}?`)) return;
                  removeTrack(t.id);
                }}
              >
                <Trash2 className="size-4" />
              </button>
              <button
                type="button"
                className="flex size-11 shrink-0 items-center justify-center text-subtle"
                aria-label={`Xuất ${title}`}
                onClick={() => void exportOne(t)}
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </li>
        );
      })}
      {note ? <li className="text-center text-sm text-muted">{note}</li> : null}
    </ul>
  );
}