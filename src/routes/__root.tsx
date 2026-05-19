import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useCartSync } from "@/hooks/use-cart-sync";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="max-w-md text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-6">Error 404</p>
        <h1 className="text-5xl font-serif mb-6">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-10">The page you're looking for has moved or no longer exists.</p>
        <Link
          to="/"
          className="inline-block text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze transition-colors"
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
      { title: "Palace of Roman — Curated Luxury Fashion" },
      { name: "description", content: "Curated luxury fashion from Gucci, Prada, Saint Laurent, Armani and 500+ designer houses. 100% authentic, shipped worldwide." },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:site_name", content: "Palace of Roman" },
      { property: "og:title", content: "Palace of Roman — Curated Luxury Fashion" },
      { property: "og:description", content: "Curated luxury fashion from the world's most significant designers." },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Palace of Roman — Curated Luxury Fashion" },
      { name: "twitter:description", content: "Curated luxury fashion from the world's most significant designers." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Karla:wght@300;400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Palace of Roman",
          url: "https://palaceofroman.com",
          logo: "https://palaceofroman.com/favicon.ico",
          description: "Curated multi-brand luxury fashion retailer offering premium designer clothing, shoes, accessories and jewelry from 500+ houses including Gucci, Prada, Calvin Klein, Armani and Versace. Ships worldwide.",
          email: "concierge@palaceofroman.com",
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
          url: "https://palaceofroman.com",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://palaceofroman.com/shop?q={search_term_string}",
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
      <div className="min-h-screen flex flex-col bg-canvas">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

function CartSyncBoundary() {
  useCartSync();
  return null;
}
