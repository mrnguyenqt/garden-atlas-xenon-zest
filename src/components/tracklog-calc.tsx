import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { haversineM, pathLengthM, type GpsFix } from "@/lib/gps";
import { nativeTrack, onNativeFix, parseNativeFixes, type NativeFix } from "@/lib/track-native";
import { formatTrackElapsed, formatTrackLen, trackTitle, useTracks, useTracksHydrated } from "@/lib/tracks";
import { nf0, nf1 } from "@/lib/utils";

const TRACK_MIN_STEP_M = 2;
const TRACK_MAX_ACC_M = 30;

type TrackPt = { lat: number; lng: number; acc: number; at: number; ele?: number };

function Result({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md bg-bg-subtle p-4">
      <p className="text-xs text-muted">{k}</p>
      <p className="mt-1 text-lg font-medium tabular-nums">{v}</p>
    </div>
  );
}

export function TracklogCalc() {
  const hydrated = useTracksHydrated();
  const addTrack = useTracks((s) => s.addTrack);
  const draft = useTracks((s) => s.draft);
  const saveDraft = useTracks((s) => s.saveDraft);
  const clearDraft = useTracks((s) => s.clearDraft);
  const [phase, setPhase] = useState<"idle" | "run" | "pause" | "done">("idle");
  const [segs, setSegs] = useState<TrackPt[][]>([[]]);
  const [live, setLive] = useState<GpsFix | null>(null);
  const [now, setNow] = useState(0);
  const [sessionStart, setSessionStart] = useState(0);
  const [pausedTotal, setPausedTotal] = useState(0);
  const [pauseAt, setPauseAt] = useState(0);
  const [note, setNote] = useState("");
  const watchRef = useRef<number | null>(null);
  const nativeOn = useRef(false);
  const restored = useRef(false);

  const pts = useMemo(() => segs.flat(), [segs]);
  const lengthM = useMemo(() => pathLengthM(pts), [pts]);
  const running = phase === "run";

  function pushFix(fix: GpsFix, ele?: number) {
    setLive(fix);
    if (fix.accuracyM > TRACK_MAX_ACC_M) return;
    setSegs((cur) => {
      const next = cur.length ? cur.slice() : [[]];
      const lastSeg = next[next.length - 1] ?? [];
      const last = lastSeg[lastSeg.length - 1];
      if (last && haversineM(last, fix) < TRACK_MIN_STEP_M) return cur;
      next[next.length - 1] = [
        ...lastSeg,
        { lat: fix.lat, lng: fix.lng, acc: fix.accuracyM, at: Date.now(), ele },
      ];
      return next;
    });
  }

  function fromNative(fix: NativeFix) {
    pushFix(
      { lat: fix.lat, lng: fix.lng, accuracyM: fix.acc || 0, x: 0, y: 0, at: new Date(fix.at || Date.now()).toISOString() },
      fix.ele,
    );
  }

  function drainNative() {
    const b = nativeTrack();
    if (!b) return;
    for (const fix of parseNativeFixes(b.drain())) fromNative(fix);
  }

  function stopWatch() {
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (nativeOn.current) {
      try {
        nativeTrack()?.stop();
      } catch {
        /* ignore */
      }
      nativeOn.current = false;
    }
  }

  function listenGps() {
    setNote("");
    const b = nativeTrack();
    if (b) {
      try {
        if (b.start() === "ok") nativeOn.current = true;
      } catch {
        nativeOn.current = false;
      }
    }
    if (!navigator.geolocation) {
      if (!nativeOn.current) {
        setNote("Máy không hỗ trợ GPS.");
        return false;
      }
      return true;
    }
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) =>
        pushFix(
          {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracyM: pos.coords.accuracy,
            x: 0,
            y: 0,
            at: new Date().toISOString(),
          },
          Number.isFinite(pos.coords.altitude) ? pos.coords.altitude ?? undefined : undefined,
        ),
      (err) => {
        if (err.code === 1) {
          setNote("Chưa cho phép vị trí. Bật GPS rồi thử lại.");
          setPhase("pause");
          stopWatch();
          return;
        }
        setNote("Tín hiệu GPS yếu. Giữ máy, có thể khóa màn hình — ứng dụng vẫn ghi.");
      },
      { enableHighAccuracy: true, maximumAge: 2000 },
    );
    watchRef.current = id;
    return true;
  }

  function begin() {
    if (!listenGps()) return;
    setSegs([[]]);
    setLive(null);
    setPausedTotal(0);
    setPauseAt(0);
    setSessionStart(Date.now());
    setNow(Date.now());
    setPhase("run");
  }

  function pause() {
    drainNative();
    stopWatch();
    const t = Date.now();
    setPauseAt(t);
    setNow(t);
    setPhase("pause");
  }

  function resume() {
    if (!listenGps()) return;
    setPausedTotal((n) => n + (Date.now() - (pauseAt || Date.now())));
    setPauseAt(0);
    setSegs((cur) => [...cur.filter((s) => s.length), []]);
    setNow(Date.now());
    setPhase("run");
  }

  function end() {
    drainNative();
    stopWatch();
    const t = Date.now();
    setNow(t);
    setPauseAt((p) => p || t);
    const clock = pauseAt || t;
    const dur = sessionStart ? Math.max(0, clock - sessionStart - pausedTotal) : 0;
    const savedPts = segs.flat();
    if (savedPts.length >= 1) {
      const createdAt = new Date(sessionStart || t).toISOString();
      addTrack({
        name: trackTitle(createdAt),
        createdAt,
        lengthM,
        durationMs: dur,
        points: savedPts.length,
        segments: segs.map((seg) => seg.map(({ lat, lng, at, ele }) => ({ lat, lng, at, ele }))),
      });
    }
    clearDraft();
    setPhase("done");
  }

  useEffect(() => {
    if (!hydrated || restored.current) return;
    restored.current = true;
    if (!draft) return;
    setSegs(draft.segs.length ? draft.segs : [[]]);
    setSessionStart(draft.sessionStart);
    setPausedTotal(draft.pausedTotal);
    setPauseAt(draft.pauseAt);
    setNow(Date.now());
    setPhase(draft.phase);
    if (draft.phase === "run") listenGps();
  }, [hydrated]);

  useEffect(() => {
    if (phase === "run" || phase === "pause") {
      saveDraft({
        segs: segs.map((seg) => seg.map(({ lat, lng, at, ele }) => ({ lat, lng, at, ele }))),
        sessionStart,
        pausedTotal,
        pauseAt,
        phase,
      });
    }
  }, [phase, segs, sessionStart, pausedTotal, pauseAt, saveDraft]);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [running]);

  useEffect(() => onNativeFix(fromNative), []);

  useEffect(() => {
    if (!running) return;
    const kick = () => {
      if (document.visibilityState !== "visible") return;
      drainNative();
      listenGps();
    };
    document.addEventListener("visibilitychange", kick);
    window.addEventListener("focus", kick);
    window.addEventListener("pageshow", kick);
    return () => {
      document.removeEventListener("visibilitychange", kick);
      window.removeEventListener("focus", kick);
      window.removeEventListener("pageshow", kick);
    };
  }, [running]);

  useEffect(() => () => stopWatch(), []);

  const clock = running ? now : pauseAt || now;
  const elapsed = sessionStart ? Math.max(0, clock - sessionStart - pausedTotal) : 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">Bật GPS rồi Bắt đầu. Có thể khóa màn hình — ứng dụng vẫn ghi đường đi.</p>
      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          onClick={begin}
          disabled={phase === "run" || phase === "pause"}
          className="bg-ok text-white hover:bg-ok/90"
        >
          Bắt đầu
        </Button>
        <Button
          type="button"
          disabled={phase === "idle" || phase === "done"}
          onClick={() => (phase === "run" ? pause() : resume())}
          className={
            phase === "pause"
              ? "bg-ok text-white hover:bg-ok/90"
              : "bg-[#c9892e] text-white hover:bg-[#b57b28]"
          }
        >
          {phase === "pause" ? "Tiếp tục" : "Tạm dừng"}
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={end}
          disabled={phase === "idle" || phase === "done"}
          className="text-white"
        >
          Kết thúc
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Result k="Chiều dài" v={formatTrackLen(lengthM)} />
        <Result k="Thời gian" v={sessionStart ? formatTrackElapsed(elapsed) : "0:00"} />
        <Result k="Số điểm" v={String(pts.length)} />
        <Result k="Sai số GPS" v={live ? `±${nf0.format(live.accuracyM)} m` : "—"} />
      </div>
      {phase === "run" ? (
        <p className="text-xs text-ok">Đang ghi… khóa màn hình được, GPS vẫn chạy.</p>
      ) : null}
      {phase === "pause" ? <p className="text-xs text-muted">Đã tạm dừng. Ấn Tiếp tục để ghi đoạn mới.</p> : null}
      {phase === "done" && pts.length > 1 ? (
        <p className="text-sm tabular-nums">Chiều dài tuyến: {nf1.format(lengthM)} m ({formatTrackLen(lengthM)}). Đã lưu vào Thư viện.</p>
      ) : null}
      {note ? <p className="text-sm text-danger">{note}</p> : null}
      <p className="text-xs text-subtle">Bỏ điểm lệch quá 30 m hoặc bước dưới 2 m. Nếu tắt hẳn app giữa đường, mở lại mục Tracklog để ghi tiếp bản nháp.</p>
    </div>
  );
}
