import { applyScreenshotBlock, useSecurity } from "@/lib/security";
import { ensureAppFolder } from "@/lib/app-folder";
import { bootUpdateOnce, reloadIfStaleChunk } from "@/lib/update-boot";
import { useOps } from "@/lib/ops";
import { usePlots } from "@/lib/store";
import { useCustomSpecies } from "@/lib/custom-species";
import { useVn2000 } from "@/lib/gps";
import { useTracks } from "@/lib/tracks";

let started = false;
let ready = false;
let inflight = false;
const waiters: Array<() => void> = [];

function notify() {
  ready = true;
  for (const fn of waiters.splice(0)) fn();
}

function readState(key: string) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
    return parsed?.state ?? null;
  } catch {
    return null;
  }
}

/** WebView Android đôi khi trả localStorage trống lúc import — đọc lại sau khi hydrate. */
function recover() {
  const ops = readState("rung-ops-v1") as {
    projects?: unknown[];
    survivals?: unknown[];
    trees?: unknown[];
  } | null;
  if (ops && Array.isArray(ops.projects) && ops.projects.length && useOps.getState().projects.length === 0) {
    useOps.setState({
      projects: ops.projects as never,
      survivals: (ops.survivals as never) ?? useOps.getState().survivals,
      trees: (ops.trees as never) ?? useOps.getState().trees,
    });
  }
  const plots = readState("rung-plots-v1") as { plots?: unknown[] } | null;
  if (plots && Array.isArray(plots.plots) && plots.plots.length && usePlots.getState().plots.length === 0) {
    usePlots.setState({ plots: plots.plots as never });
  }
  const species = readState("rung-species-v1") as { items?: unknown[]; renames?: Record<string, string> } | null;
  if (species && Array.isArray(species.items) && species.items.length && useCustomSpecies.getState().items.length === 0) {
    useCustomSpecies.setState({
      items: species.items as never,
      renames: species.renames ?? useCustomSpecies.getState().renames,
    });
  }
  const tracks = readState("rung-tracks-v1") as { tracks?: unknown[]; draft?: unknown } | null;
  if (tracks && Array.isArray(tracks.tracks) && useTracks.getState().tracks.length === 0) {
    useTracks.setState({
      tracks: (tracks.tracks as never) ?? [],
      draft: (tracks.draft as never) ?? useTracks.getState().draft,
    });
  }
}

async function rehydrateAll() {
  if (ready || inflight) return;
  inflight = true;
  try {
    await Promise.all([
      Promise.resolve(useOps.persist.rehydrate()),
      Promise.resolve(usePlots.persist.rehydrate()),
      Promise.resolve(useCustomSpecies.persist.rehydrate()),
      Promise.resolve(useVn2000.persist.rehydrate()),
      Promise.resolve(useTracks.persist.rehydrate()),
      Promise.resolve(useSecurity.persist.rehydrate()),
    ]);
    applyScreenshotBlock(useSecurity.getState().screenshotBlock);
    recover();
  } catch {
    recover();
  } finally {
    notify();
    inflight = false;
  }
}

/** Gọi một lần trên client — đợi cửa sổ sẵn sàng rồi đọc localStorage. */
export function bootPersist() {
  if (started || typeof window === "undefined") return;
  started = true;
  bootUpdateOnce();
  window.addEventListener("unhandledrejection", (e) => {
    if (reloadIfStaleChunk(e.reason)) e.preventDefault();
  });
  window.setTimeout(() => ensureAppFolder(), 0);
  const kick = () => {
    void rehydrateAll();
  };
  if (document.readyState === "complete") {
    window.setTimeout(kick, 0);
  } else {
    window.addEventListener("load", kick, { once: true });
    window.setTimeout(kick, 500);
  }
}

export function persistReady() {
  return ready;
}

export function onPersistReady(fn: () => void) {
  if (ready) fn();
  else waiters.push(fn);
  return () => {
    const i = waiters.indexOf(fn);
    if (i >= 0) waiters.splice(i, 1);
  };
}
