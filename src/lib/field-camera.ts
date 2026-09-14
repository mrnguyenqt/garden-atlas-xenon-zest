type PhotoRange = { min: number; max: number; step?: number };

type ImageCaptureLike = {
  grabFrame: () => Promise<ImageBitmap>;
};

type AdvCaps = {
  torch?: boolean;
  zoom?: PhotoRange;
  focusMode?: string[];
  pointsOfInterest?: boolean;
};

export type FieldCamCaps = {
  torch: boolean;
  zoom: PhotoRange | null;
  tapFocus: boolean;
};

const PREVIEW: MediaTrackConstraints = {
  facingMode: { ideal: "environment" },
  width: { ideal: 960 },
  height: { ideal: 720 },
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
  if (Object.keys(patch).length) void applyAdv(track, patch);
}

async function createSession(): Promise<FieldSession> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: PREVIEW });
  const track = stream.getVideoTracks()[0];
  if (!track) {
    for (const t of stream.getTracks()) t.stop();
    throw new Error("camera");
  }
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

export async function captureStill(
  capture: ImageCaptureLike | null,
  video: HTMLVideoElement,
): Promise<ImageBitmap> {
  if (capture) {
    try {
      return await capture.grabFrame();
    } catch {
      /* video */
    }
  }
  if (!video.videoWidth) throw new Error("preview");
  return createImageBitmap(video);
}
