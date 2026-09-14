import { APP_BUILD } from "@/lib/app-version";

const BUILD_KEY = "rungvang-build";
const RELOAD_KEY = "rungvang-build-reload";

function isStaleAssetError(error: unknown) {
  const m = error instanceof Error ? error.message : String(error ?? "");
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i.test(m);
}

/** Một lần sau khi cài APK mới — xóa cache giao diện, giữ số liệu. */
export function bootUpdateOnce() {
  if (typeof window === "undefined") return;
  try {
    const prev = localStorage.getItem(BUILD_KEY);
    if (prev === APP_BUILD) return;
    localStorage.setItem(BUILD_KEY, APP_BUILD);
    if (!prev) return;
    if (sessionStorage.getItem(RELOAD_KEY) === APP_BUILD) return;
    sessionStorage.setItem(RELOAD_KEY, APP_BUILD);
    void purgeAssetCache().finally(() => {
      location.reload();
    });
  } catch {
    /* ignore */
  }
}

export async function purgeAssetCache() {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
}

export function reloadIfStaleChunk(error: unknown) {
  if (typeof window === "undefined" || !isStaleAssetError(error)) return false;
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === APP_BUILD) return false;
    sessionStorage.setItem(RELOAD_KEY, APP_BUILD);
    localStorage.setItem(BUILD_KEY, APP_BUILD);
    void purgeAssetCache().finally(() => location.reload());
    return true;
  } catch {
    return false;
  }
}

export { isStaleAssetError };
