export type PermState = "granted" | "denied" | "prompt" | "unknown";
export type FieldPerms = { location: boolean; camera: boolean };
export type FieldPermStatus = { location: PermState; camera: PermState };

const ASKED_KEY = "rungvang-field-perm-asked";

export function fieldPermsAsked() {
  try {
    return localStorage.getItem(ASKED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markFieldPermsAsked() {
  try {
    localStorage.setItem(ASKED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isPhoneLike() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;
  return typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
}

/** Android 13 = API 33 — quyền Ảnh tách khỏi Bộ nhớ. */
export function isAndroid13Plus() {
  if (typeof navigator === "undefined") return false;
  const m = navigator.userAgent.match(/Android\s+(\d+)/i);
  return Boolean(m && Number(m[1]) >= 13);
}

export function needsFieldPermPrompt() {
  return isPhoneLike() && !fieldPermsAsked();
}

async function queryPerm(name: PermissionName): Promise<PermState> {
  try {
    const status = await navigator.permissions.query({ name } as PermissionDescriptor);
    return status.state;
  } catch {
    return "unknown";
  }
}

export async function queryFieldPerms(): Promise<FieldPermStatus> {
  const [location, camera] = await Promise.all([queryPerm("geolocation"), queryPerm("camera")]);
  return { location, camera };
}

export function permLabel(state: PermState) {
  if (state === "granted") return "Đã cấp";
  if (state === "denied") return "Bị từ chối";
  if (state === "prompt") return "Chưa hỏi";
  return "Chưa rõ";
}

export async function requestLocation(): Promise<boolean> {
  const now = await queryPerm("geolocation");
  if (now === "granted") return true;
  if (!navigator.geolocation) return false;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { enableHighAccuracy: true, timeout: 60000, maximumAge: 0 },
    );
  });
}

export async function requestCamera(): Promise<boolean> {
  const now = await queryPerm("camera");
  if (now === "granted") return true;
  const md = navigator.mediaDevices;
  if (!md?.getUserMedia) return false;
  try {
    const stream = await md.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
    for (const track of stream.getTracks()) track.stop();
    return true;
  } catch {
    return false;
  }
}

/** Xin từng quyền lần lượt — Android chỉ hiện một hộp runtime mỗi lúc. */
export async function requestFieldPermissions(): Promise<FieldPerms> {
  markFieldPermsAsked();
  const location = await requestLocation();
  const camera = await requestCamera();
  return { location, camera };
}
