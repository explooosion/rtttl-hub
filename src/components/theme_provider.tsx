import { useEffect } from "react";
import { useThemeStore, getEffectiveTheme } from "@/stores/theme_store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);

  useEffect(
    function applyThemeWhenModeChange() {
      const apply = () => {
        const effective = getEffectiveTheme(mode);
        document.documentElement.classList.toggle("dark", effective === "dark");
      };
      apply();

      if (mode === "system") {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        mq.addEventListener("change", apply);
        return () => {
          mq.removeEventListener("change", apply);
        };
      }
    },
    [mode],
  );

  return <>{children}</>;
}
