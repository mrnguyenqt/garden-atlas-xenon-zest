import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, CircleDot, FileDown, FolderKanban } from "lucide-react";

export const Route = createFileRoute("/o-mau/")({ component: DieuTraHub });

const ITEMS = [
  {
    to: "/du-an",
    label: "Dự án",
    hint: "Tạo mới và quản lý dự án",
    icon: FolderKanban,
  },
  {
    to: "/o-mau/o-tieu-chuan",
    label: "Lập ô tiêu chuẩn",
    hint: "Số hiệu, cỡ ô, tỷ lệ sống",
    icon: CircleDot,
  },
  {
    to: "/xuat-csv",
    label: "Xuất Excel",
    hint: "Tải số liệu ra Excel",
    icon: FileDown,
  },
] as const;

function DieuTraHub() {
  return (
    <div className="mx-auto max-w-content px-5 pt-3 pb-8 md:px-10 md:pt-8 md:pb-12">
      <h1 className="font-display text-center text-4xl italic">Điều tra rừng</h1>
      <ul className="mt-8 grid gap-3">
        {ITEMS.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="flex min-h-16 items-center gap-4 rounded-xl bg-bg-elevated px-5 py-4 shadow-(--shadow-border) transition-transform duration-(--motion-quick) hover:-translate-y-0.5"
            >
              <item.icon className="size-5 shrink-0 text-muted" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{item.label}</span>
                <span className="mt-0.5 block text-sm text-muted">{item.hint}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-subtle" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
