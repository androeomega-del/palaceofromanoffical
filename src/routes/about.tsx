import { createFileRoute, Link } from "@tanstack/react-router";
import { EditorialPageShell } from "@/components/editorial-page-shell";
import { img } from "@/lib/editorial-library";
import founderPortrait from "@/assets/founder-portrait-la.jpg";
import { routeHead, breadcrumbJsonLd } from "@/lib/seo";

const ABOUT_TITLE = "House Notes — Palace of Roman";
const ABOUT_DESC = "The story of Palace of Roman — a curated multi-brand boutique for luxury fashion, considered and authenticated.";

export const Route = createFileRoute("/about")({
  head: () => {
    const rh = routeHead({ path: "/about", title: ABOUT_TITLE, description: ABOUT_DESC, image: img(7) });
    const breadcrumb = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "House Notes", path: "/about" },
    ]);
    const organization = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Palace of Roman",
      url: "https://palaceofromanofficial.com",
      logo: "https://palaceofromanofficial.com/favicon.ico",
      email: "support@palaceofromanofficial.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "8605 Santa Monica Blvd",
        addressLocality: "West Hollywood",
        addressRegion: "CA",
        postalCode: "90069",
        addressCountry: "US",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@palaceofromanofficial.com",
        availableLanguage: ["English"],
        areaServed: "Worldwide",
        hoursAvailable: "Mo-Sa 09:00-18:00",
      },
      sameAs: [
        "https://www.instagram.com/palaceofroman/",
        "https://www.facebook.com/people/Palace-of-Roman/61581195176963/",
        "https://www.tiktok.com/@palaceofroman",
        "https://www.yelp.com/biz/palace-of-roman",
        "https://share.google/CZeLml2jcRi9MtNqP",
      ],
    };
    return {
      meta: [{ title: ABOUT_TITLE }, { name: "description", content: ABOUT_DESC }, ...rh.meta],
      links: rh.links,
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(breadcrumb) },
        { type: "application/ld+json", children: JSON.stringify(organization) },
      ],
    };
  },
  component: AboutPage,
});


function AboutPage() {
  return (
    <EditorialPageShell
      eyebrow="House Notes"
      title="A boutique, not a marketplace."
      intro="Palace of Roman is a curated edit of the world's most considered houses — pieces sourced through our network of authorised boutiques and distributors around the world, all 100% authentic and shipped sealed in original packaging."
      heroImage={img(7)}
      heroAlt="A studio still life from the current edit"
    >
      {/* Origin — sourcing narrative */}
      <section className="grid md:grid-cols-12 gap-10 md:gap-16 items-center mb-32">
        <div className="md:col-span-7 order-2 md:order-1">
          <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-4">How we operate</p>
          <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-6 text-balance">
            A modern house, built for the modern collector.
          </h2>
          <p className="text-[15px] leading-[1.8] text-ink/80 mb-4">
            Palace of Roman is a digital-first maison — a quiet evolution of the traditional luxury model. In place
            of a single flagship and a fixed buying calendar, we operate through a seamless digital architecture
            connected directly to a network of authorised European distributors, brand licensees, and tier-one
            supply partners. The result is a private window into the same European vaults that supply the
            continent's most established boutiques — opened, for the first time, to a global clientele on their
            own terms.
          </p>
          <p className="text-[15px] leading-[1.8] text-ink/80 mb-4">
            Because our edit moves through the same authorised channels as the houses' own retail partners,
            new-season pieces are secured at the moment of release — not weeks later, and never through secondary
            markets. When a collection lands in Milan, Paris, or Florence, it lands with us. There is no waiting
            list, no intermediary mark-up, and no compromise on provenance: every piece is current-season, fully
            authenticated, and offered the moment it becomes available.
          </p>
          <p className="text-[15px] leading-[1.8] text-ink/80">
            We do not maintain editorial offices, flagship leases, or celebrity campaigns — and we do not ask our
            clients to underwrite them. Every resource is returned to the parts of the experience that genuinely
            matter: flawless global logistics, rigorous authentication, fully insured express transit, and a
            private concierge that answers personally. The reduction in price you see against traditional retail
            is not a discount. It is the absence of overhead — passed, in full, to you.
          </p>
        </div>
        <div className="md:col-span-5 order-1 md:order-2">
          <div className="aspect-[4/5] overflow-hidden bg-canvas-raised">
            <img src={img(11)} alt="An assembled wardrobe" className="w-full h-full object-cover" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Philosophy — full width image strip */}
      <section className="mb-32">
        <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-4 text-center">Curation</p>
        <h2 className="font-serif text-3xl md:text-5xl tracking-tight text-center max-w-3xl mx-auto mb-12 text-balance">
          Fewer pieces, chosen for the long room.
        </h2>
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {[19, 27, 34].map((n) => (
            <div key={n} className="aspect-[4/5] overflow-hidden bg-canvas-raised">
              <img src={img(n)} alt="Curation studies" className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
        <p className="text-[15px] leading-[1.8] text-ink/80 max-w-2xl mx-auto mt-12 text-center">
          We do not chase volume. The edit is built piece by piece from the catalogues of an authorised European
          distribution partner that holds stock from more than ninety maisons — chosen for cut, material, and the way
          each will live with the others. The result is a boutique you can hold in your head, not a catalogue you
          scroll through.
        </p>
      </section>

      {/* Experience */}
      <section className="grid md:grid-cols-12 gap-10 md:gap-16 items-center mb-32">
        <div className="md:col-span-5">
          <div className="aspect-[4/5] overflow-hidden bg-canvas-raised">
            <img src={img(42)} alt="A piece from the current edit, photographed in studio" className="w-full h-full object-cover" loading="lazy" />
          </div>
        </div>
        <div className="md:col-span-7">
          <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-4">Experience</p>
          <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-6 text-balance">
            The boutique experience, online.
          </h2>
          <p className="text-[15px] leading-[1.8] text-ink/80 mb-4">
            Orders ship directly from the brand-authorised warehouse holding each piece — across Italy, Spain, Austria,
            Sweden, Northern Ireland and the United States — in their original packaging, with tags and dust bag
            intact. Palace of Roman operates online only; there is no showroom or in-person appointment. Styling and
            fit correspondence is available by email, and the concierge replies the same business day.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Link
              to="/contact"
              className="px-6 py-3 bg-ink text-canvas text-[11px] uppercase tracking-[0.25em] hover:bg-ink/85 transition-colors"
            >
              Write to the concierge
            </Link>
            <Link
              to="/authentication"
              className="px-6 py-3 ring-1 ring-ink text-[11px] uppercase tracking-[0.25em] hover:bg-ink hover:text-canvas transition-colors"
            >
              How sourcing &amp; authentication work
            </Link>
          </div>
        </div>
      </section>

      {/* Founder's note */}
      <section className="border-t border-ink/10 pt-20">
        <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start">
          <div className="md:col-span-5">
            <div className="aspect-[4/5] overflow-hidden bg-canvas-raised">
              <img src={founderPortrait} alt="The founder of Palace of Roman, photographed in downtown Los Angeles at golden hour, wearing a three-piece pinstripe suit" className="w-full h-full object-cover" loading="lazy" />
            </div>
          </div>
          <div className="md:col-span-7">
            <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-4">A note from the founder</p>
            <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-6 text-balance">
              One voice, one edit.
            </h2>
            <p className="text-[15px] leading-[1.8] text-ink/80 mb-4">
              Palace of Roman is a small independent house. The selection, the writing, the studio direction and the
              correspondence with clients all come from a single point of view — not a committee, not a department.
              Pieces are chosen because they belong, and the rest is left out.
            </p>
            <p className="text-[15px] leading-[1.8] text-ink/80">
              If you'd like to talk about a piece, a fit, or something you haven't found here, write to me directly.
              I read every note.
            </p>
            <div className="mt-8">
              <Link
                to="/contact"
                className="inline-block text-[11px] uppercase tracking-[0.25em] border-b border-ink pb-1 hover:text-bronze hover:border-bronze transition-colors"
              >
                Write to the founder
              </Link>
            </div>
          </div>
        </div>
      </section>

    </EditorialPageShell>
  );
}
