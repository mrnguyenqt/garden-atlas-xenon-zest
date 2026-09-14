import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, Check, Images, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoGallery } from "@/components/photo-gallery";
import { StoredImg } from "@/components/stored-img";
import { canvasToJpegBlob, drawPhotoStamp, PHOTO_MAX_EDGE, stampPlotPhoto } from "@/lib/plot-photo";
import { photoRef, savePhotoBlob } from "@/lib/photo-db";
import { useBackToClose } from "@/lib/phone-nav";
import { usePlots, type Plot } from "@/lib/store";

const MAX_PHOTOS = 12;

type DraftPhoto = {
  blob: Blob;
  preview: string;
  takenAt: string;
  stamped: boolean;
};

function FieldCamera({
  plot,
  hidden,
  onCapture,
  onClose,
  onFail,
}: {
  plot: Plot;
  hidden?: boolean;
  onCapture: (draft: DraftPhoto) => void;
  onClose: () => void;
  onFail: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const failRef = useRef(onFail);
  failRef.current = onFail;
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  useBackToClose(!hidden, onClose);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280, max: 1600 },
            height: { ideal: 720, max: 1200 },
            frameRate: { ideal: 24, max: 30 },
          },
          audio: false,
        });
        if (dead) {
          for (const t of stream.getTracks()) t.stop();
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        await video.play();
        setReady(true);
      } catch {
        if (!dead) failRef.current();
      }
    })();
    return () => {
      dead = true;
      for (const t of streamRef.current?.getTracks() ?? []) t.stop();
      streamRef.current = null;
    };
  }, []);

  function stop() {
    for (const t of streamRef.current?.getTracks() ?? []) t.stop();
    streamRef.current = null;
  }

  async function shoot() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || busy) return;
    setBusy(true);
    try {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(vw, vh));
      const w = Math.max(1, Math.round(vw * scale));
      const h = Math.max(1, Math.round(vh * scale));
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvasRef.current = canvas;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "medium";
      ctx.drawImage(video, 0, 0, w, h);
      const takenAt = new Date();
      drawPhotoStamp(ctx, w, h, plot, takenAt);
      const blob = await canvasToJpegBlob(canvas);
      onCapture({
        blob,
        preview: URL.createObjectURL(blob),
        takenAt: takenAt.toISOString(),
        stamped: true,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={hidden ? "hidden" : "fixed inset-0 z-[100] flex flex-col bg-black"}>
      <div
        className="flex items-center justify-between gap-3 px-4"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <p className="text-sm font-medium text-white">Chụp ảnh</p>
        <button
          type="button"
          aria-label="Thoát"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white"
          onClick={() => {
            stop();
            onClose();
          }}
        >
          <X className="size-5" />
        </button>
      </div>
      <video
        ref={videoRef}
        className="min-h-0 w-full flex-1 object-cover"
        playsInline
        muted
        autoPlay
      />
      <div
        className="flex flex-col items-center gap-2 px-5 pt-3"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          aria-label="Chụp"
          disabled={!ready || busy}
          onClick={() => void shoot()}
          className="size-16 rounded-full border-[5px] border-white bg-white/90 disabled:opacity-40"
        />
        <p className="text-xs text-white/80">{ready ? (busy ? "Đang chụp…" : "Bấm để chụp") : "Đang mở camera…"}</p>
      </div>
    </div>
  );
}

export function PlotPhotos({ plot }: { plot: Plot }) {
  const addPhoto = usePlots((s) => s.addPhoto);
  const removePhoto = usePlots((s) => s.removePhoto);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [cam, setCam] = useState(false);
  const [draft, setDraft] = useState<DraftPhoto | null>(null);
  const [gallery, setGallery] = useState<number | null>(null);
  const [backReady, setBackReady] = useState(false);
  const photos = plot.photos ?? [];
  const full = photos.length >= MAX_PHOTOS;

  useEffect(() => {
    if (!draft) {
      setBackReady(false);
      return;
    }
    const t = window.setTimeout(() => setBackReady(true), 250);
    return () => clearTimeout(t);
  }, [draft]);
  useBackToClose(backReady, () => {
    if (draft) URL.revokeObjectURL(draft.preview);
    setDraft(null);
  });

  function acceptDraft(next: DraftPhoto) {
    setDraft(next);
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || full) return;
    setCam(false);
    acceptDraft({
      blob: file,
      preview: URL.createObjectURL(file),
      takenAt: new Date().toISOString(),
      stamped: false,
    });
  }

  async function saveDraft() {
    if (!draft || busy) return;
    setBusy(true);
    try {
      const blob = draft.stamped ? draft.blob : await stampPlotPhoto(draft.blob, plot);
      const id = crypto.randomUUID();
      await savePhotoBlob(id, blob);
      addPhoto(plot.id, { id, src: photoRef(id), takenAt: draft.takenAt });
      URL.revokeObjectURL(draft.preview);
      setDraft(null);
      setCam(false);
    } catch {
      alert("Không lưu được ảnh. Thử lại.");
    } finally {
      setBusy(false);
    }
  }

  function retake() {
    if (draft) URL.revokeObjectURL(draft.preview);
    setDraft(null);
    setCam(true);
  }

  function openCamera() {
    if (busy || full) return;
    setCam(true);
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display min-w-0 shrink text-xl leading-tight whitespace-nowrap italic md:text-2xl">
          Ảnh hiện trường
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          {photos.length > 0 ? (
            <Button size="sm" variant="secondary" onClick={() => setGallery(0)}>
              <Images />
              Thư viện
            </Button>
          ) : null}
          <Button size="sm" disabled={busy || full} onClick={openCamera}>
            <Camera />
            Chụp ảnh
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={onPick}
        />
      </div>
      {photos.length === 0 ? (
        <p className="mt-6 text-center text-muted">Chưa có ảnh. Chụp hiện trường ô tiêu chuẩn.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-4">
          {photos.map((ph, i) => (
            <li key={ph.id} className="relative overflow-hidden rounded-lg bg-bg-elevated shadow-(--shadow-border)">
              <button type="button" className="block w-full" onClick={() => setGallery(i)}>
                <StoredImg src={ph.src} className="aspect-square w-full object-cover" />
              </button>
              <button
                type="button"
                className="absolute top-1 right-1 flex size-9 items-center justify-center rounded-full bg-bg/80 text-muted hover:text-danger"
                aria-label="Xóa ảnh"
                onClick={() => {
                  if (!confirm("Xóa ảnh này?")) return;
                  removePhoto(plot.id, ph.id);
                }}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {gallery !== null && photos[gallery] ? (
        <PhotoGallery
          photos={photos}
          index={gallery}
          onIndex={setGallery}
          onClose={() => setGallery(null)}
        />
      ) : null}
      {cam ? (
        <FieldCamera
          plot={plot}
          hidden={Boolean(draft)}
          onCapture={acceptDraft}
          onClose={() => setCam(false)}
          onFail={() => {
            setCam(false);
            window.setTimeout(() => inputRef.current?.click(), 50);
          }}
        />
      ) : null}
      {draft ? (
        <div className="fixed inset-0 z-[110] flex flex-col bg-bg">
          <div
            className="flex items-center justify-between gap-3 px-4"
            style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
          >
            <p className="text-sm font-medium">Xem lại</p>
            <button
              type="button"
              aria-label="Thoát"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-bg-subtle text-fg shadow-(--shadow-border)"
              onClick={() => {
                URL.revokeObjectURL(draft.preview);
                setDraft(null);
                setCam(false);
              }}
            >
              <X className="size-5" />
            </button>
          </div>
          <img src={draft.preview} alt="Xem lại" className="min-h-0 w-full flex-1 object-contain" />
          <div
            className="grid grid-cols-2 gap-3 px-5 pt-3"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <Button type="button" variant="secondary" disabled={busy} onClick={retake}>
              <Camera />
              Chụp lại
            </Button>
            <Button type="button" disabled={busy} onClick={() => void saveDraft()}>
              <Check />
              {busy ? "Đang lưu…" : "Lưu"}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
