import { createFileRoute, Link } from "@tanstack/react-router";
import { img } from "@/lib/editorial-library";
import { routeHead } from "@/lib/seo";

export const Route = createFileRoute("/links")({
  head: () => {
    const title = "Palace of Roman — Links";
    const desc = "Shop the edit, contact the concierge, follow on Instagram and TikTok.";
    const rh = routeHead({ path: "/links", title, description: desc, image: img(14) });
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        // Discourage Google from indexing — this is a social hub, not a search target
        { name: "robots", content: "noindex,follow" },
        ...rh.meta,
      ],
      links: rh.links,
    };
  },
  component: LinksPage,
});

type LinkItem = {
  label: string;
  sub?: string;
  href: string;
  external?: boolean;
};

const LINKS: LinkItem[] = [
  { label: "Shop the Edit", sub: "All new arrivals", href: "/shop" },
  { label: "Women", sub: "Clothing, shoes & bags", href: "/collections/womens-clothing" },
  { label: "Men", sub: "Clothing & sneakers", href: "/collections/mens-clothing" },
  { label: "Dolce & Gabbana Swim", sub: "Campaign", href: "/campaign/dolce-gabbana-swim" },
  { label: "Brands Index", sub: "Every maison we carry", href: "/brands" },
  {
    label: "WhatsApp the Concierge",
    sub: "Personal sourcing & sizing",
    href: "https://wa.me/?text=Hi%20Palace%20of%20Roman%2C%20I%27d%20like%20to%20ask%20about…",
    external: true,
  },
  {
    label: "Email Support",
    sub: "support@palaceofroman.com",
    href: "mailto:support@palaceofroman.com",
    external: true,
  },
  {
    label: "Instagram",
    sub: "@palaceofroman",
    href: "https://www.instagram.com/palaceofroman/",
    external: true,
  },
  {
    label: "TikTok",
    sub: "@palaceofroman",
    href: "https://www.tiktok.com/@palaceofroman",
    external: true,
  },
];

function LinkRow({ item }: { item: LinkItem }) {
  const inner = (
    <div className="group flex items-center justify-between gap-4 border border-ink/15 bg-canvas px-5 py-4 hover:bg-ink hover:text-canvas hover:border-ink transition-colors duration-500">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.25em] font-semibold leading-none">
          {item.label}
        </p>
        {item.sub && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground group-hover:text-canvas/70 mt-2 leading-none">
            {item.sub}
          </p>
        )}
      </div>
      <span className="text-[10px] tracking-[0.3em] opacity-60 group-hover:translate-x-1 transition-transform">
        →
      </span>
    </div>
  );

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }
  return (
    <Link to={item.href} className="block">
      {inner}
    </Link>
  );
}

function LinksPage() {
  return (
    <main className="bg-canvas text-ink min-h-screen">
      <div className="max-w-md mx-auto px-6 pt-16 pb-20">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full overflow-hidden border border-ink/15">
            <img
              src={img(14)}
              alt="Palace of Roman"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3">
            Palace of Roman
          </p>
          <h1 className="font-serif text-3xl tracking-tight mb-3 text-balance">
            Multi-brand luxury, curated.
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            100% authentic — official BrandsGateway partner. Worldwide shipping, 14-day returns.
          </p>
        </div>

        {/* Links */}
        <div className="space-y-3">
          {LINKS.map((l) => (
            <LinkRow key={l.label} item={l} />
          ))}
        </div>

        {/* Footnote */}
        <p className="text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-10">
          palaceofroman.com
        </p>
      </div>
    </main>
  );
}
