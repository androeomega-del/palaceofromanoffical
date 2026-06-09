import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/stores/theme-store";

/**
 * Floating light/dark theme toggle. Mounted globally in __root.tsx so it
 * reaches every page including those that suppress the standard chrome
 * (homepage / studio). Client-only to avoid SSR hydration mismatch — the
 * persisted value is read from localStorage on mount.
 */
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);

  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    root.style.colorScheme = theme;
  }, [theme]);

  if (!mounted) return null;

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="fixed bottom-4 left-4 z-[60] h-11 w-11 grid place-content-center rounded-full border border-border bg-canvas text-ink shadow-md hover:bg-canvas-raised transition-colors"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
