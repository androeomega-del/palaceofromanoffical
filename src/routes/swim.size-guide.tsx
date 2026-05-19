import { createFileRoute, Link } from "@tanstack/react-router";
import { routeHead } from "@/lib/seo";
import sizeHero from "@/assets/swim-size-guide-hero.jpg";
import sizeDetail from "@/assets/swim-size-guide-detail.jpg";

export const Route = createFileRoute("/swim/size-guide")({
  head: () => {
    const title = "Swim Size Guide — Find Your Perfect Fit | Palace of Roman";
    const desc =
      "International size conversions and how-to-measure guidance for designer bikinis, swimsuits and beachwear. Italian, French, UK and US sizing aligned.";
    const rh = routeHead({ path: "/swim/size-guide", title, description: desc });
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:image", content: `https://palaceofroman.com${sizeHero}` },
        { name: "twitter:image", content: `https://palaceofroman.com${sizeHero}` },
        ...rh.meta,
      ],
      links: rh.links,
    };
  },
  component: SwimSizeGuide,
});

/* ---------- Size tables (industry-standard EU/IT/FR/UK/US conversions) ---------- */

const womenSwim = [
  { it: "38", fr: "34", uk: "6",  us: "2",  intl: "XS", bust: "78–82",  waist: "60–64",  hip: "84–88"  },
  { it: "40", fr: "36", uk: "8",  us: "4",  intl: "S",  bust: "82–86",  waist: "64–68",  hip: "88–92"  },
  { it: "42", fr: "38", uk: "10", us: "6",  intl: "M",  bust: "86–90",  waist: "68–72",  hip: "92–96"  },
  { it: "44", fr: "40", uk: "12", us: "8",  intl: "L",  bust: "90–94",  waist: "72–76",  hip: "96–100" },
  { it: "46", fr: "42", uk: "14", us: "10", intl: "XL", bust: "94–98",  waist: "76–80",  hip: "100–104"},
  { it: "48", fr: "44", uk: "16", us: "12", intl: "XXL",bust: "98–102", waist: "80–86",  hip: "104–108"},
];

const menSwim = [
  { intl: "XS", it: "44", chest: "84–88",  waist: "70–74"  },
  { intl: "S",  it: "46", chest: "88–94",  waist: "74–80"  },
  { intl: "M",  it: "48", chest: "94–100", waist: "80–86"  },
  { intl: "L",  it: "50", chest: "100–106",waist: "86–92"  },
  { intl: "XL", it: "52", chest: "106–112",waist: "92–98"  },
  { intl: "XXL",it: "54", chest: "112–118",waist: "98–104" },
];

function SwimSizeGuide() {
  return (
    <div className="bg-canvas">
      {/* ============ HERO ============ */}
      <section className="relative h-[60vh] min-h-[460px] overflow-hidden bg-ink">
        <img
          src={sizeHero}
          alt="Designer white bikini, measuring tape and a handwritten size card on linen"
          className="absolute inset-0 w-full h-full object-cover opacity-95"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
        <div className="relative h-full flex items-end">
          <div className="max-w-screen-2xl mx-auto px-6 md:px-10 pb-14 md:pb-20 w-full">
            <nav className="text-[10px] uppercase tracking-[0.3em] text-canvas/80 mb-4">
              <Link to="/swim" className="hover:text-canvas">Swim</Link>
              <span className="mx-2">/</span>
              <span className="text-canvas">Size Guide</span>
            </nav>
            <h1 className="font-serif text-canvas text-4xl md:text-6xl lg:text-7xl leading-[0.95] max-w-3xl">
              Find Your <span className="italic font-light">Perfect Fit</span>
            </h1>
            <p className="mt-5 max-w-xl text-canvas/85 text-sm md:text-base leading-relaxed">
              International size conversions and how-to-measure guidance for designer
              swim and beachwear — so the piece you choose fits beautifully on arrival.
            </p>
          </div>
        </div>
      </section>

      {/* ============ HOW TO MEASURE ============ */}
      <section className="px-6 md:px-10 py-20 md:py-28">
        <div className="max-w-screen-2xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <figure className="relative overflow-hidden aspect-[3/4]">
            <img
              src={sizeDetail}
              alt="A measuring tape held against a folded swimsuit on linen"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
              width={1080}
              height={1440}
            />
          </figure>

          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-bronze mb-4 block">
              How to Measure
            </span>
            <h2 className="font-serif text-3xl md:text-5xl leading-[1.05] mb-8">
              Three measurements, taken with care.
            </h2>
            <ol className="space-y-7 text-ink/85">
              <li>
                <p className="text-[11px] uppercase tracking-[0.25em] text-ink mb-1">01 — Bust / Chest</p>
                <p className="text-sm leading-relaxed">
                  Wrap the tape around the fullest part of the bust or chest, keeping it
                  parallel to the floor. Breathe normally — do not pull tight.
                </p>
              </li>
              <li>
                <p className="text-[11px] uppercase tracking-[0.25em] text-ink mb-1">02 — Waist</p>
                <p className="text-sm leading-relaxed">
                  Measure the narrowest part of the natural waistline, typically about an
                  inch above the navel.
                </p>
              </li>
              <li>
                <p className="text-[11px] uppercase tracking-[0.25em] text-ink mb-1">03 — Hip</p>
                <p className="text-sm leading-relaxed">
                  Measure around the fullest part of the hips and seat, again keeping the
                  tape level on both sides.
                </p>
              </li>
            </ol>
            <p className="mt-8 text-xs text-muted-foreground italic">
              All measurements in centimetres. If you are between two sizes, we recommend
              sizing up — bikini bottoms and one-pieces are designed to sit close to the body.
            </p>
          </div>
        </div>
      </section>

      {/* ============ WOMEN'S TABLE ============ */}
      <section className="px-6 md:px-10 py-16 md:py-20 border-t border-ink/5 bg-canvas-raised/40">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--sea)] mb-3 block">
                Women — Swim &amp; Beachwear
              </span>
              <h2 className="font-serif text-2xl md:text-4xl">International Conversions</h2>
            </div>
            <span className="hidden md:block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              cm — body measurements
            </span>
          </div>

          <div className="overflow-x-auto -mx-6 md:mx-0 px-6 md:px-0">
            <table className="w-full min-w-[640px] text-sm border-collapse">
              <thead>
                <tr className="border-b border-ink/15 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <th className="text-left py-3 pr-4 font-medium">International</th>
                  <th className="text-left py-3 pr-4 font-medium">IT</th>
                  <th className="text-left py-3 pr-4 font-medium">FR / EU</th>
                  <th className="text-left py-3 pr-4 font-medium">UK</th>
                  <th className="text-left py-3 pr-4 font-medium">US</th>
                  <th className="text-left py-3 pr-4 font-medium">Bust</th>
                  <th className="text-left py-3 pr-4 font-medium">Waist</th>
                  <th className="text-left py-3 font-medium">Hip</th>
                </tr>
              </thead>
              <tbody>
                {womenSwim.map((r) => (
                  <tr key={r.it} className="border-b border-ink/5 hover:bg-ink/[0.02]">
                    <td className="py-4 pr-4 font-serif">{r.intl}</td>
                    <td className="py-4 pr-4">{r.it}</td>
                    <td className="py-4 pr-4">{r.fr}</td>
                    <td className="py-4 pr-4">{r.uk}</td>
                    <td className="py-4 pr-4">{r.us}</td>
                    <td className="py-4 pr-4 text-ink/75">{r.bust}</td>
                    <td className="py-4 pr-4 text-ink/75">{r.waist}</td>
                    <td className="py-4 text-ink/75">{r.hip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ============ MEN'S TABLE ============ */}
      <section className="px-6 md:px-10 py-16 md:py-20">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--sea)] mb-3 block">
                Men — Swim Shorts
              </span>
              <h2 className="font-serif text-2xl md:text-4xl">International Conversions</h2>
            </div>
            <span className="hidden md:block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              cm — body measurements
            </span>
          </div>

          <div className="overflow-x-auto -mx-6 md:mx-0 px-6 md:px-0">
            <table className="w-full min-w-[520px] text-sm border-collapse">
              <thead>
                <tr className="border-b border-ink/15 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  <th className="text-left py-3 pr-4 font-medium">International</th>
                  <th className="text-left py-3 pr-4 font-medium">IT / EU</th>
                  <th className="text-left py-3 pr-4 font-medium">Chest</th>
                  <th className="text-left py-3 font-medium">Waist</th>
                </tr>
              </thead>
              <tbody>
                {menSwim.map((r) => (
                  <tr key={r.it} className="border-b border-ink/5 hover:bg-ink/[0.02]">
                    <td className="py-4 pr-4 font-serif">{r.intl}</td>
                    <td className="py-4 pr-4">{r.it}</td>
                    <td className="py-4 pr-4 text-ink/75">{r.chest}</td>
                    <td className="py-4 text-ink/75">{r.waist}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ============ NOTES + CTA ============ */}
      <section className="px-6 md:px-10 py-20 md:py-24 border-t border-ink/5 bg-ink text-canvas">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--sea)] mb-5 block">
            A Note on Fit
          </span>
          <h2 className="font-serif text-3xl md:text-5xl mb-6 leading-[1.05]">
            Every maison cuts a little differently.
          </h2>
          <p className="text-canvas/80 text-sm md:text-base leading-relaxed mb-10">
            Italian houses tend to run slim through the bust and hip; French and resort
            labels often size more generously. Each product page lists the specific
            designer's size chart in the details panel — always consult it before checkout.
            Our concierge is happy to advise on fit for any piece in the edit.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/swim"
              className="px-8 py-3.5 bg-canvas text-ink text-[10px] uppercase tracking-[0.3em] font-medium hover:bg-[var(--sea)] hover:text-canvas transition-colors"
            >
              Return to the Swim Edit
            </Link>
            <Link
              to="/contact"
              className="px-8 py-3.5 border border-canvas/60 text-canvas text-[10px] uppercase tracking-[0.3em] font-medium hover:bg-canvas hover:text-ink transition-colors"
            >
              Ask the Concierge
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
