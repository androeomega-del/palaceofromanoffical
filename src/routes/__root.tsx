import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WelcomeDispatchModal } from "@/components/welcome-dispatch-modal";
import { ConciergeWidget } from "@/components/concierge-widget";
import { ExitIntentStylist } from "@/components/exit-intent-stylist";
import { useCartSync } from "@/hooks/use-cart-sync";
import { Toaster } from "@/components/ui/sonner";
import { installHydrationMonitor } from "@/lib/hydration-monitor";
import { useChromeStore } from "@/stores/chrome-store";

// Side-effect: patch console.error on the client to capture hydration
// mismatch warnings with timestamps + component names. No-op on the server.
if (typeof window !== "undefined") {
  installHydrationMonitor();

  // Stale-bundle recovery: after a redeploy, cached HTML may reference JS
  // chunks that no longer exist (404). Force exactly ONE hard reload per
  // navigation target — keyed by current URL — to prevent reload loops if
  // the new bundle is still broken on the same page.
  const RELOAD_KEY = "__por_stale_chunk_reloaded_url";
  const currentNavKey = () => window.location.pathname + window.location.search;

  const alreadyReloadedForThisNav = () =>
    sessionStorage.getItem(RELOAD_KEY) === currentNavKey();

  const markReloadedForThisNav = () => {
    sessionStorage.setItem(RELOAD_KEY, currentNavKey());
  };

  const triggerReload = (source: string, info: Record<string, unknown>) => {
    if (alreadyReloadedForThisNav()) {
      // eslint-disable-next-line no-console
      console.log(
        `[POR stale-bundle] Skipped reload (already reloaded for ${currentNavKey()}). source=${source}`,
        info,
      );
      return;
    }
    // eslint-disable-next-line no-console
    console.log(
      `[POR stale-bundle] Reloading once for nav=${currentNavKey()}. source=${source}`,
      info,
    );
    markReloadedForThisNav();
    window.location.reload();
  };

  // Clear the per-nav guard whenever the user navigates somewhere new so
  // the next nav target is allowed exactly one fresh reload attempt.
  window.addEventListener("popstate", () => {
    if (sessionStorage.getItem(RELOAD_KEY) !== currentNavKey()) {
      sessionStorage.removeItem(RELOAD_KEY);
    }
  });

  const isStaleChunkMessage = (message: string, chunkUrl: string) =>
    /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(
      message,
    ) || /\/assets\/.*\.(?:js|mjs|css)/i.test(chunkUrl);

  const handleStaleChunk = (event: Event) => {
    const message =
      (event as ErrorEvent).message ??
      ((event as PromiseRejectionEvent).reason &&
        String((event as PromiseRejectionEvent).reason?.message ?? (event as PromiseRejectionEvent).reason)) ??
      "";
    const chunkUrl =
      (event as ErrorEvent).filename ??
      (event as PromiseRejectionEvent).reason?.stack ??
      "";
    if (isStaleChunkMessage(message, chunkUrl)) {
      triggerReload("error/unhandledrejection", { message, chunkUrl });
    }
  };

  window.addEventListener("vite:preloadError", (event: Event) => {
    const detail = (event as CustomEvent).detail;
    const chunkUrl =
      (detail as { url?: string; href?: string } | undefined)?.url ??
      (detail as { url?: string; href?: string } | undefined)?.href ??
      "";
    triggerReload("vite:preloadError", { chunkUrl, detail });
  });
  window.addEventListener("error", handleStaleChunk);
  window.addEventListener("unhandledrejection", handleStaleChunk);

}


function NotFoundComponent() {
  const recoveryLinks: { to: string; label: string; eyebrow: string }[] = [
    { to: "/shop", label: "The Boutique", eyebrow: "All Pieces" },
    { to: "/collections/best-sellers", label: "Best Sellers", eyebrow: "Most Loved" },
    { to: "/collections/womens-clothing", label: "Women", eyebrow: "Edit" },
    { to: "/collections/mens-clothing", label: "Men", eyebrow: "Edit" },
    { to: "/swim", label: "Swim", eyebrow: "Resort" },
    { to: "/journal", label: "The Journal", eyebrow: "Editorial" },
  ];

  return (
    <div className="min-h-screen bg-canvas px-6 py-24">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-6">Error 404</p>
        <h1 className="text-5xl md:text-6xl font-serif mb-6">This page has moved on</h1>
        <p className="text-sm text-muted-foreground mb-10 max-w-lg mx-auto">
          The address you followed no longer exists, but the collection is still here. Search the boutique or pick up where the catalogue continues.
        </p>

        <form
          action="/shop"
          method="get"
          className="flex max-w-md mx-auto border-b border-ink/30 focus-within:border-ink mb-14"
        >
          <input
            type="search"
            name="q"
            placeholder="Search designers, pieces, categories…"
            className="flex-1 bg-transparent py-3 text-sm focus:outline-none placeholder:text-muted-foreground/70"
            aria-label="Search the boutique"
          />
          <button
            type="submit"
            className="text-[10px] uppercase tracking-[0.25em] pl-4 hover:text-bronze"
          >
            Search
          </button>
        </form>

        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-6">
          Continue browsing
        </p>
        <ul className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {recoveryLinks.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className="block border border-ink/10 py-5 px-4 hover:border-ink transition-colors text-left"
              >
                <span className="block text-[9px] uppercase tracking-[0.3em] text-bronze mb-2">
                  {l.eyebrow}
                </span>
                <span className="block text-sm font-serif">{l.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          to="/"
          className="inline-block mt-14 text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze transition-colors"
        >
          Return to Boutique
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-serif">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted-foreground">Please try again or return to the homepage.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze"
          >
            Try Again
          </button>
          <a href="/" className="text-[11px] uppercase tracking-[0.25em] border-b border-ink/20 pb-1 hover:text-ink">
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "google-site-verification", content: "fMHX1ox7fghr5UYvoTTCaxSRNcKuE5BEUuPd-tDZYE4" },
      { name: "google-site-verification", content: "AtWXsRuhIBiU3qtuduY5QlJUXKCQipTKSAQ2_P9_fM4" },
      { title: "Palace of Roman — Curated Luxury Fashion" },
      { name: "description", content: "Curated luxury fashion from Gucci, Prada, Saint Laurent, Armani and 500+ designer houses. 100% authentic, shipped worldwide." },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:site_name", content: "Palace of Roman" },
      { property: "og:title", content: "Palace of Roman — Curated Luxury Fashion" },
      { property: "og:description", content: "Curated luxury fashion from Gucci, Prada, Saint Laurent, Armani and 500+ designer houses. 100% authentic, shipped worldwide." },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Palace of Roman — Curated Luxury Fashion" },
      { name: "twitter:description", content: "Curated luxury fashion from Gucci, Prada, Saint Laurent, Armani and 500+ designer houses. 100% authentic, shipped worldwide." },
      { property: "og:image", content: "https://palaceofromanofficial.com/og-image.jpg" },
      { property: "og:image:width", content: "1920" },
      { property: "og:image:height", content: "1008" },
      { property: "og:image:alt", content: "Palace of Roman — The Maison · Curated Luxury" },
      { name: "twitter:image", content: "https://palaceofromanofficial.com/og-image.jpg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      // Non-blocking webfont load: preload as style, then swap to stylesheet
      // on load so the CSS request doesn't block first paint. <noscript>
      // fallback added below in scripts[] is unnecessary — html.css fallback
      // (var(--font-serif) / var(--font-sans)) already covers no-JS users.
      {
        rel: "preload",
        as: "style",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Karla:wght@400;500;600&display=swap",
      } as any,
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Karla:wght@400;500;600&display=swap",
      },
      // AI / LLM discovery surface — points crawlers at the curated site summary.
      { rel: "alternate", type: "text/markdown", href: "/llms.txt", title: "llms.txt" },
      // Sitemap discovery for crawlers that read <link rel="sitemap">.
      { rel: "sitemap", type: "application/xml", href: "/sitemap.xml", title: "Sitemap" },
      // Favicons & app icons (PR monogram on onyx + antique gold)
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16.png" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/favicon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/favicon-512.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
    scripts: [
      // --- Plausible Analytics v2 (privacy-first, no cookie banner) ---
      // New tracking script with init() call. Tracks pageviews + outbound
      // link clicks against the palaceofromanofficial.com dashboard at
      // https://plausible.io. No client-side key/ID required.
      {
        defer: true,
        "data-domain": "palaceofromanofficial.com",
        src: "https://plausible.io/js/script.js",
      },
      {
        children:
          "window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)};plausible.init({outboundLinks:true})",
      },

      // --- Google Analytics 4 ---
      // TODO: replace G-XXXXXXXXXX with the Measurement ID from your GA4 property
      // (Admin → Data Streams → Web → Measurement ID). Until then GA4 will fail
      // silently — Plausible will still record traffic.
      {
        async: true,
        src: "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX",
      },
      {
        children:
          "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-XXXXXXXXXX',{anonymize_ip:true});",
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Palace of Roman",
          url: "https://palaceofromanofficial.com",
          logo: "https://palaceofromanofficial.com/brand/logo-wordmark.png",
          description: "Curated multi-brand luxury fashion retailer offering premium designer clothing, shoes, accessories and jewelry from 500+ houses including Gucci, Prada, Armani and Versace. Ships worldwide.",
          email: "concierge@palaceofromanofficial.com",
          sameAs: [
            "https://www.instagram.com/palaceofroman/",
            "https://www.facebook.com/people/Palace-of-Roman/61581195176963/",
            "https://www.tiktok.com/@palaceofroman",
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Palace of Roman",
          url: "https://palaceofromanofficial.com",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://palaceofromanofficial.com/shop?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <CartSyncBoundary />
      <ChromeAwareShell />
      <ClientOnlyToaster />
      <WelcomeDispatchModal />
      <ClientOnlyConcierge />
      <ExitIntentStylist />
    </QueryClientProvider>
  );
}

function ChromeAwareShell() {
  // The homepage owns its own header/footer inside <EditionLayout/>. Hide the
  // root chrome synchronously by route so it never flashes a duplicate before
  // the client-only suppression store hydrates.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHomepage = pathname === "/";
  const headerSuppressed = useChromeStore((s) => s.headerSuppressed);
  const footerSuppressed = useChromeStore((s) => s.footerSuppressed);
  const hideHeader = isHomepage || headerSuppressed;
  const hideFooter = isHomepage || footerSuppressed;
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {!hideHeader && <SiteHeader />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!hideFooter && <SiteFooter />}
    </div>
  );
}

function ClientOnlyToaster() {
  // Sonner mounts a portal + reads viewport on first render. Defer to
  // post-hydration so SSR/CSR text trees match exactly.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <Toaster position="top-center" />;
}

function ClientOnlyConcierge() {
  // Browser-only — depends on localStorage stores (wishlist, recently-viewed).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <ConciergeWidget />;
}

function CartSyncBoundary() {
  useCartSync();
  return null;
}
