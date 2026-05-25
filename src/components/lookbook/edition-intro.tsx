/**
 * EditionIntro — narrow editorial caption block under the hero. Sets the
 * Edition title in display serif, with a thin "Shop the edition" link.
 */
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { Edition } from "@/lib/editions";

export function EditionIntro({ edition }: { edition: Edition }) {
  return (
    <motion.section
      key={`intro-${edition.handle}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="bg-canvas text-ink"
    >
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-20 md:py-28 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-5">
          The Current Edition · {edition.number}
        </p>
        <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] text-balance">
          {edition.title}
        </h2>
        {edition.description && (
          <p className="mt-6 text-sm md:text-[15px] text-muted-foreground leading-relaxed text-pretty">
            {edition.description}
          </p>
        )}
        <div className="mt-9">
          <Link
            to="/collections/$handle"
            params={{ handle: edition.handle }}
            className="inline-flex items-center gap-3 px-9 py-4 bg-ink text-canvas text-[11px] uppercase tracking-[0.3em] hover:bg-bronze transition-colors"
          >
            Shop the edition →
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
