import admin from "@/lib/vn-admin.json";

export type PlaceName = {
  commune: string;
  province: string;
  label: string;
};

type Unit = { n: string; b: number[]; r: number[][][] };

const provinces = (admin as { p: Unit[]; c: Unit[] }).p;
const communes = (admin as { p: Unit[]; c: Unit[] }).c;
const cache = new Map<string, PlaceName | null>();

function cacheKey(lat: number, lng: number) {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function inRing(lng: number, lat: number, ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    if (yi === yj) continue;
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function hit(lng: number, lat: number, units: Unit[]) {
  for (const u of units) {
    const [minX, minY, maxX, maxY] = u.b;
    if (lng < minX || lng > maxX || lat < minY || lat > maxY) continue;
    if (u.r.some((ring) => inRing(lng, lat, ring))) return u.n;
  }
  return "";
}

function labelOf(commune: string, province: string): PlaceName | null {
  if (!commune && !province) return null;
  return {
    commune,
    province,
    label: [commune, province].filter(Boolean).join(", "),
  };
}

/** Xã (Quảng Trị) + tỉnh (cả nước) từ polygon, không cần mạng. */
export function placeFromGpsOffline(lat: number, lng: number): PlaceName | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;
  const commune = hit(lng, lat, communes);
  const province = hit(lng, lat, provinces);
  return labelOf(commune, province);
}

function fromBigData(j: {
  locality?: string;
  city?: string;
  principalSubdivision?: string;
  localityInfo?: { administrative?: { adminLevel?: number; name?: string }[] };
}): PlaceName | null {
  const admins = j.localityInfo?.administrative ?? [];
  const xa =
    admins.find((a) => a.adminLevel === 8 || a.adminLevel === 9)?.name ||
    admins.find((a) => /xã|phường|thị trấn/i.test(a.name || ""))?.name ||
    j.locality ||
    j.city ||
    "";
  const tinh = admins.find((a) => a.adminLevel === 4)?.name || j.principalSubdivision || "";
  return labelOf(xa.replace(/\s+/g, " ").trim(), tinh.replace(/\s+/g, " ").trim());
}

/** Ưu tiên dữ liệu ranh giới trên máy; nếu có mạng thì bổ sung khi thiếu xã. */
export async function placeFromGps(lat: number, lng: number, ms = 2500): Promise<PlaceName | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  const key = cacheKey(lat, lng);
  if (cache.has(key)) return cache.get(key) ?? null;

  const offline = placeFromGpsOffline(lat, lng);
  if (offline?.commune) {
    cache.set(key, offline);
    return offline;
  }

  const online = typeof navigator !== "undefined" && navigator.onLine;
  if (online) {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), ms);
    try {
      const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=vi`;
      const res = await fetch(url, { signal: ctrl.signal });
      if (res.ok) {
        const place = fromBigData(await res.json());
        if (place) {
          cache.set(key, place);
          return place;
        }
      }
    } catch {
      /* giữ kết quả offline */
    } finally {
      window.clearTimeout(timer);
    }
  }

  cache.set(key, offline);
  return offline;
}
