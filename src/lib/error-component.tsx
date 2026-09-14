import { useEffect } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { isStaleAssetError, reloadIfStaleChunk } from "@/lib/update-boot";

const FALLBACK_MESSAGE = "Có lỗi xảy ra. Tải lại trang và thử lại.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  const stale = isStaleAssetError(error);

  useEffect(() => {
    if (stale) reloadIfStaleChunk(error);
  }, [error, stale]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <span className="text-danger" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-xl">{stale ? "Đang tải bản mới" : "Không tải được"}</h1>
      <p className="max-w-md text-sm text-muted">
        {stale ? "Vừa cập nhật APK. Ứng dụng đang tải lại giao diện, số liệu giữ nguyên." : FALLBACK_MESSAGE}
      </p>
      <p className="max-w-md text-xs break-words text-subtle">{errorMessage(error)}</p>
      {stale ? null : (
        <button
          type="button"
          className="mt-2 h-11 rounded-sm bg-primary px-4 text-sm font-medium text-primary-fg"
          onClick={() => location.reload()}
        >
          Tải lại
        </button>
      )}
    </main>
  );
}
