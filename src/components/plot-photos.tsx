import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import { Camera, Check, Images, Trash2, X, Zap, ZapOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoGallery } from "@/components/photo-gallery";
import { StoredImg } from "@/components/stored-img";
import { captureStill, openFieldCamera, prefetchFieldCamera, setTorch, setZoom, stopFieldSession, tapFocus, type FieldCamCaps, type FieldSession } from "@/lib/field-camera";
import { stampBitmap, stampPlotPhoto } from "@/lib/plot-photo";
import { saveToAppFolder } from "@/lib/app-folder";
import { photoRef, savePhotoBlob } from "@/lib/photo-db";
import { useBackToClose } from "@/lib/phone-nav";
import { usePlots, type Plot } from "@/lib/store";
import { cn } from "@/lib/utils";

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
  const camRef = useRef<FieldSession | null>(null);
  const failRef = useRef(onFail);
  failRef.current = onFail;
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [torch, setTorchOn] = useState(false);
  const [caps, setCaps] = useState<FieldCamCaps>({ torch: false, zoom: null, tapFocus: false });
  const [zoom, setZoomVal] = useState(1);
  const [focusRing, setFocusRing] = useState<{ x: number; y: number } | null>(null);
  useBackToClose(!hidden, onClose);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const cam = await openFieldCamera();
        if (dead) {
          stopFieldSession(cam);
          return;
        }
        camRef.current = cam;
        setCaps(cam.features);
        if (cam.features.zoom) setZoomVal(cam.features.zoom.min || 1);
        const video = videoRef.current;
        if (!video) {
          stopFieldSession(cam);
          camRef.current = null;
          return;
        }
        video.srcObject = cam.stream;
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        await video.play();
        if (!dead) setReady(true);
      } catch {
        if (!dead) failRef.current();
      }
    })();
    return () => {
      dead = true;
      stopFieldSession(camRef.current);
      camRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (hidden && torch && camRef.current) {
      void setTorch(camRef.current.track, false);
      setTorchOn(false);
    }
  }, [hidden, torch]);

  function stop() {
    stopFieldSession(camRef.current);
    camRef.current = null;
  }

  async function toggleTorch() {
    const track = camRef.current?.track;
    if (!track || !caps.torch) return;
    const next = !torch;
    if (await setTorch(track, next)) setTorchOn(next);
  }

  async function onZoom(v: number) {
    const track = camRef.current?.track;
    if (!track) return;
    setZoomVal(v);
    await setZoom(track, v);
  }

  async function onTap(e: PointerEvent<HTMLVideoElement>) {
    const track = camRef.current?.track;
    const video = videoRef.current;
    if (!track || !video || !caps.tapFocus) return;
    const rect = video.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setFocusRing({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    window.setTimeout(() => setFocusRing(null), 700);
    await tapFocus(track, x, y);
  }

  async function shoot() {
    const video = videoRef.current;
    const cam = camRef.current;
    if (!video || !cam || busy) return;
    setBusy(true);
    try {
      const bitmap = await captureStill(cam.capture, video);
      const takenAt = new Date();
      const blob = await stampBitmap(bitmap, plot, takenAt);
      onCapture({
        blob,
        preview: URL.createObjectURL(blob),
        takenAt: takenAt.toISOString(),
        stamped: true,
      });
    } catch {
      /* giữ máy ảnh mở */
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
        <div className="flex items-center gap-2">
          {caps.torch ? (
            <button
              type="button"
              aria-label={torch ? "Tắt đèn" : "Bật đèn"}
              className={cn(
                "flex size-11 items-center justify-center rounded-full",
                torch ? "bg-amber-300 text-black" : "bg-white/15 text-white",
              )}
              onClick={() => void toggleTorch()}
            >
              {torch ? <Zap className="size-5" /> : <ZapOff className="size-5" />}
            </button>
          ) : null}
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
      </div>
      <div className="relative min-h-0 flex-1 bg-black">
        <video
          ref={videoRef}
          className={cn("h-full w-full bg-black object-cover", ready ? "visible opacity-100" : "invisible")}
          playsInline
          muted
          autoPlay
          disablePictureInPicture
          controls={false}
          poster=""
          onPointerUp={onTap}
        />
        {ready ? null : <div className="absolute inset-0 z-10 bg-black" />}
        {focusRing ? (
          <span
            className="pointer-events-none absolute size-16 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-white/90"
            style={{ left: focusRing.x, top: focusRing.y }}
          />
        ) : null}
        {caps.zoom ? (
          <input
            type="range"
            min={caps.zoom.min}
            max={caps.zoom.max}
            step={caps.zoom.step || 0.1}
            value={zoom}
            aria-label="Zoom"
            className="absolute top-1/2 right-3 h-36 w-8 -translate-y-1/2 appearance-none bg-transparent"
            style={{ writingMode: "vertical-lr", direction: "rtl" }}
            onChange={(e) => void onZoom(Number(e.target.value))}
          />
        ) : null}
      </div>
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
        <p className="text-xs text-white/80">
          {ready ? (busy ? "Đang chụp…" : caps.tapFocus ? "Chạm để lấy nét · Bấm để chụp" : "Bấm để chụp") : "Đang mở camera…"}
        </p>
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
      const stamp = (draft.takenAt || new Date().toISOString()).replace(/[:.]/g, "-");
      const file = `${plot.name || "OTC"}-${stamp}.jpg`;
      void saveToAppFolder("anh-hien-truong", file, blob);
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
          <Button
            size="sm"
            disabled={busy || full}
            onPointerDown={() => prefetchFieldCamera()}
            onClick={openCamera}
          >
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
