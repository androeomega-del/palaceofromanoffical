/**
 * LookbookMasonry — fluid CSS-columns masonry. Tight gutters, no card chrome,
 * no rounded corners, no shadows (Burberry restraint). Each tile reveals on
 * scroll with a slow fade + 24px upward slide.
 *
 * Empty-state: if no curated lookbook images exist for the Edition, falls
 * back to the Edition's product images with one auto-centered hotspot.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import type { Edition, LookbookImage } from "@/lib/editions";
import type { ShopifyProductNode } from "@/lib/shopify";
import { Hotspot } from "./hotspot";
import { QuickViewSheet } from "./quick-view-sheet";

interface LookbookMasonryProps {
  edition: Edition;
  /** start offset for the fallback path — lets pt.1 and pt.2 show different products */
  productOffset?: number;
  productLimit?: number;
}

export function LookbookMasonry({
  edition,
  productOffset = 0,
  productLimit = 8,
}: LookbookMasonryProps) {
  const [activeProduct, setActiveProduct] = useState<ShopifyProductNode | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const openProduct = (p: ShopifyProductNode) => {
    setActiveProduct(p);
    setQuickViewOpen(true);
  };

  // Use curated lookbook if present; else build a synthetic list from real
  // collection products (no fabricated imagery).
  const items: LookbookImage[] =
    edition.lookbook.length > 0
      ? edition.lookbook
      : edition.products
          .slice(productOffset, productOffset + productLimit)
          .map((p, i) => {
            const img = p.node.images.edges[0]?.node;
            if (!img) return null;
            return {
              id: `auto-${p.node.id}`,
              imageUrl: img.url,
              blurDataUrl: null,
              width: img.width ?? null,
              height: img.height ?? null,
              altText: img.altText ?? p.node.title,
              sortOrder: i,
              hotspots: [
                {
                  id: `auto-h-${p.node.id}`,
                  x: 0.5,
                  y: 0.55,
                  productHandle: p.node.handle,
                  variantGid: null,
                  label: p.node.title,
                },
              ],
            } as LookbookImage;
          })
          .filter((x): x is LookbookImage => Boolean(x));

  if (items.length === 0) return null;

  return (
    <>
      <section
        aria-label={`Lookbook — Edition ${edition.number}`}
        className="bg-[var(--edition-bg)] text-[var(--edition-fg)] py-6 md:py-10"
      >
        <div
          className="px-2 md:px-4"
          style={{
            columnGap: "8px",
            columnCount: 1,
          }}
        >
          <style>{`
            @media (min-width: 640px) { .lookbook-cols { column-count: 2; } }
            @media (min-width: 1024px) { .lookbook-cols { column-count: 3; } }
          `}</style>
          <div className="lookbook-cols" style={{ columnGap: "8px" }}>
            {items.map((item, i) => (
              <LookbookTile key={item.id} item={item} index={i} onProductClick={openProduct} />
            ))}
          </div>
        </div>
      </section>

      <QuickViewSheet
        product={activeProduct}
        open={quickViewOpen}
        onOpenChange={(o) => {
          setQuickViewOpen(o);
          if (!o) setTimeout(() => setActiveProduct(null), 250);
        }}
      />
    </>
  );
}

function LookbookTile({
  item,
  index,
  onProductClick,
}: {
  item: LookbookImage;
  index: number;
  onProductClick: (p: ShopifyProductNode) => void;
}) {
  const aspect = item.width && item.height ? item.width / item.height : 0.78;
  return (
    <motion.figure
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.6,
        delay: Math.min(index * 0.04, 0.2),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative mb-2 break-inside-avoid overflow-hidden"
      style={{
        aspectRatio: aspect,
        background: item.blurDataUrl ? `center/cover no-repeat url(${item.blurDataUrl})` : "var(--canvas-raised)",
      }}
    >
      <img
        src={item.imageUrl}
        alt={item.altText}
        loading={index < 2 ? "eager" : "lazy"}
        decoding="async"
        width={item.width ?? undefined}
        height={item.height ?? undefined}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {item.hotspots.map((h) => (
        <Hotspot
          key={h.id}
          x={h.x}
          y={h.y}
          productHandle={h.productHandle}
          label={h.label}
          onClick={onProductClick}
        />
      ))}
    </motion.figure>
  );
}
