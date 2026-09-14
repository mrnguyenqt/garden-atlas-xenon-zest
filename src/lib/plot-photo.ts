import { gpsWgsLabel } from "@/lib/gps";
import { placeFromGpsOffline } from "@/lib/place";

export const PHOTO_MAX_EDGE = 4096;
const JPEG_QUALITY = 0.92;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function stampDateTime(d = new Date()) {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function stampLines(
  plot: {
    name: string;
    location: string;
    coordX: number;
    coordY: number;
    gpsLat?: number;
    gpsLng?: number;
    gpsAccuracyM?: number;
  },
  takenAt = new Date(),
  placeLabel?: string,
) {
  const xy = [
    plot.coordX ? `X: ${Math.round(plot.coordX)}` : null,
    plot.coordY ? `Y: ${Math.round(plot.coordY)}` : null,
  ]
    .filter(Boolean)
    .join("; ");
  const gps =
    plot.gpsLat && plot.gpsLng ? `GPS ${gpsWgsLabel(plot.gpsLat, plot.gpsLng, plot.gpsAccuracyM)}` : "";
  const place = placeLabel?.trim() || (plot.gpsLat && plot.gpsLng ? "Chưa xác định xã, tỉnh" : "Chưa có GPS");
  return [stampDateTime(takenAt), place, xy || "Chưa có toạ độ", gps, plot.name].filter(Boolean);
}

let lastPlace: { lat: number; lng: number; label?: string } | null = null;

export function drawPhotoStamp(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  plot: {
    name: string;
    location: string;
    coordX: number;
    coordY: number;
    gpsLat?: number;
    gpsLng?: number;
    gpsAccuracyM?: number;
  },
  takenAt = new Date(),
) {
  let place: string | undefined;
  if (plot.gpsLat && plot.gpsLng) {
    if (lastPlace && lastPlace.lat === plot.gpsLat && lastPlace.lng === plot.gpsLng) {
      place = lastPlace.label;
    } else {
      place = placeFromGpsOffline(plot.gpsLat, plot.gpsLng)?.label;
      lastPlace = { lat: plot.gpsLat, lng: plot.gpsLng, label: place };
    }
  }
  const lines = stampLines(plot, takenAt, place);
  const padPx = Math.max(12, Math.round(w * 0.02));
  const fontSize = Math.max(16, Math.round(w * 0.028));
  ctx.font = `600 ${fontSize}px Outfit, system-ui, sans-serif`;
  const lineH = fontSize * 1.35;
  const barH = padPx * 2 + lineH * lines.length;
  ctx.fillStyle = "rgba(12, 24, 14, 0.62)";
  ctx.fillRect(0, h - barH, w, barH);
  ctx.fillStyle = "#F8ECC8";
  ctx.textBaseline = "top";
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 1;
  lines.forEach((line, i) => {
    ctx.fillText(line, padPx, h - barH + padPx + i * lineH, w - padPx * 2);
  });
  ctx.shadowBlur = 0;
}

export function canvasToJpegBlob(canvas: HTMLCanvasElement, quality = JPEG_QUALITY) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("jpeg"));
        else resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

let stampCanvas: HTMLCanvasElement | null = null;

function stampSurface(w: number, h: number) {
  const canvas = stampCanvas ?? document.createElement("canvas");
  stampCanvas = canvas;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  return canvas;
}

export async function stampBitmap(
  src: ImageBitmap,
  plot: {
    name: string;
    location: string;
    coordX: number;
    coordY: number;
    gpsLat?: number;
    gpsLng?: number;
    gpsAccuracyM?: number;
  },
  takenAt = new Date(),
) {
  const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(src.width, src.height));
  const w = Math.max(1, Math.round(src.width * scale));
  const h = Math.max(1, Math.round(src.height * scale));
  const canvas = stampSurface(w, h);
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    src.close();
    throw new Error("canvas");
  }
  ctx.imageSmoothingEnabled = scale < 1;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, w, h);
  src.close();
  drawPhotoStamp(ctx, w, h, plot, takenAt);
  return canvasToJpegBlob(canvas);
}

export async function stampPlotPhoto(
  file: Blob,
  plot: {
    name: string;
    location: string;
    coordX: number;
    coordY: number;
    gpsLat?: number;
    gpsLng?: number;
    gpsAccuracyM?: number;
  },
) {
  const src = await createImageBitmap(file);
  return stampBitmap(src, plot);
}

