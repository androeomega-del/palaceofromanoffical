/**
 * EditionProvider — exposes the active Edition + switcher to the homepage.
 * Persists the active ordinal to localStorage so refreshes keep the choice.
 * Writes `data-edition` and `data-edition-palette` to <html> so CSS-variable
 * scopes in styles.css crossfade the entire page on switch.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEditions, type Edition } from "@/lib/editions";

interface EditionContextValue {
  editions: Edition[];
  active: Edition | null;
  activeOrdinal: number;
  setActiveOrdinal: (n: number) => void;
  isLoading: boolean;
}

const Ctx = createContext<EditionContextValue | null>(null);

const STORAGE_KEY = "palace-of-roman:edition";

export function EditionProvider({ children }: { children: React.ReactNode }) {
  const editionsQ = useQuery({
    queryKey: ["editions"],
    queryFn: fetchEditions,
    staleTime: 5 * 60 * 1000,
  });

  const editions = editionsQ.data ?? [];

  const [activeOrdinal, setActiveOrdinalState] = useState<number>(1);

  // Hydrate from localStorage once editions arrive
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (editions.length === 0) return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const stored = raw ? parseInt(raw, 10) : NaN;
    if (Number.isFinite(stored) && stored >= 1 && stored <= editions.length) {
      setActiveOrdinalState(stored);
    }
  }, [editions.length]);

  const setActiveOrdinal = useCallback((n: number) => {
    setActiveOrdinalState(n);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(n));
    }
  }, []);

  const active = useMemo<Edition | null>(() => {
    if (editions.length === 0) return null;
    return editions[Math.min(activeOrdinal, editions.length) - 1] ?? editions[0];
  }, [editions, activeOrdinal]);

  // Reflect active edition onto <html> so CSS variable scopes apply globally.
  useEffect(() => {
    if (typeof document === "undefined" || !active) return;
    const html = document.documentElement;
    html.dataset.edition = String(active.ordinal);
    html.dataset.editionPalette = active.palette;
    return () => {
      delete html.dataset.edition;
      delete html.dataset.editionPalette;
    };
  }, [active]);

  const value: EditionContextValue = {
    editions,
    active,
    activeOrdinal,
    setActiveOrdinal,
    isLoading: editionsQ.isLoading,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEdition() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useEdition must be used inside <EditionProvider>");
  return v;
}
