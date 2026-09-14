const ASPECT = 4 / 3;
const MAX_W = 1280;
const QUALITY = 0.76;

export async function fileToJpegDataUrl(file: File) {
  const upright = await uprightCanvas(file);
  return cropToJpeg(upright, 0);
}

export async function rotateJpegDataUrl(dataUrl: string, quarterTurns: number) {
  const canvas = await canvasFromUrl(dataUrl);
  return cropToJpeg(canvas, quarterTurns);
}

async function uprightCanvas(file: File) {
  const buf = await file.arrayBuffer();
  const orient = jpegOrientation(buf);
  const bitmap = await decodeBitmap(file);
  const sof = jpegSize(buf);
  const skipExif =
    sof &&
    orient >= 5 &&
    bitmap.width === sof.height &&
    bitmap.height === sof.width;
  const applied = skipExif ? 1 : orient;
  const swap = applied >= 5;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? bitmap.height : bitmap.width;
  canvas.height = swap ? bitmap.width : bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("canvas");
  }
  applyExif(ctx, bitmap.width, bitmap.height, applied);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvas;
}

function cropToJpeg(source: HTMLCanvasElement, quarterTurns: number) {
  const turns = ((quarterTurns % 4) + 4) % 4;
  const rotated = turns ? rotateCanvas(source, turns) : source;
  const cropped = coverCrop(rotated, ASPECT, MAX_W);
  return canvasToJpeg(cropped, QUALITY);
}

function rotateCanvas(source: HTMLCanvasElement, quarterTurns: number) {
  const canvas = document.createElement("canvas");
  const cw = quarterTurns % 2 === 1 ? source.height : source.width;
  const ch = quarterTurns % 2 === 1 ? source.width : source.height;
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.translate(cw / 2, ch / 2);
  ctx.rotate((quarterTurns * Math.PI) / 2);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  return canvas;
}

function coverCrop(source: HTMLCanvasElement, aspect: number, maxW: number) {
  const sw = source.width;
  const sh = source.height;
  const srcAspect = sw / sh;
  let sx = 0;
  let sy = 0;
  let cw = sw;
  let ch = sh;
  if (srcAspect > aspect) {
    cw = sh * aspect;
    sx = (sw - cw) / 2;
  } else {
    ch = sw / aspect;
    sy = (sh - ch) / 2;
  }
  const scale = Math.min(1, maxW / cw);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(cw * scale));
  canvas.height = Math.max(1, Math.round(ch * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, sx, sy, cw, ch, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return canvas.toDataURL("image/jpeg", quality);
}

async function decodeBitmap(file: Blob) {
  try {
    return await createImageBitmap(file);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImg(url);
      return await createImageBitmap(img);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

async function canvasFromUrl(src: string) {
  const img = await loadImg(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(img, 0, 0);
  return canvas;
}

function loadImg(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

function applyExif(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  orient: number,
) {
  switch (orient) {
    case 2:
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      break;
    case 3:
      ctx.translate(w, h);
      ctx.rotate(Math.PI);
      break;
    case 4:
      ctx.translate(0, h);
      ctx.scale(1, -1);
      break;
    case 5:
      ctx.rotate(0.5 * Math.PI);
      ctx.scale(1, -1);
      break;
    case 6:
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(0, -h);
      break;
    case 7:
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(w, -h);
      ctx.scale(-1, 1);
      break;
    case 8:
      ctx.rotate(-0.5 * Math.PI);
      ctx.translate(-w, 0);
      break;
    default:
      break;
  }
}

function jpegOrientation(buf: ArrayBuffer) {
  const view = new DataView(buf);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return 1;
  let offset = 2;
  while (offset + 4 < view.byteLength) {
    const marker = view.getUint16(offset);
    offset += 2;
    if ((marker & 0xff00) !== 0xff00) break;
    if (marker === 0xffda) break;
    const size = view.getUint16(offset);
    if (size < 2) break;
    if (marker === 0xffe1 && size >= 8) {
      const start = offset + 2;
      if (view.getUint32(start) === 0x45786966 && view.getUint16(start + 4) === 0) {
        return readTiffOrientation(view, start + 6) || 1;
      }
    }
    offset += size;
  }
  return 1;
}

function readTiffOrientation(view: DataView, tiff: number) {
  if (tiff + 8 > view.byteLength) return 1;
  const endian = view.getUint16(tiff);
  const little = endian === 0x4949;
  if (!little && endian !== 0x4d4d) return 1;
  const get16 = (o: number) => view.getUint16(o, little);
  const get32 = (o: number) => view.getUint32(o, little);
  if (get16(tiff + 2) !== 42) return 1;
  const ifd0 = tiff + get32(tiff + 4);
  if (ifd0 + 2 > view.byteLength) return 1;
  const entries = get16(ifd0);
  for (let i = 0; i < entries; i++) {
    const e = ifd0 + 2 + i * 12;
    if (e + 12 > view.byteLength) break;
    if (get16(e) === 0x0112) return get16(e + 8);
  }
  return 1;
}

function jpegSize(buf: ArrayBuffer) {
  const view = new DataView(buf);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 8 < view.byteLength) {
    const marker = view.getUint16(offset);
    offset += 2;
    if ((marker & 0xff00) !== 0xff00) break;
    const size = view.getUint16(offset);
    if (size < 2) break;
    if (marker === 0xffc0 || marker === 0xffc2) {
      return { height: view.getUint16(offset + 3), width: view.getUint16(offset + 5) };
    }
    offset += size;
  }
  return null;
}
