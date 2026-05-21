import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { ensureAdmin } from "@/lib/admin-guard.functions";
import { Card } from "@/components/ui/card";
import {
  BarChart3,
  RefreshCw,
  Boxes,
  Search,
  Image as ImageIcon,
  Crop,
  CheckSquare,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  beforeLoad: async () => {
    try {
      await ensureAdmin();
    } catch {
      throw redirect({ to: "/authentication" });
    }
  },
  component: AdminHub,
  head: () => ({
    meta: [
      { title: "Admin — Palace of Roman" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Tile = {
  to: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
};

const TILES: Tile[] = [
  {
    to: "/admin/analytics",
    label: "Cart Analytics",
    desc: "Funnel, revenue, top products, sessions",
    icon: BarChart3,
  },
  {
    to: "/admin/seo-health",
    label: "SEO Health",
    desc: "Indexing, sitemap, metadata checks",
    icon: Search,
  },
  {
    to: "/admin/shopify-sync",
    label: "Shopify Sync",
    desc: "Variant map and tag sync runs",
    icon: RefreshCw,
  },
  {
    to: "/admin/inventory-sync",
    label: "Inventory Sync",
    desc: "Stock activation history",
    icon: Boxes,
  },
  {
    to: "/admin/collection-image-qa",
    label: "Collection Images — QA",
    desc: "Review generated hero imagery",
    icon: CheckSquare,
  },
  {
    to: "/admin/collection-focal",
    label: "Collection Focal Points",
    desc: "Tune image crop focal points",
    icon: Crop,
  },
  {
    to: "/admin/collection-image-preview",
    label: "Image Preview",
    desc: "Preview collection heroes",
    icon: ImageIcon,
  },
  {
    to: "/admin/collection-hero-regression",
    label: "Hero Regression",
    desc: "Visual regression checks",
    icon: ImageIcon,
  },
];

function AdminHub() {
  return (
    <main className="min-h-screen bg-canvas px-6 py-12 md:py-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-3">Admin</p>
          <h1 className="font-serif text-4xl md:text-5xl">Operations</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Internal dashboards. Not indexed.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TILES.map((t) => (
            <Link key={t.to} to={t.to as any} className="group">
              <Card className="p-6 h-full hover:border-bronze/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="rounded-md bg-bronze/10 text-bronze p-2.5 group-hover:bg-bronze/20 transition-colors">
                    <t.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-serif text-lg leading-tight">{t.label}</h2>
                    <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
