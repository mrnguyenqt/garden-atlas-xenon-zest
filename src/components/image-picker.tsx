import { useRef, useState } from "react";
import { Camera, Paperclip, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fileToJpegDataUrl, rotateJpegDataUrl } from "@/lib/image-file";

export function ImagePicker({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");
  const [fromCamera, setFromCamera] = useState(false);

  async function onFile(file: File | undefined, camera: boolean) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      setFromCamera(camera);
      setPending(await fileToJpegDataUrl(file));
    } catch {
      setError("Không xử lý được ảnh. Thử chụp hoặc chọn lại.");
    } finally {
      setBusy(false);
    }
  }

  async function rotate(dir: 1 | -1) {
    const src = pending || value;
    if (!src || busy) return;
    setBusy(true);
    setError("");
    try {
      const next = await rotateJpegDataUrl(src, dir);
      if (pending) setPending(next);
      else onChange(next);
    } catch {
      setError("Không xoay được ảnh.");
    } finally {
      setBusy(false);
    }
  }

  function retake() {
    setPending("");
    setError("");
    window.setTimeout(() => {
      if (fromCamera) cameraRef.current?.click();
      else fileRef.current?.click();
    }, 0);
  }

  const preview = pending || value;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-muted">{label}</p>
      {preview ? (
        <img
          src={preview}
          alt={label}
          className="aspect-photo w-full rounded-sm object-cover bg-bg-subtle"
        />
      ) : (
        <div className="aspect-photo rounded-sm bg-bg-subtle" />
      )}
      {preview ? (
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void rotate(-1)}>
            <RotateCcw />
            Xoay trái
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void rotate(1)}>
            <RotateCw />
            Xoay phải
          </Button>
        </div>
      ) : null}
      {pending ? (
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            disabled={busy}
            onClick={() => {
              onChange(pending);
              setPending("");
            }}
          >
            Thêm ảnh
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={retake}>
            {fromCamera ? "Chụp lại" : "Chọn lại"}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => cameraRef.current?.click()}
            >
              <Camera />
              Chụp ảnh
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip />
              Đính kèm
            </Button>
          </div>
          {value ? (
            <button
              type="button"
              className="h-11 text-sm text-muted hover:text-fg"
              onClick={() => onChange("")}
            >
              Xóa ảnh
            </button>
          ) : null}
        </>
      )}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {busy ? <p className="text-sm text-muted">Đang xử lý ảnh…</p> : null}
      <input
        id={`${id}-cam`}
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          void onFile(e.target.files?.[0], true);
          e.target.value = "";
        }}
      />
      <input
        id={`${id}-file`}
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          void onFile(e.target.files?.[0], false);
          e.target.value = "";
        }}
      />
    </div>
  );
}
