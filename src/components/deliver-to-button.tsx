import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useLocationStore,
  useLocationPopover,
  isValidUsZip,
} from "@/stores/location-store";
import { getGeoFromIp } from "@/lib/geo-ip.functions";

/**
 * Header "Deliver to {zip}" trigger. Opens a small popover with a
 * 5-digit US zip input. Persists to localStorage via the location store.
 *
 * Auto-detection: on first mount, if no zip is saved, we call our
 * `getGeoFromIp` server fn (CF request props → CF headers → ipwho.is).
 * If the shopper is in the US and we got a 5-digit postal code, we set
 * it silently and flag it as auto-detected so the UI can show a soft
 * "Not you? Change" hint.
 *
 * The popover is also remotely controllable via the `useLocationPopover`
 * store so other components (e.g. the PDP "Add location" link) can ask
 * it to open without owning their own popover.
 */
export function DeliverToButton({ className = "" }: { className?: string }) {
  const zip = useLocationStore((s) => s.zip);
  const autoDetected = useLocationStore((s) => s.autoDetected);
  const setZip = useLocationStore((s) => s.setZip);
  const clear = useLocationStore((s) => s.clear);

  const remoteOpen = useLocationPopover((s) => s.open);
  const setRemoteOpen = useLocationPopover((s) => s.setOpen);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const detectFn = useServerFn(getGeoFromIp);

  // Remote-open bridge: when another component flips the signal, open here.
  useEffect(() => {
    if (remoteOpen) {
      setOpen(true);
      setRemoteOpen(false);
    }
  }, [remoteOpen, setRemoteOpen]);

  // One-shot IP auto-detect when the shopper has no saved zip.
  const triedDetect = useRef(false);
  useEffect(() => {
    if (!mounted || zip || triedDetect.current) return;
    triedDetect.current = true;
    void detectFn()
      .then((geo) => {
        if (!geo?.country || geo.country.toUpperCase() !== "US") return;
        const code = geo.postalCode?.match(/\d{5}/)?.[0];
        if (!code) return;
        // Re-check the store — shopper may have typed something while we waited.
        if (useLocationStore.getState().zip) return;
        setZip(code, { auto: true });
      })
      .catch(() => {
        // Silent — manual entry remains available.
      });
  }, [mounted, zip, setZip, detectFn]);

  useEffect(() => {
    if (open) {
      setDraft(zip ?? "");
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open, zip]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isValidUsZip(draft)) {
      setError("Please enter a 5-digit US zip code.");
      return;
    }
    setZip(draft);
    setOpen(false);
  };

  // Stable SSR label — avoid hydration mismatch.
  const label = mounted && zip ? `Deliver to ${zip}` : "Set location";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-ink/70 hover:text-bronze transition-colors ${className}`}
        >
          <MapPin className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span className="hidden sm:inline whitespace-nowrap">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-72 p-5 bg-canvas border border-ink/10 shadow-xl rounded-none z-50"
      >
        <p className="text-[10px] uppercase tracking-[0.28em] text-bronze mb-2">
          Delivery location
        </p>
        <p className="text-xs text-ink/70 leading-relaxed mb-4">
          {mounted && zip && autoDetected
            ? "We estimated your location from your connection. Not right? Enter your zip code below."
            : "Enter your US zip code to see estimated delivery dates. Pieces dispatch from our European partners."}
        </p>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            ref={inputRef}
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            placeholder="e.g. 10013"
            value={draft}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, "").slice(0, 5);
              setDraft(next);
              if (error) setError(null);
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "zip-error" : undefined}
            className="w-full bg-transparent border-b border-ink/30 focus:border-ink py-2 text-sm tracking-[0.2em] tabular-nums focus:outline-none placeholder:text-muted-foreground/60"
          />
          {error && (
            <p id="zip-error" className="text-[11px] text-red-600">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between pt-1">
            {mounted && zip ? (
              <button
                type="button"
                onClick={() => {
                  clear();
                  setDraft("");
                  setOpen(false);
                }}
                className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-ink"
              >
                Clear
              </button>
            ) : (
              <span />
            )}
            <button
              type="submit"
              className="text-[10px] uppercase tracking-[0.28em] bg-ink text-canvas px-4 py-2 hover:bg-bronze transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
