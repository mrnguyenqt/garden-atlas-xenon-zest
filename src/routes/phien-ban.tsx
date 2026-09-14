import { createFileRoute } from "@tanstack/react-router";
import { ApkDownload } from "@/components/apk-download";
import { RuntimePerms } from "@/components/runtime-perms";
import { SecuritySettings } from "@/components/security-settings";
import { APK_PACKAGE, APK_SECURITY, APK_SIG_SCHEMES, APP_BUILD, APP_NAME, APP_VERSION, RELEASES, apkCertFingerprint } from "@/lib/app-version";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/phien-ban")({ component: VersionPage });

function VersionPage() {
  return (
    <div className="mx-auto max-w-content px-5 pt-3 pb-8 md:px-10 md:pt-8 md:pb-12">
      <p className="text-center text-xs tracking-[0.2em] text-muted uppercase">Ứng dụng</p>
      <h1 className="font-display mt-2 text-center text-4xl italic">Phiên bản</h1>

      <div className="mx-auto mt-8 max-w-xl rounded-xl bg-bg-elevated p-5 shadow-(--shadow-border)">
        <p className="font-display text-2xl italic">{APP_NAME}</p>
        <p className="mt-2 text-lg font-medium tabular-nums">
          {APP_VERSION} · {APP_BUILD}
        </p>
        <p className="mt-1 text-sm text-muted">Bản đang chạy trên máy này.</p>
        <p className="mt-4 rounded-sm bg-bg-subtle px-3 py-2 font-medium tabular-nums">{APP_BUILD}.apk · 60 MB</p>
        <div className="mt-3">
          <ApkDownload />
        </div>
        <p className="mt-5 text-sm font-medium">Cập nhật không mất dữ liệu</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-muted">
          <li>Không gỡ app cũ.</li>
          <li>Tải {APP_BUILD}.apk vào điện thoại.</li>
          <li>Mở file → nhấn Cài đặt / Cập nhật.</li>
          <li>Khi máy báo app đã tồn tại, chọn Cập nhật.</li>
        </ol>
        <p className="mt-3 text-xs text-muted">
          Cùng gói {APK_PACKAGE} và cùng chữ ký — hệ thống coi đây là cập nhật, số liệu giữ nguyên.
        </p>
      </div>

      <h2 className="font-display mt-10 text-xl italic">Cấu hình bảo mật</h2>
      <div className="mx-auto mt-4 max-w-xl rounded-xl bg-bg-elevated p-5 shadow-(--shadow-border)">
        <SecuritySettings />
      </div>

      <h2 className="font-display mt-10 text-xl italic">Tính toàn vẹn ứng dụng</h2>
      <ul className="mt-4 grid gap-2">
        {APK_SECURITY.map((row) => (
          <li key={row.label} className="flex items-start justify-between gap-3 rounded-xl bg-bg-elevated px-4 py-3 shadow-(--shadow-border)">
            <span>
              <span className="block font-medium">{row.label}</span>
              <span className="text-sm text-muted">{row.detail}</span>
            </span>
            <span className="shrink-0 text-sm font-medium text-ok">{row.ok ? "Đạt" : "Lỗi"}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 break-all text-center text-xs text-muted">
        {APK_PACKAGE} · {APK_SIG_SCHEMES}
        <br />
        SHA-256 {apkCertFingerprint()}
      </p>

      <RuntimePerms />

      <h2 className="font-display mt-10 text-xl italic">Lịch sử bản</h2>
      <ul className="mt-4 grid gap-3">
        {RELEASES.map((rel) => (
          <li key={rel.build} className="rounded-xl bg-bg-elevated p-5 shadow-(--shadow-border)">
            <p className="font-medium">
              {rel.version} · {rel.build}
            </p>
            <p className="mt-0.5 text-xs text-muted">{formatDate(rel.date)}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
              {rel.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
