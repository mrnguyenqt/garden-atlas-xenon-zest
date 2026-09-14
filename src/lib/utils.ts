import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const nf0 = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
export const nf1 = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
export const nf2 = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
export const nf3 = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 });

export function formatHa(m2: number): string {
  if (m2 >= 10000) return `${nf2.format(m2 / 10000)} ha`;
  return `${nf0.format(m2)} m²`;
}

export function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Ngày local YYYY-MM-DD theo đồng hồ máy. */
export function nowLocalDate() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function toLocalDate(iso?: string) {
  if (!iso) return nowLocalDate();
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = /^\d{4}-\d{2}-\d{2}T/.test(iso) && !iso.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(iso)
    ? new Date(iso)
    : new Date(iso);
  if (Number.isNaN(d.getTime())) return nowLocalDate();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function fromLocalDate(ymd: string) {
  if (ymd === nowLocalDate()) return new Date().toISOString();
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return new Date().toISOString();
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}
