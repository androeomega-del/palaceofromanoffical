import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "pref:reduced-motion"; // "on" | "off" | "system"
type Pref = "on" | "off" | "system";

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function readPref(): Pref {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "on" || v === "off" ? v : "system";
}

function systemPrefersReduced(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getSnapshot(): { pref: Pref; reduced: boolean } {
  const pref = readPref();
  const reduced = pref === "on" ? true : pref === "off" ? false : systemPrefersReduced();
  return { pref, reduced };
}

// Cached snapshot for referential stability across renders
let cache = getSnapshot();
function subscribe(cb: () => void) {
  const wrapped = () => {
    cache = getSnapshot();
    cb();
  };
  listeners.add(wrapped);
  const mq = typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;
  const onMq = () => wrapped();
  const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) wrapped(); };
  mq?.addEventListener?.("change", onMq);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(wrapped);
    mq?.removeEventListener?.("change", onMq);
    window.removeEventListener("storage", onStorage);
  };
}

export function useReducedMotion() {
  const state = useSyncExternalStore(subscribe, () => cache, () => cache);

  // Reflect on <html> for global CSS hooks if needed
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.reducedMotion = state.reduced ? "true" : "false";
  }, [state.reduced]);

  const setPref = (pref: Pref) => {
    if (typeof window === "undefined") return;
    if (pref === "system") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, pref);
    cache = getSnapshot();
    emit();
  };

  return { reduced: state.reduced, pref: state.pref, setPref };
}
