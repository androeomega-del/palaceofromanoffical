/**
 * Active department (Women / Men) for the desktop two-row header.
 *
 * The row-2 category rail in <SiteHeader> reads this to decide which
 * department's columns to render. Persists across reloads in sessionStorage
 * so a shopper who flipped to Men keeps Men on the next pageview.
 */
import { create } from "zustand";

export type Dept = "women" | "men";

type DeptState = {
  dept: Dept;
  setDept: (d: Dept) => void;
};

const KEY = "por-active-dept-v1";

function initial(): Dept {
  if (typeof window === "undefined") return "women";
  try {
    const v = sessionStorage.getItem(KEY);
    if (v === "women" || v === "men") return v;
  } catch {}
  return "women";
}

export const useDeptStore = create<DeptState>((set) => ({
  dept: initial(),
  setDept: (d) => {
    try {
      sessionStorage.setItem(KEY, d);
    } catch {}
    set({ dept: d });
  },
}));
