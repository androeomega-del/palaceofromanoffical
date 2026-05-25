/**
 * Hotspot — Burberry-style "shop the look" marker. Hairline dot at (x, y)
 * in the parent's relative box; hover reveals a thin product card with
 * name + price; click opens the QuickView sheet.
 */
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { fetchProductByHandle, formatPrice, type ShopifyProductNode } from "@/lib/shopify";

interface HotspotProps {
  x: number; // 0..1
  y: number; // 0..1
  productHandle: string;
  label?: string | null;
  onClick: (product: ShopifyProductNode) => void;
}

export function Hotspot({ x, y, productHandle, label, onClick }: HotspotProps) {
  const [open, setOpen] = useState(false);

  const productQ = useQuery({
    queryKey: ["hotspot-product", productHandle],
    queryFn: () => fetchProductByHandle(productHandle),
    staleTime: 10 * 60 * 1000,
    enabled: Boolean(productHandle),
  });

  const product = productQ.data ?? null;

  // Flip card to the opposite side near edges so it never clips.
  const flipX = x > 0.62;
  const flipY = y > 0.7;

  return (
    <div
      className="absolute"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label ? `Shop ${label}` : `Shop the look`}
        onClick={() => product && onClick(product)}
        className="group relative block w-7 h-7 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      >
        <span className="absolute inset-0 rounded-full bg-white/85 border border-white shadow-[0_0_0_4px_rgba(255,255,255,0.15)] transition-transform duration-300 group-hover:scale-110" />
        <span className="absolute inset-[10px] rounded-full bg-black/80" />
        {/* Pulsing ring */}
        <span className="pointer-events-none absolute inset-0 rounded-full border border-white/70 animate-ping opacity-60" />
      </button>

      <AnimatePresence>
        {open && product && (
          <motion.div
            initial={{ opacity: 0, y: flipY ? -4 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: flipY ? -4 : 4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-20 pointer-events-none"
            style={{
              left: flipX ? "auto" : "calc(50% + 18px)",
              right: flipX ? "calc(50% + 18px)" : "auto",
              top: flipY ? "auto" : "50%",
              bottom: flipY ? "50%" : "auto",
              transform: flipY ? undefined : "translateY(-50%)",
            }}
          >
            <div className="pointer-events-auto w-[220px] bg-white/95 backdrop-blur-md text-black border border-black/10 shadow-xl">
              {product.images.edges[0]?.node && (
                <div className="aspect-[4/5] overflow-hidden bg-black/5">
                  <img
                    src={product.images.edges[0].node.url}
                    alt={product.images.edges[0].node.altText ?? product.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="px-3 py-3">
                {product.vendor && (
                  <p className="text-[9px] uppercase tracking-[0.3em] text-black/55 mb-1">
                    {product.vendor}
                  </p>
                )}
                <p className="text-[12px] leading-tight line-clamp-2">{product.title}</p>
                <p className="mt-2 text-[12px] font-medium">
                  {formatPrice(product.priceRange.minVariantPrice)}
                </p>
                <button
                  type="button"
                  onClick={() => onClick(product)}
                  className="mt-3 w-full py-2 bg-black text-white text-[10px] uppercase tracking-[0.25em] hover:bg-black/85 transition-colors"
                >
                  Quick view
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
