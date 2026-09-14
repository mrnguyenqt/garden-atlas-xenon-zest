import { useEffect, type ReactNode } from "react";
import { THEME_COLOR, resolveTheme, useTheme } from "@/lib/theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useTheme((s) => s.mode);

  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(mode);
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", THEME_COLOR[resolved]);
    };
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [mode]);

  return children;
}

export const THEME_BOOTSTRAP = `(()=>{try{var r=JSON.parse(localStorage.getItem("rung-theme")||"{}");var m=r&&r.state&&r.state.mode||"dark";var d=m==="system"?matchMedia("(prefers-color-scheme: dark)").matches:m!=="light";document.documentElement.dataset.theme=d?"dark":"light";document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})()`;
