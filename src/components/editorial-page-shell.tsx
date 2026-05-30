import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title?: string;
  intro?: string;
  heroImage?: string;
  heroAlt?: string;
  children: ReactNode;
};

export function EditorialPageShell({ eyebrow, title, intro, heroImage, heroAlt, children }: Props) {
  return (
    <main className="bg-canvas text-ink">
      {heroImage ? (
        <section className="relative w-full aspect-[16/8] md:aspect-[21/8] overflow-hidden bg-canvas-raised">
          <img
            src={heroImage}
            alt={heroAlt ?? title ?? eyebrow}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 max-w-screen-2xl mx-auto px-6 pb-10 md:pb-16 text-white">
            {/* text-bronze passes on dark hero gradient overlay (~4.5:1) — do not change to bronze-deep */}
            <p className="text-[10px] uppercase tracking-[0.4em] text-bronze mb-4">{eyebrow}</p>
            {title ? (
              <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.02] tracking-tight max-w-3xl text-balance">
                {title}
              </h1>
            ) : (
              <h1 className="sr-only">{eyebrow}</h1>
            )}
            {intro && <p className="mt-6 max-w-xl text-sm md:text-base text-white/80 leading-relaxed">{intro}</p>}
          </div>
        </section>
      ) : (
        <section className="px-6 pt-20 md:pt-28 pb-12 border-b border-ink/5">
          <div className="max-w-screen-2xl mx-auto">
            <p className="text-[10px] uppercase tracking-[0.4em] text-bronze-deep mb-4">{eyebrow}</p>
            {title ? (
              <h1 className="font-serif text-5xl md:text-7xl tracking-tight leading-[1.02] text-balance max-w-3xl">
                {title}
              </h1>
            ) : (
              <h1 className="sr-only">{eyebrow}</h1>
            )}
            {intro && <p className="mt-8 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">{intro}</p>}
          </div>
        </section>
      )}

      <div className="max-w-screen-2xl mx-auto px-6 py-12 md:py-24">{children}</div>
    </main>
  );
}

export function ProseColumn({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[68ch] mx-auto space-y-8 text-[15px] md:text-base leading-[1.75] text-ink/85">
      {children}
    </div>
  );
}

export function SectionTitle({ kicker, children }: { kicker?: string; children: ReactNode }) {
  return (
    <div className="mb-6">
      {kicker && <p className="text-[10px] uppercase tracking-[0.3em] text-bronze-deep mb-3">{kicker}</p>}
      <h2 className="font-serif text-2xl md:text-3xl tracking-tight text-balance">{children}</h2>
    </div>
  );
}
