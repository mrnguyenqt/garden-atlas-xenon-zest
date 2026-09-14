type FolderBridge = {
  ensure: () => string;
  rootPath: () => string;
  saveBase64: (folder: string, name: string, mime: string, b64: string) => string;
};

function bridge(): FolderBridge | null {
  if (typeof window === "undefined") return null;
  const b = (window as Window & { RungVangFolder?: FolderBridge }).RungVangFolder;
  if (!b || typeof b.ensure !== "function") return null;
  return b;
}

export function appFolderPath() {
  try {
    return bridge()?.rootPath() || "";
  } catch {
    return "";
  }
}

/** Tạo Pictures/RungVang và chép ảnh loài + icon lần đầu mở app. */
export function ensureAppFolder() {
  try {
    return bridge()?.ensure() || "";
  } catch {
    return "";
  }
}

async function blobToBase64(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    bin += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(bin);
}

export async function saveToAppFolder(folder: "anh-hien-truong" | "xuat" | "tracklog" | "icon", name: string, blob: Blob) {
  const native = bridge();
  if (!native) return "";
  try {
    const mime = blob.type || "application/octet-stream";
    return native.saveBase64(folder, name, mime, await blobToBase64(blob)) || "";
  } catch {
    return "";
  }
}
