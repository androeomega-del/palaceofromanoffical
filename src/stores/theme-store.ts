/**
 * Sitewide light/dark theme store.
 *
 * Persists the user's choice in localStorage. The `ThemeApplier` mounted
 * in __root.tsx toggles the `dark` class on <html>, which activates the
 * `:root.dark` token overrides in src/styles.css.
 */
import { create } from "zustand";

export type Theme = "light" | "dark";

const KEY = "por-theme-v1";

function initial(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark") return v;
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {}
  return "light";
}

type ThemeState = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initial(),
  setTheme: (t) => {
    try { localStorage.setItem(KEY, t); } catch {}
    set({ theme: t });
  },
  toggle: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
}));
