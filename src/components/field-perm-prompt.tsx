import { useEffect, useState } from "react";
import { Camera, Image, MapPinned } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { needsFieldPermPrompt, markFieldPermsAsked, queryFieldPerms, requestFieldPermissions } from "@/lib/device-permissions";

export function FieldPermPrompt() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!needsFieldPermPrompt()) return;
    let alive = true;
    void queryFieldPerms().then((s) => {
      if (!alive) return;
      if (s.location === "granted" && s.camera === "granted") {
        markFieldPermsAsked();
        return;
      }
      setOpen(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  function close() {
    markFieldPermsAsked();
    setOpen(false);
  }

  async function allow() {
    setBusy(true);
    try {
      await requestFieldPermissions();
    } finally {
      setBusy(false);
      close();
    }
  }

  function later() {
    close();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent title="Xin cấp quyền truy cập">
        <p className="text-sm text-muted">
          Ứng dụng cần vị trí GPS và camera để lập ô, kiểm tra toạ độ và chụp ảnh hiện trường.
        </p>
        <ul className="mt-4 grid gap-2 text-sm">
          <li className="flex items-center gap-2">
            <MapPinned className="size-4 text-primary" />
            Vị trí · GPS độ chính xác cao
          </li>
          <li className="flex items-center gap-2">
            <Camera className="size-4 text-primary" />
            Camera sau
          </li>
          <li className="flex items-center gap-2">
            <Image className="size-4 text-primary" />
            Ảnh đã chọn (không truy cập cả máy)
          </li>
        </ul>
        <p className="mt-3 text-xs text-subtle">Bấm Cho phép, rồi đồng ý từng hộp khi điện thoại hỏi.</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={later} disabled={busy}>
            Để sau
          </Button>
          <Button type="button" onClick={() => void allow()} disabled={busy}>
            {busy ? "Đang mở…" : "Cho phép"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
