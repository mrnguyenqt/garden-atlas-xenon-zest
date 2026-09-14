import proj4 from "proj4";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nf0 } from "@/lib/utils";

/** 7 tham số VN-2000 ↔ WGS84. Múi 3°: k=0,9999, x0=500000. */
const TOWGS84 =
  "-191.90441429,-39.30318279,-111.45032835,-0.00928836,0.01975479,-0.00427372,0.252906278";

function vn2000Tmerc(lon0: number) {
  return `+proj=tmerc +lat_0=0 +lon_0=${lon0} +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=${TOWGS84} +units=m +no_defs`;
}

export function lonToDms(lon: number) {
  const deg = Math.floor(lon + 1e-9);
  const min = Math.round((lon - deg) * 60);
  return `${deg}°${String(min).padStart(2, "0")}'`;
}

/** Kinh tuyến trục VN-2000 múi 3° theo tỉnh (Thông tư đo đạc). */
export const VN2000_ZONES: { id: string; name: string; lon: number }[] = [
  { id: "quang-tri", name: "Quảng Trị", lon: 106.25 },
  { id: "quang-binh", name: "Quảng Bình", lon: 106 },
  { id: "hue", name: "Thừa Thiên Huế", lon: 107 },
  { id: "da-nang", name: "Đà Nẵng", lon: 107.75 },
  { id: "quang-nam", name: "Quảng Nam", lon: 107.75 },
  { id: "an-giang", name: "An Giang", lon: 104.75 },
  { id: "ba-ria-vung-tau", name: "Bà Rịa - Vũng Tàu", lon: 107.75 },
  { id: "bac-lieu", name: "Bạc Liêu", lon: 105 },
  { id: "bac-giang", name: "Bắc Giang", lon: 107 },
  { id: "bac-kan", name: "Bắc Kạn", lon: 106.5 },
  { id: "bac-ninh", name: "Bắc Ninh", lon: 105.5 },
  { id: "ben-tre", name: "Bến Tre", lon: 105.75 },
  { id: "binh-duong", name: "Bình Dương", lon: 105.75 },
  { id: "binh-dinh", name: "Bình Định", lon: 108.25 },
  { id: "binh-phuoc", name: "Bình Phước", lon: 106.25 },
  { id: "binh-thuan", name: "Bình Thuận", lon: 108.5 },
  { id: "ca-mau", name: "Cà Mau", lon: 104.5 },
  { id: "cao-bang", name: "Cao Bằng", lon: 105.75 },
  { id: "can-tho", name: "Cần Thơ", lon: 105 },
  { id: "dak-lak", name: "Đắk Lắk", lon: 108.5 },
  { id: "dak-nong", name: "Đắk Nông", lon: 108.5 },
  { id: "dien-bien", name: "Điện Biên", lon: 103 },
  { id: "dong-nai", name: "Đồng Nai", lon: 107.75 },
  { id: "dong-thap", name: "Đồng Tháp", lon: 105 },
  { id: "gia-lai", name: "Gia Lai", lon: 108.5 },
  { id: "ha-giang", name: "Hà Giang", lon: 105.5 },
  { id: "ha-nam", name: "Hà Nam", lon: 105 },
  { id: "ha-noi", name: "Hà Nội", lon: 105 },
  { id: "ha-tinh", name: "Hà Tĩnh", lon: 105.5 },
  { id: "hai-duong", name: "Hải Dương", lon: 105.5 },
  { id: "hai-phong", name: "Hải Phòng", lon: 105.75 },
  { id: "hau-giang", name: "Hậu Giang", lon: 105 },
  { id: "hoa-binh", name: "Hòa Bình", lon: 106 },
  { id: "hcm", name: "TP. Hồ Chí Minh", lon: 105.75 },
  { id: "hung-yen", name: "Hưng Yên", lon: 105.5 },
  { id: "khanh-hoa", name: "Khánh Hòa", lon: 108.25 },
  { id: "kien-giang", name: "Kiên Giang", lon: 104.5 },
  { id: "kon-tum", name: "Kon Tum", lon: 107.5 },
  { id: "lai-chau", name: "Lai Châu", lon: 103 },
  { id: "lang-son", name: "Lạng Sơn", lon: 107.25 },
  { id: "lao-cai", name: "Lào Cai", lon: 104.75 },
  { id: "lam-dong", name: "Lâm Đồng", lon: 107.75 },
  { id: "long-an", name: "Long An", lon: 105.75 },
  { id: "nam-dinh", name: "Nam Định", lon: 105.5 },
  { id: "nghe-an", name: "Nghệ An", lon: 104.75 },
  { id: "ninh-binh", name: "Ninh Bình", lon: 105 },
  { id: "ninh-thuan", name: "Ninh Thuận", lon: 108.25 },
  { id: "phu-tho", name: "Phú Thọ", lon: 104.75 },
  { id: "phu-yen", name: "Phú Yên", lon: 108.5 },
  { id: "quang-ngai", name: "Quảng Ngãi", lon: 108 },
  { id: "quang-ninh", name: "Quảng Ninh", lon: 107.75 },
  { id: "soc-trang", name: "Sóc Trăng", lon: 105.5 },
  { id: "son-la", name: "Sơn La", lon: 104 },
  { id: "tay-ninh", name: "Tây Ninh", lon: 105.5 },
  { id: "thai-binh", name: "Thái Bình", lon: 105.5 },
  { id: "thai-nguyen", name: "Thái Nguyên", lon: 106.5 },
  { id: "thanh-hoa", name: "Thanh Hóa", lon: 105 },
  { id: "tuyen-quang", name: "Tuyên Quang", lon: 106 },
  { id: "vinh-long", name: "Vĩnh Long", lon: 105.5 },
  { id: "vinh-phuc", name: "Vĩnh Phúc", lon: 105 },
  { id: "yen-bai", name: "Yên Bái", lon: 104.75 },
];

export const DEFAULT_VN2000_ZONE = "quang-tri";

export function getVn2000Zone(id?: string) {
  return VN2000_ZONES.find((z) => z.id === id) ?? VN2000_ZONES[0];
}

export function zoneLabel(zone: { name: string; lon: number }) {
  return `${zone.name} - ${lonToDms(zone.lon)}`;
}

type ZoneState = {
  zoneId: string;
  setZoneId: (id: string) => void;
};

export const useVn2000 = create<ZoneState>()(
  persist(
    (set) => ({
      zoneId: DEFAULT_VN2000_ZONE,
      setZoneId: (zoneId) => set({ zoneId }),
    }),
    { name: "rung-vn2000", skipHydration: true },
  ),
);

function projName(lon: number) {
  return `VN2000_${String(lon).replace(".", "_")}`;
}

function ensureProj(lon: number) {
  const name = projName(lon);
  proj4.defs(name, vn2000Tmerc(lon));
  return name;
}

export function currentVn2000Zone() {
  return getVn2000Zone(useVn2000.getState().zoneId);
}

export type GpsFix = {
  lat: number;
  lng: number;
  accuracyM: number;
  x: number;
  y: number;
  at: string;
};

export type GpsGrade = {
  id: "tot" | "dat" | "tb" | "yeu" | "none";
  label: string;
  ok: boolean;
  hint: string;
};

/** Ngưỡng sai số cầm tay khi điều tra rừng. */
export const GPS_TARGET_M = 8;
export const GPS_ACCEPT_M = 20;
const GPS_WATCH_MS = 20000;

export function gpsAccuracyGrade(accuracyM?: number): GpsGrade {
  if (!accuracyM || accuracyM <= 0) {
    return { id: "none", label: "Chưa đo", ok: false, hint: "Chưa có số liệu GPS." };
  }
  if (accuracyM <= 5) {
    return { id: "tot", label: "Tốt", ok: true, hint: "Sai số ≤ 5 m — dùng được cho lập ô." };
  }
  if (accuracyM <= 10) {
    return { id: "dat", label: "Đạt", ok: true, hint: "Sai số ≤ 10 m — đạt cho ô tiêu chuẩn." };
  }
  if (accuracyM <= GPS_ACCEPT_M) {
    return { id: "tb", label: "Trung bình", ok: true, hint: "Sai số ≤ 20 m — ghi nhận, nên đo lại nếu được." };
  }
  return {
    id: "yeu",
    label: "Yếu",
    ok: false,
    hint: "Sai số > 20 m — ra chỗ trống trời, giữ máy yên rồi đo lại.",
  };
}

export function wgs84ToVn2000(lat: number, lng: number, lon0 = currentVn2000Zone().lon) {
  const [x, y] = proj4("WGS84", ensureProj(lon0), [lng, lat]) as [number, number];
  return { x: Math.round(x), y: Math.round(y) };
}

export function vn2000ToWgs84(x: number, y: number, lon0 = currentVn2000Zone().lon) {
  const [lng, lat] = proj4(ensureProj(lon0), "WGS84", [x, y]) as [number, number];
  return { lat, lng };
}

export function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

/** Dán từ Maps: 16.709143,107.263080 */
export function formatMapsLatLng(lat: number, lng: number) {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export function parseMapsLatLng(raw: string) {
  const t = raw.trim().replace(/°/g, "").replace(/\s+/g, " ");
  const m =
    t.match(/(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)/) ??
    t.match(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

function fixFromCoords(coords: GeolocationCoordinates): GpsFix {
  const lat = coords.latitude;
  const lng = coords.longitude;
  const { x, y } = wgs84ToVn2000(lat, lng);
  return {
    lat,
    lng,
    accuracyM: coords.accuracy,
    x,
    y,
    at: new Date().toISOString(),
  };
}

const GEO_OPTS: PositionOptions = { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 };

function geoError(err: GeolocationPositionError) {
  if (err.code === 1) return new Error("Chưa cho phép vị trí. Bật GPS rồi thử lại.");
  if (err.code === 3) return new Error("Hết thời gian chờ GPS. Ra chỗ trống trời rồi thử lại.");
  return new Error("Không lấy được GPS.");
}

export function readGps(): Promise<GpsFix> {
  return watchGps();
}

/** Theo dõi GPS, giữ lần đo sai số nhỏ nhất. Dừng khi ≤ 8 m hoặc hết 20 giây. */
export function watchGps(onSample?: (fix: GpsFix) => void, maxMs = GPS_WATCH_MS): Promise<GpsFix> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Máy không hỗ trợ GPS."));
      return;
    }
    let best: GpsFix | null = null;
    let done = false;
    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      navigator.geolocation.clearWatch(watchId);
      window.clearTimeout(timer);
      fn();
    };
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const fix = fixFromCoords(pos.coords);
        if (!best || fix.accuracyM < best.accuracyM) best = fix;
        onSample?.(best);
        if (best.accuracyM <= GPS_TARGET_M) finish(() => resolve(best!));
      },
      (err) => {
        if (best) finish(() => resolve(best!));
        else finish(() => reject(geoError(err)));
      },
      GEO_OPTS,
    );
    const timer = window.setTimeout(() => {
      if (best) finish(() => resolve(best!));
      else finish(() => reject(new Error("Hết thời gian chờ GPS. Ra chỗ trống trời rồi thử lại.")));
    }, maxMs);
  });
}

export function haversineM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function pathLengthM(pts: Array<{ lat: number; lng: number }>) {
  let sum = 0;
  for (let i = 1; i < pts.length; i++) sum += haversineM(pts[i - 1], pts[i]);
  return sum;
}

function xmlEsc(s: string) {
  return s
    .replace(/&/g, "\u0026amp;")
    .replace(/</g, "\u0026lt;")
    .replace(/>/g, "\u0026gt;")
    .replace(/"/g, "\u0026quot;");
}

/** KML 2.2 LineString (WGS84: lon,lat,ele). Mở bằng Google Earth, Maps, QGIS. */
export function toKml(opts: {
  name: string;
  creator?: string;
  desc?: string;
  segments: Array<Array<{ lat: number; lng: number; at: number; ele?: number }>>;
}) {
  const lines = opts.segments
    .filter((s) => s.length >= 2)
    .map((seg) => {
      const coords = seg
        .map((p) => {
          const ele = p.ele != null && Number.isFinite(p.ele) ? p.ele.toFixed(1) : "0";
          return `${p.lng.toFixed(7)},${p.lat.toFixed(7)},${ele}`;
        })
        .join("\n            ");
      return `        <LineString>
          <tessellate>1</tessellate>
          <altitudeMode>clampToGround</altitudeMode>
          <coordinates>
            ${coords}
          </coordinates>
        </LineString>`;
    })
    .join("\n");
  const name = xmlEsc(opts.name);
  const desc = xmlEsc([opts.desc, opts.creator].filter(Boolean).join(" · "));
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${name}</name>
    <Style id="track">
      <LineStyle>
        <color>ff2f7d3a</color>
        <width>4</width>
      </LineStyle>
    </Style>
    <Placemark>
      <name>${name}</name>
      <description>${desc}</description>
      <styleUrl>#track</styleUrl>
      <MultiGeometry>
${lines}
      </MultiGeometry>
    </Placemark>
  </Document>
</kml>
`;
}

export function gpsWgsLabel(lat: number, lng: number, accuracyM?: number) {
  const core = `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`;
  if (accuracyM && accuracyM > 0) return `${core} · ±${nf0.format(accuracyM)} m`;
  return core;
}

export function gpsXyLabel(x: number, y: number) {
  return `X: ${Math.round(x)}; Y: ${Math.round(y)}`;
}

export function isGpsVerified(plot: { gpsAt?: string; gpsLat?: number; gpsLng?: number }) {
  return Boolean(plot.gpsAt && plot.gpsLat && plot.gpsLng);
}
