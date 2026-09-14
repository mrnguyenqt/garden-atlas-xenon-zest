import { useEffect, useState } from "react";
import { FileDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FILE_READY_EVENT,
  clearPendingExportFile,
  getPendingExportFile,
  saveFileAs,
} from "@/lib/csv";

export function FileSaveBanner() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onReady(e: Event) {
      const fileName = (e as CustomEvent<{ name?: string }>).detail?.name ?? "";
      setName(fileName);
    }
    window.addEventListener(FILE_READY_EVENT, onReady);
    return () => window.removeEventListener(FILE_READY_EVENT, onReady);
  }, []);

  if (!name) return null;

  async function save() {
    const file = getPendingExportFile();
    if (!file) return;
    setBusy(true);
    try {
      const result = await saveFileAs(file);
      if (result !== "cancel") setName("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-x-0 z-[70] px-4"
      style={{ bottom: "calc(4.25rem + var(--sys-nav, 0px))" }}
    >
      <div className="mx-auto flex max-w-content items-center gap-2 rounded-xl bg-primary p-3 text-primary-fg shadow-(--shadow-border)">
        <Button
          type="button"
          className="min-w-0 flex-1 bg-primary-fg text-primary"
          disabled={busy}
          onClick={() => void save()}
        >
          <FileDown />
          {busy ? "Đang mở…" : `Lưu ${name}`}
        </Button>
        <button
          type="button"
          className="flex size-11 shrink-0 items-center justify-center rounded-sm text-primary-fg"
          aria-label="Đóng"
          onClick={() => {
            setName("");
            clearPendingExportFile();
          }}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
