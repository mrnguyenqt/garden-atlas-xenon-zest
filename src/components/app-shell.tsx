import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Calculator, Images, Info, MapPinned, Route, SunMoon, Tag, Trees } from "lucide-react";
import { isDieuTraPath } from "@/components/dieu-tra-nav";
import { AppearancePicker } from "@/components/appearance-dialog";
import { ApkDownload } from "@/components/apk-download";
import { FieldPermPrompt } from "@/components/field-perm-prompt";
import { FileSaveBanner } from "@/components/file-save-banner";
import { InfoPerms } from "@/components/runtime-perms";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { APP_AUTHOR, APP_VERSION } from "@/lib/app-version";
import { installPhoneBack } from "@/lib/phone-nav";
import { bootPersist } from "@/lib/persist-boot";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/loai", label: "Loài cây", icon: Trees, match: (p: string) => p.startsWith("/loai") },
  { to: "/tracklog", label: "Tracklog", icon: Route, match: (p: string) => p.startsWith("/tracklog") },
  { to: "/o-mau", label: "Điều tra rừng", icon: MapPinned, match: isDieuTraPath },
  { to: "/cong-cu", label: "Công cụ", icon: Calculator, match: (p: string) => p.startsWith("/cong-cu") },
  { to: "/thu-vien", label: "Thư viện", icon: Images, match: (p: string) => p.startsWith("/thu-vien") },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => installPhoneBack(), []);
  useEffect(() => bootPersist(), []);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-bg text-fg">
      <aside className="fixed top-0 left-0 z-30 hidden h-dvh w-56 flex-col bg-chrome px-4 py-6 text-chrome-fg md:flex">
        <Brand />
        <nav className="mt-10 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-(--motion-quick)",
                item.match(pathname)
                  ? "bg-chrome-fg/20 text-chrome-fg"
                  : "text-chrome-fg/75 hover:bg-chrome-fg/10 hover:text-chrome-fg",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto text-xs leading-relaxed text-chrome-fg/70">
          Số liệu điều tra rừng lưu trên máy này.
        </p>
        <Link
          to="/phien-ban"
          className={cn(
            "mt-3 flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium",
            pathname.startsWith("/phien-ban") || pathname.startsWith("/tai-apk")
              ? "bg-chrome-fg/20 text-chrome-fg"
              : "text-chrome-fg/80 hover:bg-chrome-fg/10 hover:text-chrome-fg",
          )}
        >
          <Tag className="size-4" />
          Phiên bản {APP_VERSION}
        </Link>
        <div className="mt-2">
          <ApkDownload compact variant="chrome" />
        </div>
        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          className="mt-3 flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-chrome-fg/80 hover:bg-chrome-fg/10 hover:text-chrome-fg"
        >
          <Info className="size-4" />
          Thông tin
        </button>
        <button
          type="button"
          onClick={() => setAppearanceOpen(true)}
          className="mt-1 flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-chrome-fg/80 hover:bg-chrome-fg/10 hover:text-chrome-fg"
        >
          <SunMoon className="size-4" />
          Giao diện
        </button>
      </aside>

      <header className="md:hidden">
        <div
          className="bg-transparent"
          style={{ height: "max(env(safe-area-inset-top, 0px), 1.25rem)" }}
          aria-hidden
        />
        <div className="flex h-12 items-center bg-chrome/80 px-3 text-chrome-fg backdrop-blur-md">
          <Brand compact />
          <div className="-mr-1 ml-auto flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => setAppearanceOpen(true)}
              className="flex size-8 items-center justify-center rounded-full text-chrome-fg hover:bg-chrome-fg/15"
              aria-label="Giao diện"
            >
              <SunMoon className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="flex size-8 items-center justify-center rounded-full text-chrome-fg hover:bg-chrome-fg/15"
              aria-label="Thông tin"
            >
              <Info className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="pb-[calc(4.25rem+var(--sys-nav,0px))] md:pb-0 md:pl-56">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 bg-chrome pb-[var(--sys-nav,env(safe-area-inset-bottom))] text-chrome-fg md:hidden">
        {NAV.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-0.5 px-1 text-center text-[10px] leading-tight font-medium",
                active ? "text-chrome-fg" : "text-chrome-fg/70",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full transition-colors duration-(--motion-quick)",
                  active ? "bg-chrome-fg/20 text-chrome-fg" : "text-chrome-fg/80",
                )}
              >
                <item.icon className="size-3.5" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <FieldPermPrompt />
      <FileSaveBanner />
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent title="Thông tin">
          <dl className="grid gap-2">
            <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-bg-subtle px-4">
              <dt className="text-sm text-muted">Phiên bản hiện tại</dt>
              <dd className="font-medium tabular-nums">{APP_VERSION}</dd>
            </div>
            <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-bg-subtle px-4">
              <dt className="text-sm text-muted">Người xây dựng</dt>
              <dd className="font-medium">{APP_AUTHOR}</dd>
            </div>
          </dl>
          <div className="mt-2">
            <InfoPerms />
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={appearanceOpen} onOpenChange={setAppearanceOpen}>
        <DialogContent title="Tùy chỉnh giao diện Android">
          <p className="mb-4 text-sm text-muted">Chọn nền. Sáng dùng ngoài hiện trường.</p>
          <AppearancePicker />
          <Link
            to="/phien-ban"
            onClick={() => setAppearanceOpen(false)}
            className="mt-4 flex h-11 items-center justify-between rounded-xl bg-bg-subtle px-4 text-sm font-medium"
          >
            <span>Phiên bản {APP_VERSION}</span>
            <Tag className="size-4 text-muted" />
          </Link>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/o-mau" className={cn("flex shrink-0 items-center overflow-visible", compact ? "gap-2" : "gap-2.5")}>
      <img
        src="/logo.png"
        alt=""
        width={compact ? 28 : 32}
        height={compact ? 28 : 32}
        className={cn("shrink-0 rounded-[22%] object-cover", compact ? "size-7" : "size-8")}
      />
      <span
        className={cn(
          "font-display overflow-visible pr-1 tracking-tight text-chrome-fg italic",
          compact ? "text-[1.1rem] leading-none" : "text-xl leading-none",
        )}
      >
        Rừng vàng
      </span>
    </Link>
  );
}
