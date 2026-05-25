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

// Deterministic initial snapshot — identical on server AND on client's first
// hydration pass. We refresh from localStorage / matchMedia only AFTER
// subscribe() runs, which happens post-hydration. This guarantees React's
// SSR-text matches the client's first render and avoids hydration error #418.
const SSR_SNAPSHOT: { pref: Pref; reduced: boolean } = { pref: "system", reduced: false };
let cache: { pref: Pref; reduced: boolean } = SSR_SNAPSHOT;

function subscribe(cb: () => void) {
  const wrapped = () => {
    cache = getSnapshot();
    cb();
  };
  listeners.add(wrapped);
  // Refresh to real client value now that we're post-hydration.
  const real = getSnapshot();
  if (real.pref !== cache.pref || real.reduced !== cache.reduced) {
    cache = real;
    cb();
  }
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
  const state = useSyncExternalStore(subscribe, () => cache, () => SSR_SNAPSHOT);

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
