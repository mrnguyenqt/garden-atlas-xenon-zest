import { useRef, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { StoredImg } from "@/components/stored-img";
import { useBackToClose } from "@/lib/phone-nav";
import { formatDate, formatTime } from "@/lib/utils";

export type GalleryPhoto = {
  id: string;
  src: string;
  takenAt: string;
  caption?: string;
};

export function PhotoGallery({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: GalleryPhoto[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const photo = photos[index];
  const startX = useRef<number | null>(null);
  useBackToClose(true, onClose);
  if (!photo) return null;

  function go(delta: number) {
    const next = index + delta;
    if (next < 0 || next >= photos.length) return;
    onIndex(next);
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    startX.current = e.clientX;
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (dx > 48) go(-1);
    else if (dx < -48) go(1);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <div className="flex items-center gap-3 px-3" style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
        <p className="min-w-0 flex-1 text-sm font-medium tabular-nums">
          {index + 1} / {photos.length}
          {photo.takenAt ? (
            <span className="ml-2 font-normal text-muted">
              {formatDate(photo.takenAt)} · {formatTime(photo.takenAt)}
            </span>
          ) : null}
          {photo.caption ? <span className="mt-0.5 block truncate font-normal text-muted">{photo.caption}</span> : null}
        </p>
        <ClosePhoto onClick={onClose} />
      </div>
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <StoredImg src={photo.src} className="max-h-full max-w-full object-contain" />
        {index > 0 ? (
          <button
            type="button"
            aria-label="Ảnh trước"
            className="absolute left-1 flex size-11 items-center justify-center rounded-full bg-bg/70"
            onClick={() => go(-1)}
          >
            <ChevronLeft className="size-6" />
          </button>
        ) : null}
        {index < photos.length - 1 ? (
          <button
            type="button"
            aria-label="Ảnh sau"
            className="absolute right-1 flex size-11 items-center justify-center rounded-full bg-bg/70"
            onClick={() => go(1)}
          >
            <ChevronRight className="size-6" />
          </button>
        ) : null}
      </div>
      <ul
        className="flex gap-2 overflow-x-auto px-3 pt-3"
        style={{ paddingBottom: "max(0.75rem, var(--sys-nav, env(safe-area-inset-bottom)))" }}
      >
        {photos.map((ph, i) => (
          <li key={ph.id} className="shrink-0">
            <button
              type="button"
              onClick={() => onIndex(i)}
              className={
                i === index
                  ? "block overflow-hidden rounded-sm ring-2 ring-primary"
                  : "block overflow-hidden rounded-sm opacity-70"
              }
            >
              <StoredImg src={ph.src} className="size-14 object-cover" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ClosePhoto({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Đóng"
      onClick={onClick}
      className="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full bg-bg/80 text-fg shadow-(--shadow-border)"
    >
      <X className="size-5" />
    </button>
  );
}
