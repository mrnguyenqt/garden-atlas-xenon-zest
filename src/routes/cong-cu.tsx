import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  COMMON_SPACINGS,
  LOG_FORMULA,
  PI_VOL,
  plantingDensity,
  roundVolumeM3,
  STAND_STATUS,
  standFormFactor,
  treeBasalAreaM2,
  treeVolumeM3,
  logVolumeM3,
  VOLUME_FORMULA,
} from "@/lib/forestry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Select } from "@/components/ui/field";
import { LogPad, MeasurePad, CoordPad } from "@/components/num-pad";
import { googleMapsUrl, formatMapsLatLng, getVn2000Zone, parseMapsLatLng, useVn2000, VN2000_ZONES, vn2000ToWgs84, wgs84ToVn2000, zoneLabel } from "@/lib/gps";
import { LocationSelect } from "@/components/location-select";
import { parseLocationParts } from "@/lib/site";
import { communeByTieuKhu, communeFull, lotInfoRows } from "@/lib/lot-info";
import { lotProjectRows } from "@/lib/lot-projects";
import { cn, nf0, nf1, nf2, nf3 } from "@/lib/utils";

export const Route = createFileRoute("/cong-cu")({ component: ToolsPage });

const TABS = [
  { id: "volume", label: "Thể tích cây" },
  { id: "log", label: "Gỗ khúc" },
  { id: "density", label: "Mật độ trồng" },
  { id: "maps", label: "Chuyển đổi toạ độ" },
  { id: "lot", label: "Tra cứu lô rừng" },
] as const;

function ToolsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("volume");

  return (
    <div className="mx-auto max-w-content px-5 pt-3 pb-8 md:px-10 md:pt-8 md:pb-12">
      <h1 className="font-display text-center text-4xl italic">Công cụ</h1>
      <p className="mt-2 text-center text-xs tracking-[0.2em] text-muted uppercase">Máy tính hiện trường</p>

      <div className="mx-auto mt-8 max-w-prose">
        <Field label="Chọn công cụ" htmlFor="tool-kind">
          <Select
            id="tool-kind"
            value={tab}
            onChange={(e) => setTab(e.target.value as (typeof TABS)[number]["id"])}
          >
            {TABS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mx-auto mt-6 max-w-prose rounded-xl bg-bg-elevated p-5 shadow-(--shadow-border) md:p-6">
        {tab === "volume" ? <VolumeCalc /> : null}
        {tab === "log" ? <LogCalc /> : null}
        {tab === "density" ? <DensityCalc /> : null}
        {tab === "maps" ? <MapsCalc /> : null}
        {tab === "lot" ? <LotLookup /> : null}
      </div>
    </div>
  );
}

function VolumeCalc() {
  const [stand, setStand] = useState("Rừng trồng");
  const [circ, setCirc] = useState("88");
  const [h, setH] = useState("20");
  const form = standFormFactor(stand);

  const result = useMemo(() => {
    const circCm = Number(circ);
    const heightM = Number(h);
    if (!(circCm > 0) || !(heightM > 0)) return null;
    const cM = circCm / 100;
    const g = treeBasalAreaM2(circCm);
    const v = treeVolumeM3(circCm, heightM, form);
    return { cM, g, v, form, lo: roundVolumeM3(v * 0.9), hi: roundVolumeM3(v * 1.1) };
  }, [circ, h, form]);

  return (
    <div className="flex flex-col gap-4">
      <Field label="Trạng thái rừng" htmlFor="v-stand">
        <Select id="v-stand" value={stand} onChange={(e) => setStand(e.target.value)}>
          {STAND_STATUS.filter((s) => s !== "Diện tích chưa có rừng").map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
      <MeasurePad dbhId="v-d" heightId="v-h" dbh={circ} height={h} onDbh={setCirc} onHeight={setH} />
      {result ? (
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Result k="C₁.₃" v={`${nf2.format(result.cM)} m`} />
          <Result k="g = C² / 4π" v={`${nf3.format(result.g)} m²`} />
          <Result k="Hvn" v={`${nf1.format(Number(h))} m`} />
          <Result k="f — hình số thân" v={nf2.format(result.form)} />
          <Result k="V — thể tích" v={`${nf3.format(result.v)} m³`} />
          <Result k="Sai số ±10%" v={`${nf3.format(result.lo)} – ${nf3.format(result.hi)} m³`} />
        </div>
      ) : null}
      {result ? (
        <p className="text-sm tabular-nums">
          V = ({nf2.format(result.cM)}² / (4 × {nf2.format(PI_VOL)})) × {nf1.format(Number(h))} × {nf2.format(result.form)} = {nf3.format(result.v)} m³
        </p>
      ) : null}
      <p className="text-xs text-subtle">{VOLUME_FORMULA}</p>
    </div>
  );
}

function LogCalc() {
  const [d1, setD1] = useState("32");
  const [d2, setD2] = useState("28");
  const [length, setLength] = useState("4");

  const result = useMemo(() => {
    const a = Number(d1);
    const b = Number(d2);
    const l = Number(length);
    if (!(a > 0) || !(b > 0) || !(l > 0)) return null;
    const d1M = a / 100;
    const d2M = b / 100;
    const mid = (d1M + d2M) / 4;
    const v = logVolumeM3(a, b, l);
    return { d1M, d2M, mid, l, v };
  }, [d1, d2, length]);

  return (
    <div className="flex flex-col gap-4">
      <LogPad d1={d1} d2={d2} length={length} onD1={setD1} onD2={setD2} onLength={setLength} />
      {result ? (
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Result k="d1" v={`${nf2.format(result.d1M)} m`} />
          <Result k="d2" v={`${nf2.format(result.d2M)} m`} />
          <Result k="L" v={`${nf1.format(result.l)} m`} />
          <Result k="V — thể tích" v={`${nf3.format(result.v)} m³`} />
        </div>
      ) : null}
      {result ? (
        <p className="text-sm tabular-nums">
          V = {nf2.format(PI_VOL)} × (({nf2.format(result.d1M)} + {nf2.format(result.d2M)}) / 4)² × {nf1.format(result.l)} = {nf3.format(result.v)} m³
        </p>
      ) : null}
      <p className="text-xs text-subtle">{LOG_FORMULA}</p>
    </div>
  );
}

function DensityCalc() {
  const [row, setRow] = useState("3");
  const [tree, setTree] = useState("2");
  const n = plantingDensity(Number(row), Number(tree));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cự ly hàng (m)" htmlFor="d-row">
          <Input id="d-row" type="number" step={0.1} value={row} onChange={(e) => setRow(e.target.value)} />
        </Field>
        <Field label="Cự ly cây (m)" htmlFor="d-tree">
          <Input id="d-tree" type="number" step={0.1} value={tree} onChange={(e) => setTree(e.target.value)} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        {COMMON_SPACINGS.map((s) => (
          <Button
            key={s.label}
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              setRow(String(s.row));
              setTree(String(s.tree));
            }}
          >
            {s.label}
          </Button>
        ))}
      </div>
      <Result k="Mật độ trồng" v={`${nf0.format(n)} cây/ha`} />
      <p className="text-xs text-subtle">N = 10.000 / (hàng × cây). Keo dăm thường 3×2 m; gỗ lớn thưa hơn.</p>
    </div>
  );
}

function MapsCalc() {
  const [dir, setDir] = useState<"to-maps" | "to-vn">("to-maps");
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [latLng, setLatLng] = useState("");
  const [clipNote, setClipNote] = useState("");
  const zoneId = useVn2000((s) => s.zoneId);
  const zone = getVn2000Zone(zoneId);

  const toMaps = useMemo(() => {
    const east = Number(x);
    const north = Number(y);
    if (!(east > 0) || !(north > 0)) return null;
    const wgs = vn2000ToWgs84(east, north, zone.lon);
    if (!Number.isFinite(wgs.lat) || !Number.isFinite(wgs.lng)) return null;
    if (Math.abs(wgs.lat) > 90 || Math.abs(wgs.lng) > 180) return null;
    return { ...wgs, url: googleMapsUrl(wgs.lat, wgs.lng) };
  }, [x, y, zone.lon]);

  const toVn = useMemo(() => {
    const pair = parseMapsLatLng(latLng);
    if (!pair) return null;
    const { x: east, y: north } = wgs84ToVn2000(pair.lat, pair.lng, zone.lon);
    return { x: east, y: north, lat: pair.lat, lng: pair.lng };
  }, [latLng, zone.lon]);

  async function pasteLatLng() {
    setClipNote("");
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) {
        setClipNote("Clipboard trống. Dán tay vào ô.");
        return;
      }
      setLatLng(text.replace(/\s+/g, ""));
    } catch {
      setClipNote("Không đọc được clipboard. Giữ ô nhập rồi chọn Dán.");
    }
  }

  async function copyText(text: string) {
    setClipNote("");
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setClipNote("Đã sao chép.");
    } catch {
      setClipNote("Không sao chép được. Giữ ô nhập rồi chọn Copy.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Vn2000ZoneCard />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setDir("to-maps")}
          className={cn(
            "h-11 rounded-full px-3 text-sm font-medium",
            dir === "to-maps" ? "bg-primary text-primary-fg" : "bg-bg-subtle text-muted",
          )}
        >
          VN-2000 → Maps
        </button>
        <button
          type="button"
          onClick={() => setDir("to-vn")}
          className={cn(
            "h-11 rounded-full px-3 text-sm font-medium",
            dir === "to-vn" ? "bg-primary text-primary-fg" : "bg-bg-subtle text-muted",
          )}
        >
          Maps → VN-2000
        </button>
      </div>

      {dir === "to-maps" ? (
        <>
          <p className="text-sm text-muted">Nhập X(E), Y(N) theo kinh tuyến trục đã chọn. Ấn giữ ô để dán.</p>
          <CoordPad x={x} y={y} onX={setX} onY={setY} />
          {toMaps ? (
            <>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Result k="Vĩ độ" v={`${toMaps.lat.toFixed(6)}°`} />
                <Result k="Kinh độ" v={`${toMaps.lng.toFixed(6)}°`} />
              </div>
              <p className="text-sm tabular-nums">{formatMapsLatLng(toMaps.lat, toMaps.lng)}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="secondary" onClick={() => copyText(formatMapsLatLng(toMaps.lat, toMaps.lng))}>
                  Sao chép
                </Button>
                <Button asChild>
                  <a href={toMaps.url} target="_blank" rel="noopener noreferrer">
                    Xem trên Google Maps
                  </a>
                </Button>
              </div>
              {clipNote ? <p className="text-xs text-muted">{clipNote}</p> : null}
            </>
          ) : (
            <p className="text-xs text-subtle">X, Y số nguyên — không dùng dấu chấm.</p>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-muted">Dán toạ độ Maps dạng 16.709143,107.263080.</p>
          <Field label="Vĩ độ, kinh độ" htmlFor="maps-latlng">
            <Input
              id="maps-latlng"
              value={latLng}
              onChange={(e) => setLatLng(e.target.value)}
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="16.709143,107.263080"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="secondary" onClick={pasteLatLng}>
              Dán
            </Button>
            <Button type="button" variant="secondary" onClick={() => copyText(latLng.trim())} disabled={!latLng.trim()}>
              Sao chép
            </Button>
          </div>
          {clipNote ? <p className="text-xs text-muted">{clipNote}</p> : null}
          {toVn ? (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Result k="Toạ độ X" v={String(toVn.x)} />
              <Result k="Toạ độ Y" v={String(toVn.y)} />
            </div>
          ) : (
            <p className="text-xs text-subtle">Ví dụ 16.709143,107.263080 — có thể dán từ Google Maps.</p>
          )}
        </>
      )}
    </div>
  );
}

function Vn2000ZoneCard() {
  const zoneId = useVn2000((s) => s.zoneId);
  const setZoneId = useVn2000((s) => s.setZoneId);
  const zone = getVn2000Zone(zoneId);

  return (
    <div className="rounded-xl bg-bg-subtle/60 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-ok">
          <span className="size-2.5 rounded-full bg-ok" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">VN-2000 — múi 3°</p>
          <p className="mt-0.5 text-sm text-muted">X(E)/Y(N) theo kinh tuyến trục của tỉnh</p>
          <div className="mt-3 flex h-12 min-w-0 items-center gap-2 rounded-full bg-bg-elevated pl-4 shadow-(--shadow-border)">
            <span className="shrink-0 text-sm text-muted">Kinh tuyến trục</span>
            <Select
              id="vn2000-zone"
              value={zone.id}
              onChange={(e) => setZoneId(e.target.value)}
              className="h-12 min-w-0 flex-1 bg-transparent px-3 font-medium shadow-none"
            >
              {VN2000_ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {zoneLabel(z)}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

function LotLookup() {
  const [view, setView] = useState<"status" | "detail">("status");
  const [place, setPlace] = useState("");
  const parts = parseLocationParts(place);
  const ready = Boolean(parts.tieuKhu && parts.khoanh && parts.lo);
  const rows = ready ? lotInfoRows(parts.tieuKhu, parts.khoanh, parts.lo) : [];
  const projects = ready ? lotProjectRows(parts.tieuKhu, parts.khoanh, parts.lo) : [];
  const xa = communeByTieuKhu(parts.tieuKhu);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setView("status")}
          className={cn(
            "h-11 rounded-full px-3 text-sm font-medium",
            view === "status" ? "bg-primary text-primary-fg" : "bg-bg-subtle text-muted",
          )}
        >
          Hiện trạng
        </button>
        <button
          type="button"
          onClick={() => setView("detail")}
          className={cn(
            "h-11 rounded-full px-3 text-sm font-medium",
            view === "detail" ? "bg-primary text-primary-fg" : "bg-bg-subtle text-muted",
          )}
        >
          Lô chi tiết
        </button>
      </div>
      <LocationSelect
        id="lot-lookup"
        value={place}
        onChange={setPlace}
        kind={view === "detail" ? "project" : "status"}
      />
      {!ready ? (
        <p className="text-sm text-muted">Chọn tiểu khu, khoảnh và lô.</p>
      ) : view === "status" ? (
        rows.length === 0 ? (
          <p className="text-sm text-muted">Không có trong sổ hiện trạng.</p>
        ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row, i) => {
            const [xa, dt, ldlr, nam, mdsd] = row;
            return (
              <div key={`st-${parts.tieuKhu}-${parts.khoanh}-${parts.lo}-${i}`} className="flex flex-col gap-2">
                {rows.length > 1 ? <p className="text-xs text-muted">Phần {i + 1}</p> : null}
                <Fact k="Xã / phường" v={communeFull(xa) || "—"} />
                <Fact k="Diện tích" v={`${nf2.format(dt)} ha`} />
                <Fact k="LDLR" v={ldlr || "—"} />
                <Fact k="Năm trồng" v={nam ? String(nam) : "—"} />
                <Fact k="MDSD" v={mdsd || "—"} />
              </div>
            );
          })}
          <Fact k="Ghi chú" v="Các lô thuộc bản đồ hiện trạng rừng năm 2025" wrap />
        </div>
        )
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted">Không có trong sổ thiết kế.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {xa ? <Fact k="Xã / phường" v={xa} /> : null}
          {projects.map((row) => {
            const [dt, loai, nam, duAn] = row;
            return (
              <div key={`pj-${parts.tieuKhu}-${parts.khoanh}-${parts.lo}`} className="flex flex-col gap-2">
                <Fact k="DT thiết kế" v={`${nf2.format(dt)} ha`} />
                <Fact k="Loài cây" v={loai || "—"} />
                <Fact k="Năm trồng" v={nam ? String(nam) : "—"} />
                <Fact k="Dự án" v={duAn || "—"} />
              </div>
            );
          })}
          <Fact k="Ghi chú" v="Số liệu chỉ mang tính chất tham khảo" wrap />
        </div>
      )}
    </div>
  );
}

function Fact({ k, v, wrap }: { k: string; v: string; wrap?: boolean }) {
  return (
    <div className="flex min-h-11 items-start justify-between gap-3 rounded-md bg-bg-subtle px-4 py-3">
      <p className="shrink-0 text-sm text-muted">{k}</p>
      <p
        className={cn(
          "min-w-0 text-right text-sm font-medium",
          wrap ? "leading-snug" : "truncate whitespace-nowrap",
        )}
      >
        {v}
      </p>
    </div>
  );
}

function Result({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md bg-bg-subtle p-4">
      <p className="text-xs text-muted">{k}</p>
      <p className="mt-1 text-lg font-medium tabular-nums">{v}</p>
    </div>
  );
}
