/**
 * EditionEditorialBand — narrow editorial slot between masonry rows.
 * Uses the second lookbook image (or second product image) as the visual,
 * with a pulled quote on the side. Real data only.
 */
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import type { Edition } from "@/lib/editions";

export function EditionEditorialBand({ edition }: { edition: Edition }) {
  const fallbackImage =
    edition.lookbook[1]?.imageUrl ??
    edition.lookbook[0]?.imageUrl ??
    edition.products[1]?.node.images.edges[0]?.node.url ??
    edition.cover.url;

  const alt =
    edition.lookbook[1]?.altText ??
    edition.products[1]?.node.title ??
    edition.cover.alt;

  return (
    <section className="bg-canvas-raised py-20 md:py-28">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-10 grid md:grid-cols-12 gap-10 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="md:col-span-7 relative aspect-[4/5] overflow-hidden"
        >
          <img
            src={fallbackImage}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="md:col-span-5"
        >
          <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-4">
            From the Edition
          </p>
          <p className="font-serif text-2xl md:text-3xl lg:text-4xl leading-[1.15] text-ink text-balance">
            “{edition.title}” — a quieter posture for the season, photographed
            in the light it was made for.
          </p>
          <Link
            to="/collections/$handle"
            params={{ handle: edition.handle }}
            className="mt-9 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] border-b border-ink/30 hover:border-ink pb-1 transition-colors"
          >
            Continue the edition →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
