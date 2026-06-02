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
        streetAddress: "8605 Santa Monica Blvd PMB 610211",
        addressLocality: "West Hollywood",
        addressRegion: "CA",
        postalCode: "90069-4109",
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
      {/* Origin */}
      <section className="grid md:grid-cols-12 gap-10 md:gap-16 items-center mb-32">
        <div className="md:col-span-7 order-2 md:order-1">
          <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-4">Origin</p>
          <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-6 text-balance">
            An independent boutique, in service of the considered wardrobe.
          </h2>
          <p className="text-[15px] leading-[1.8] text-ink/80 mb-4">
            Palace of Roman was founded on a single conviction: that the great houses of the season deserved a setting
            as edited as the work itself. Not a department store. Not a marketplace. A boutique — assembled by hand,
            presented in studio light, and offered to a small audience who already know what they are looking for.
          </p>
          <p className="text-[15px] leading-[1.8] text-ink/80">
            We carry tailoring, footwear, fine leather and house codes from the maisons we believe in. Palace of Roman
            partners with a network of authorised boutiques and distributors around the world to offer pieces from
            Gucci, Versace, Balenciaga, Dior, Prada, Saint Laurent and the wider catalogue. Every piece is 100%
            authentic, sourced from the brands or their authorised distributors, and shipped sealed in its original
            packaging.
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

      {/* Business identity — transparency block aligned with Google Merchant
          Center policy: legal name, entity, address, contact and operating
          model in one place so reviewers and customers can verify quickly. */}
      <section className="mt-32 pt-12 border-t border-ink/10">
        <p className="text-[10px] uppercase tracking-[0.35em] text-bronze mb-6">Business information</p>
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-3 max-w-3xl">
          <div className="grid grid-cols-[140px_1fr] gap-y-2 text-[13px] leading-relaxed">
            <span className="text-muted-foreground">Legal name</span>
            <span className="text-ink/85">Palace of Roman</span>
            <span className="text-muted-foreground">Founded</span>
            <span className="text-ink/85">Independent boutique, founder-led</span>
          </div>
          <div className="grid grid-cols-[140px_1fr] gap-y-2 text-[13px] leading-relaxed">
            <span className="text-muted-foreground">Address</span>
            <span className="text-ink/85">8605 Santa Monica Blvd PMB 610211<br/>West Hollywood, CA 90069-4109, US</span>
            <span className="text-muted-foreground">Support</span>
            <span className="text-ink/85">
              <a href="mailto:support@palaceofromanofficial.com" className="underline decoration-ink/20 underline-offset-4 hover:text-bronze">
                support@palaceofromanofficial.com
              </a>
            </span>
            <span className="text-muted-foreground">Hours</span>
            <span className="text-ink/85">Mon–Sat · reply within 24 hours</span>
          </div>
        </div>
        <p className="mt-8 text-[12px] text-muted-foreground leading-relaxed max-w-3xl">
          Palace of Roman operates online only. For full disclosures, see our{" "}
          <Link to="/legal-notice" className="underline decoration-ink/20 underline-offset-4 hover:text-bronze">Legal Notice</Link>,{" "}
          <Link to="/shipping-returns" className="underline decoration-ink/20 underline-offset-4 hover:text-bronze">Shipping &amp; Returns</Link>,{" "}
          <Link to="/privacy" className="underline decoration-ink/20 underline-offset-4 hover:text-bronze">Privacy Policy</Link>, and{" "}
          <Link to="/terms" className="underline decoration-ink/20 underline-offset-4 hover:text-bronze">Terms &amp; Conditions</Link>.
        </p>
      </section>
    </EditorialPageShell>
  );
}
