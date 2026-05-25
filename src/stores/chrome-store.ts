/**
 * Chrome suppression store.
 *
 * The homepage renders its own AI-driven header/footer via <EditionLayout/>.
 * To avoid duplicate site chrome, EditionLayout flips these flags on mount
 * and the root layout hides the default SiteHeader/SiteFooter while they
 * are true. Every other route ignores this store and keeps the default
 * chrome.
 */
import { create } from "zustand";

type ChromeState = {
  headerSuppressed: boolean;
  footerSuppressed: boolean;
  setSuppressed: (next: { header?: boolean; footer?: boolean }) => void;
};

export const useChromeStore = create<ChromeState>((set) => ({
  headerSuppressed: false,
  footerSuppressed: false,
  setSuppressed: (next) =>
    set((s) => ({
      headerSuppressed: next.header ?? s.headerSuppressed,
      footerSuppressed: next.footer ?? s.footerSuppressed,
    })),
}));
