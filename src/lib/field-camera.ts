type PhotoRange = { min: number; max: number; step?: number };

type PhotoCaps = {
  imageWidth?: PhotoRange;
  imageHeight?: PhotoRange;
};

type ImageCaptureLike = {
  grabFrame: () => Promise<ImageBitmap>;
  takePhoto?: (settings?: Record<string, unknown>) => Promise<Blob>;
  getPhotoCapabilities?: () => Promise<PhotoCaps>;
};

type AdvCaps = {
  torch?: boolean;
  zoom?: PhotoRange;
  focusMode?: string[];
  exposureMode?: string[];
  whiteBalanceMode?: string[];
  pointsOfInterest?: boolean;
};

export type FieldCamCaps = {
  torch: boolean;
  zoom: PhotoRange | null;
  tapFocus: boolean;
};

const PREVIEW: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 3840 },
  height: { ideal: 2160 },
  aspectRatio: { ideal: 4 / 3 },
};

function imageCaptureOf(track: MediaStreamTrack): ImageCaptureLike | null {
  const Ctor = (window as unknown as { ImageCapture?: new (t: MediaStreamTrack) => ImageCaptureLike }).ImageCapture;
  if (!Ctor) return null;
  try {
    return new Ctor(track);
  } catch {
    return null;
  }
}

function capsOf(track: MediaStreamTrack): AdvCaps {
  try {
    return (track.getCapabilities?.() ?? {}) as AdvCaps;
  } catch {
    return {};
  }
}

async function applyAdv(track: MediaStreamTrack, patch: Record<string, unknown>) {
  try {
    await track.applyConstraints({ advanced: [patch] } as MediaTrackConstraints);
    return true;
  } catch {
    try {
      await track.applyConstraints(patch as MediaTrackConstraints);
      return true;
    } catch {
      return false;
    }
  }
}

export type FieldSession = {
  stream: MediaStream;
  track: MediaStreamTrack;
  capture: ImageCaptureLike | null;
  features: FieldCamCaps;
};

function featuresOf(track: MediaStreamTrack): FieldCamCaps {
  const caps = capsOf(track);
  return {
    torch: Boolean(caps.torch),
    zoom: caps.zoom && caps.zoom.max > (caps.zoom.min || 1) ? caps.zoom : null,
    tapFocus: Boolean(caps.pointsOfInterest) || Boolean(caps.focusMode?.includes("single-shot")),
  };
}

function tuneTrack(track: MediaStreamTrack) {
  const caps = capsOf(track);
  const patch: Record<string, unknown> = {};
  if (caps.focusMode?.includes("continuous")) patch.focusMode = "continuous";
  if (caps.exposureMode?.includes("continuous")) patch.exposureMode = "continuous";
  if (caps.whiteBalanceMode?.includes("continuous")) patch.whiteBalanceMode = "continuous";
  if (Object.keys(patch).length) void applyAdv(track, patch);
}

async function boostPreview(track: MediaStreamTrack) {
  try {
    const caps = (track.getCapabilities?.() ?? {}) as { width?: PhotoRange; height?: PhotoRange };
    const maxW = caps.width?.max;
    const maxH = caps.height?.max;
    if (!maxW || !maxH) return;
    await track.applyConstraints({
      width: { ideal: Math.min(maxW, 3840) },
      height: { ideal: Math.min(maxH, 2880) },
    });
  } catch {
    /* giữ độ phân giải trình duyệt cấp */
  }
}

async function createSession(): Promise<FieldSession> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: PREVIEW });
  const track = stream.getVideoTracks()[0];
  if (!track) {
    for (const t of stream.getTracks()) t.stop();
    throw new Error("camera");
  }
  await boostPreview(track);
  tuneTrack(track);
  return { stream, track, capture: imageCaptureOf(track), features: featuresOf(track) };
}

let prefetch: Promise<FieldSession> | null = null;

export function prefetchFieldCamera() {
  if (prefetch) return;
  prefetch = createSession().catch((err) => {
    prefetch = null;
    throw err;
  });
}

export async function openFieldCamera(): Promise<FieldSession> {
  const ready = prefetch;
  prefetch = null;
  if (ready) return ready;
  return createSession();
}

export function stopFieldSession(session: FieldSession | null) {
  if (!session) return;
  for (const t of session.stream.getTracks()) t.stop();
}

export async function setTorch(track: MediaStreamTrack, on: boolean) {
  return applyAdv(track, { torch: on });
}

export async function setZoom(track: MediaStreamTrack, zoom: number) {
  return applyAdv(track, { zoom });
}

export async function tapFocus(track: MediaStreamTrack, x: number, y: number) {
  const nx = Math.min(1, Math.max(0, x));
  const ny = Math.min(1, Math.max(0, y));
  const caps = capsOf(track);
  if (caps.pointsOfInterest) {
    const ok = await applyAdv(track, { pointsOfInterest: [{ x: nx, y: ny }] });
    if (ok) return true;
  }
  if (caps.focusMode?.includes("single-shot")) return applyAdv(track, { focusMode: "single-shot" });
  return false;
}

function px(bmp: ImageBitmap) {
  return bmp.width * bmp.height;
}

async function bitmapFromPhoto(capture: ImageCaptureLike): Promise<ImageBitmap | null> {
  if (!capture.takePhoto) return null;
  const tryPhoto = async (settings?: Record<string, unknown>) => {
    const blob = await capture.takePhoto!(settings);
    if (!blob || blob.size < 1024) return null;
    return createImageBitmap(blob);
  };
  let caps: PhotoCaps | null = null;
  try {
    caps = capture.getPhotoCapabilities ? await capture.getPhotoCapabilities() : null;
  } catch {
    caps = null;
  }
  const w = caps?.imageWidth?.max;
  const h = caps?.imageHeight?.max;
  const attempts: Array<Record<string, unknown> | undefined> = [];
  if (w && h) attempts.push({ imageWidth: w, imageHeight: h });
  if (w) attempts.push({ imageWidth: w });
  attempts.push(undefined);
  for (const settings of attempts) {
    try {
      const shot = await tryPhoto(settings);
      if (shot) return shot;
    } catch {
      /* thử cấu hình khác */
    }
  }
  return null;
}

export async function captureStill(
  capture: ImageCaptureLike | null,
  video: HTMLVideoElement,
): Promise<ImageBitmap> {
  let best: ImageBitmap | null = null;
  const keep = (bmp: ImageBitmap | null) => {
    if (!bmp) return;
    if (!best || px(bmp) > px(best)) {
      best?.close();
      best = bmp;
    } else {
      bmp.close();
    }
  };
  if (capture) {
    keep(await bitmapFromPhoto(capture));
    if (!best || Math.max(best.width, best.height) < 2000) {
      try {
        keep(await capture.grabFrame());
      } catch {
        /* video */
      }
    }
  }
  if ((!best || Math.max(best.width, best.height) < 2000) && video.videoWidth) {
    keep(await createImageBitmap(video));
  }
  if (!best) throw new Error("preview");
  return best;
}
