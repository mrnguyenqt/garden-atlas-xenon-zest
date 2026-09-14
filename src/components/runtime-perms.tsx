import { useEffect, useState } from "react";
import { Camera, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  permLabel,
  queryFieldPerms,
  requestFieldPermissions,
  type FieldPermStatus,
  type PermState,
} from "@/lib/device-permissions";
import { cn } from "@/lib/utils";

export function RuntimePerms() {
  const [status, setStatus] = useState<FieldPermStatus | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setStatus(await queryFieldPerms());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function ask() {
    setBusy(true);
    try {
      await requestFieldPermissions();
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const denied = status?.location === "denied" || status?.camera === "denied";

  return (
    <div className="mx-auto mt-6 max-w-xl rounded-xl bg-bg-elevated p-5 shadow-(--shadow-border)">
      <p className="font-medium">Xin cấp quyền truy cập</p>
      <p className="mt-1 text-sm text-muted">
        Ứng dụng cần vị trí GPS và camera để lập ô, kiểm tra toạ độ và chụp ảnh hiện trường.
      </p>
      <ul className="mt-4 grid gap-2">
        <PermRow icon={MapPinned} label="Vị trí · GPS chính xác" state={status?.location} />
        <PermRow icon={Camera} label="Camera" state={status?.camera} />
      </ul>
      <Button className="mt-4 w-full" onClick={() => void ask()} disabled={busy}>
        {busy ? "Đang hỏi máy…" : "Xin cấp quyền truy cập"}
      </Button>
      {denied ? (
        <p className="mt-3 text-xs text-muted">
          Nếu bị từ chối: Cài đặt → Ứng dụng → Rừng vàng → Quyền → bật Vị trí và Camera.
        </p>
      ) : null}
    </div>
  );
}

export function InfoPerms() {
  const [status, setStatus] = useState<FieldPermStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void queryFieldPerms().then(setStatus);
  }, []);

  async function ask() {
    setBusy(true);
    try {
      await requestFieldPermissions();
      setStatus(await queryFieldPerms());
    } finally {
      setBusy(false);
    }
  }

  const needAsk = status?.location !== "granted" || status?.camera !== "granted";

  return (
    <div className="grid gap-2">
      <PermLine label="Quyền vị trí" state={status?.location} />
      <PermLine label="Quyền camera" state={status?.camera} />
      {needAsk ? (
        <Button className="mt-1 w-full" onClick={() => void ask()} disabled={busy}>
          {busy ? "Đang hỏi máy…" : "Xin cấp quyền truy cập"}
        </Button>
      ) : null}
    </div>
  );
}

function PermLine({ label, state }: { label: string; state?: PermState }) {
  const ok = state === "granted";
  const bad = state === "denied";
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-bg-subtle px-4">
      <p className="text-sm text-muted">{label}</p>
      <p className={cn("shrink-0 text-sm font-medium", ok ? "text-ok" : bad ? "text-danger" : "text-muted")}>
        {state ? permLabel(state) : "…"}
      </p>
    </div>
  );
}

function PermRow({
  icon: Icon,
  label,
  state,
}: {
  icon: typeof MapPinned;
  label: string;
  state?: PermState;
}) {
  const ok = state === "granted";
  const bad = state === "denied";
  return (
    <li className="flex min-h-11 items-center gap-3 rounded-sm bg-bg-subtle px-3 py-2">
      <Icon className="size-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
      <span className={cn("shrink-0 text-sm", ok ? "text-ok" : bad ? "text-danger" : "text-muted")}>
        {state ? permLabel(state) : "…"}
      </span>
    </li>
  );
}
