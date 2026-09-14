import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light" | "system";

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "dark",
      setMode: (mode) => set({ mode }),
    }),
    { name: "rung-theme" },
  ),
);

export const THEME_MODES: { id: ThemeMode; label: string; hint: string }[] = [
  { id: "dark", label: "Tối", hint: "Ban đêm, tiết kiệm pin" },
  { id: "light", label: "Sáng", hint: "Ngoài hiện trường, trời nắng" },
  { id: "system", label: "Theo máy", hint: "Theo cài đặt Android" },
];

export function resolveTheme(mode: ThemeMode): "dark" | "light" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

export const THEME_COLOR = {
  dark: "#00000000",
  light: "#00000000",
} as const;
