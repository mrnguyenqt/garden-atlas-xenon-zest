export type NativeFix = {
  lat: number;
  lng: number;
  acc: number;
  ele?: number;
  at: number;
};

type Bridge = {
  start: () => string;
  stop: () => string;
  drain: () => string;
};

export function nativeTrack(): Bridge | null {
  if (typeof window === "undefined") return null;
  const b = (window as Window & { RungVangTrack?: Bridge }).RungVangTrack;
  if (!b || typeof b.start !== "function") return null;
  return b;
}

export function parseNativeFixes(raw: string): NativeFix[] {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter((x): x is NativeFix => {
      const p = x as NativeFix;
      return Number.isFinite(p?.lat) && Number.isFinite(p?.lng);
    });
  } catch {
    return [];
  }
}

export function onNativeFix(fn: (fix: NativeFix) => void) {
  if (typeof window === "undefined") return () => {};
  (window as Window & { __rvTrackFix?: (fix: NativeFix) => void }).__rvTrackFix = fn;
  return () => {
    const w = window as Window & { __rvTrackFix?: (fix: NativeFix) => void };
    if (w.__rvTrackFix === fn) w.__rvTrackFix = undefined;
  };
}
