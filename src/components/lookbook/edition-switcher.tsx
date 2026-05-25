/**
 * EditionSwitcher — minimal pill, hairline divider between editions.
 * Sticky to the top-right of the viewport once the hero scrolls past.
 */
import { useEdition } from "@/contexts/edition-context";

export function EditionSwitcher({ className = "" }: { className?: string }) {
  const { editions, activeOrdinal, setActiveOrdinal } = useEdition();
  if (editions.length < 2) return null;
  return (
    <nav
      aria-label="Switch edition"
      className={
        "inline-flex items-center gap-1 rounded-full bg-white/12 backdrop-blur-md border border-white/25 px-1.5 py-1.5 text-white " +
        className
      }
    >
      {editions.map((e) => {
        const isActive = e.ordinal === activeOrdinal;
        return (
          <button
            key={e.handle}
            type="button"
            onClick={() => setActiveOrdinal(e.ordinal)}
            aria-pressed={isActive}
            className={
              "px-3.5 py-1 text-[10px] uppercase tracking-[0.3em] rounded-full transition-colors " +
              (isActive
                ? "bg-white text-black"
                : "text-white/80 hover:text-white")
            }
          >
            {e.number}
          </button>
        );
      })}
    </nav>
  );
}
