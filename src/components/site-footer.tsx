import { Link } from "@tanstack/react-router";
import { NewsletterForm } from "@/components/newsletter-form";
import { useIsAdmin } from "@/hooks/use-is-admin";

// Frozen at module load so the copyright year is identical on server and
// client renders, avoiding any hydration mismatch around year boundaries.
const COPYRIGHT_YEAR = new Date().getFullYear();

export function SiteFooter() {
  const isAdmin = useIsAdmin();
  return (
    <footer className="border-t border-ink/10 pt-24 pb-10 bg-canvas">
      <div className="max-w-screen-2xl mx-auto px-6">
        {/* ───── Newsletter band (Farfetch-style top) ───── */}
        <div className="grid lg:grid-cols-[1fr_minmax(360px,420px)] gap-12 pb-16 mb-16 border-b border-ink/10 items-start">
          <div className="max-w-[46ch]">
            <h3 className="text-2xl font-serif mb-4">Palace of Roman</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The destination for refined multi-brand luxury. Curating the world's most significant designers through a singular, architectural lens.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <h5 className="text-[10px] uppercase tracking-[0.25em] font-semibold">SUBSCRIBE</h5>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Enter your email to receive updates on new arrivals, exclusive collection drops, and boutique releases.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* ───── 4-column link grid (Farfetch IA) ───── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-16 mb-20">
          <div className="flex flex-col gap-3">
            <h5 className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-1">Customer Service</h5>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-ink transition-colors">Contact Us</Link>
            <Link to="/faq" className="text-sm text-muted-foreground hover:text-ink transition-colors">FAQs</Link>
            <Link to="/shipping-returns" className="text-sm text-muted-foreground hover:text-ink transition-colors">Shipping &amp; Returns</Link>
            <Link to="/reviews" className="text-sm text-muted-foreground hover:text-ink transition-colors">Client Reviews</Link>
            <Link to="/account" className="text-sm text-muted-foreground hover:text-ink transition-colors">Order Tracking</Link>

          </div>

          <div className="flex flex-col gap-3">
            <h5 className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-1">About Palace of Roman</h5>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-ink transition-colors">About Us</Link>
            <Link to="/maison" className="text-sm text-muted-foreground hover:text-ink transition-colors">Maisons</Link>
            <Link to="/journal" className="text-sm text-muted-foreground hover:text-ink transition-colors">The Journal</Link>
            <Link to="/journal/craftsmanship/made-in-italy-vs-designed-in-italy" className="text-sm text-muted-foreground hover:text-ink transition-colors">Our Sourcing</Link>
            <Link to="/compare" className="text-sm text-muted-foreground hover:text-ink transition-colors">Compare</Link>
            <Link to="/legal-notice" className="text-sm text-muted-foreground hover:text-ink transition-colors">Legal Notice</Link>
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-ink transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-ink transition-colors">Terms &amp; Conditions</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h5 className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-1">Shop</h5>
            <Link to="/women" className="text-sm text-muted-foreground hover:text-ink transition-colors">Women</Link>
            <Link to="/men" className="text-sm text-muted-foreground hover:text-ink transition-colors">Men</Link>
            <Link to="/collections/$handle" params={{ handle: "new-arrivals" }} className="text-sm text-muted-foreground hover:text-ink transition-colors">New In</Link>
            <Link to="/brands" className="text-sm text-muted-foreground hover:text-ink transition-colors">Designers A–Z</Link>
            <Link to="/luxury-designer-fashion" className="text-sm text-muted-foreground hover:text-ink transition-colors">Luxury Designer Fashion</Link>
            <Link to="/in-rome" className="text-sm text-muted-foreground hover:text-ink transition-colors">In Rome</Link>
            <Link to="/collections" className="text-sm text-muted-foreground hover:text-ink transition-colors">All Collections</Link>
            <Link to="/style-quiz" className="text-sm text-muted-foreground hover:text-ink transition-colors">Style Quiz</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h5 className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-1">Discover</h5>
            <Link to="/edits/the-cucinelli-edit" className="text-sm text-muted-foreground hover:text-ink transition-colors">The Cucinelli Edit</Link>
            <Link to="/edits/the-prada-effect" className="text-sm text-muted-foreground hover:text-ink transition-colors">The Prada Effect</Link>
            <Link to="/edits/dolce-romana" className="text-sm text-muted-foreground hover:text-ink transition-colors">Dolce Romana</Link>
            <Link to="/edits/the-bag-vault" className="text-sm text-muted-foreground hover:text-ink transition-colors">The Bag Vault</Link>
            <Link to="/journal/craftsmanship/spot-real-italian-leather" className="text-sm text-muted-foreground hover:text-ink transition-colors">Spot Real Italian Leather</Link>
            <Link to="/journal/craftsmanship/caring-for-fine-leather" className="text-sm text-muted-foreground hover:text-ink transition-colors">Caring for Fine Leather</Link>
          </div>
        </div>

        {/* ───── Editorial & story index (link-graph backbone) ───── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-16 mb-20 pt-4 border-t border-ink/5">
          <div className="flex flex-col gap-3">
            <h5 className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-1">The Edits</h5>
            <Link to="/edits/yacht-edit" className="text-sm text-muted-foreground hover:text-ink transition-colors">Yacht Edit</Link>
            <Link to="/edits/charter-capsule" className="text-sm text-muted-foreground hover:text-ink transition-colors">Charter Capsule</Link>
            <Link to="/edits/the-cucinelli-edit" className="text-sm text-muted-foreground hover:text-ink transition-colors">The Cucinelli Edit</Link>
            <Link to="/edits/the-prada-effect" className="text-sm text-muted-foreground hover:text-ink transition-colors">The Prada Effect</Link>
            <Link to="/edits/dolce-romana" className="text-sm text-muted-foreground hover:text-ink transition-colors">Dolce Romana</Link>
            <Link to="/edits/the-bag-vault" className="text-sm text-muted-foreground hover:text-ink transition-colors">The Bag Vault</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h5 className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-1">Editorials</h5>
            <Link to="/editorial/resort-2026" className="text-sm text-muted-foreground hover:text-ink transition-colors">Resort 2026</Link>
            <Link to="/editorial/may-2026" className="text-sm text-muted-foreground hover:text-ink transition-colors">May 2026</Link>
            <Link to="/editorial/summer-edit" className="text-sm text-muted-foreground hover:text-ink transition-colors">Summer Edit</Link>
            <Link to="/editorial/the-new-evening" className="text-sm text-muted-foreground hover:text-ink transition-colors">The New Evening</Link>
            <Link to="/editorial/shoreline-perspective" className="text-sm text-muted-foreground hover:text-ink transition-colors">Shoreline Perspective</Link>
            <Link to="/editorial/accessories" className="text-sm text-muted-foreground hover:text-ink transition-colors">Accessories Edit</Link>
            <Link to="/editorial/mens-edit" className="text-sm text-muted-foreground hover:text-ink transition-colors">Men's Edit</Link>
            <Link to="/editorial/womens-edit" className="text-sm text-muted-foreground hover:text-ink transition-colors">Women's Edit</Link>
            <Link to="/editorial/versace" className="text-sm text-muted-foreground hover:text-ink transition-colors">Versace Editorial</Link>
            <Link to="/editorial/versace-now" className="text-sm text-muted-foreground hover:text-ink transition-colors">Versace Now</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h5 className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-1">The Journal</h5>
            <Link to="/journal" className="text-sm text-muted-foreground hover:text-ink transition-colors">All Articles</Link>
            <Link to="/journal/craftsmanship/spot-real-italian-leather" className="text-sm text-muted-foreground hover:text-ink transition-colors">Spot Real Italian Leather</Link>
            <Link to="/journal/craftsmanship/caring-for-fine-leather" className="text-sm text-muted-foreground hover:text-ink transition-colors">Caring for Fine Leather</Link>
            <Link to="/journal/craftsmanship/leather-quality-guide" className="text-sm text-muted-foreground hover:text-ink transition-colors">Leather Quality Guide</Link>
            <Link to="/journal/craftsmanship/made-in-italy-vs-designed-in-italy" className="text-sm text-muted-foreground hover:text-ink transition-colors">Made in Italy vs Designed in Italy</Link>
            <Link to="/journal/style/the-cashmere-field-guide" className="text-sm text-muted-foreground hover:text-ink transition-colors">The Cashmere Field Guide</Link>
            <Link to="/journal/style/the-investment-sunglasses-edit" className="text-sm text-muted-foreground hover:text-ink transition-colors">Investment Sunglasses</Link>
            <Link to="/journal/style/luxury-sneakers-as-modern-tailoring" className="text-sm text-muted-foreground hover:text-ink transition-colors">Sneakers as Modern Tailoring</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h5 className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-1">Preloved &amp; Trends</h5>
            <Link to="/preloved" className="text-sm text-muted-foreground hover:text-ink transition-colors">The Preloved Edit</Link>
            <Link to="/preloved/$condition" params={{ condition: "pristine" }} className="text-sm text-muted-foreground hover:text-ink transition-colors">Pristine Condition</Link>
            <Link to="/preloved/$condition" params={{ condition: "excellent" }} className="text-sm text-muted-foreground hover:text-ink transition-colors">Excellent Condition</Link>
            <Link to="/preloved/$condition" params={{ condition: "new-with-tags" }} className="text-sm text-muted-foreground hover:text-ink transition-colors">New with Tags</Link>
            <Link to="/trends/tom-ford-essentials" className="text-sm text-muted-foreground hover:text-ink transition-colors">Tom Ford Essentials</Link>
            <Link to="/trends/dolce-gabbana-icons" className="text-sm text-muted-foreground hover:text-ink transition-colors">Dolce &amp; Gabbana Icons</Link>
            <Link to="/trends/pucci-eyewear" className="text-sm text-muted-foreground hover:text-ink transition-colors">Pucci Eyewear</Link>
            <Link to="/women/ss26" className="text-sm text-muted-foreground hover:text-ink transition-colors">Women SS26</Link>
            <Link to="/men/ss26" className="text-sm text-muted-foreground hover:text-ink transition-colors">Men SS26</Link>
            <Link to="/limited-finds" className="text-sm text-muted-foreground hover:text-ink transition-colors">Limited Finds</Link>
            <Link to="/vacation-stylist" className="text-sm text-muted-foreground hover:text-ink transition-colors">Vacation Stylist</Link>
            <Link to="/campaign/mens-swim" className="text-sm text-muted-foreground hover:text-ink transition-colors">Men's Swim Campaign</Link>
          </div>
        </div>

        {/* ───── Trust & Provenance ───── */}
        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr] gap-10 md:gap-16 pt-4 pb-12 border-t border-ink/5">
          <div className="flex flex-col gap-3">
            <h5 className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-1">Trust &amp; Provenance</h5>
            <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[40ch]">
              Sourced through authorised European distribution networks under EU commercial law. Insured express transit, signature on delivery.
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              <span className="font-semibold text-ink/70">Couriers</span>
              <span className="opacity-30">·</span>
              <span>DHL Express</span>
              <span className="opacity-30">·</span>
              <span>FedEx</span>
              <span className="opacity-30">·</span>
              <span>UPS</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/sourcing-architecture" className="text-sm text-muted-foreground hover:text-ink transition-colors">Sourcing Architecture</Link>
            <Link to="/sourcing-architecture" hash="authenticity" className="text-sm text-muted-foreground hover:text-ink transition-colors">Authenticity Guarantee</Link>
            <Link to="/sourcing-architecture" hash="logistics" className="text-sm text-muted-foreground hover:text-ink transition-colors">European Logistics &amp; Tracking</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h5 className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-1">Shop By City</h5>
            <Link to="/designer-fashion-new-york" className="text-sm text-muted-foreground hover:text-ink transition-colors">New York</Link>
            <Link to="/designer-fashion-los-angeles" className="text-sm text-muted-foreground hover:text-ink transition-colors">Los Angeles</Link>
            <Link to="/designer-fashion-miami" className="text-sm text-muted-foreground hover:text-ink transition-colors">Miami</Link>
            <Link to="/designer-fashion-san-francisco" className="text-sm text-muted-foreground hover:text-ink transition-colors">San Francisco</Link>
          </div>
        </div>


        {/* ───── Trust & support bar ───── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 py-12 border-t border-ink/10">
          <Link to="/shipping-returns" className="group flex flex-col gap-2 hover:text-ink transition-colors">
            <span className="text-[10px] uppercase tracking-[0.25em] font-semibold">Express Shipping</span>
            <span className="text-sm text-muted-foreground group-hover:text-ink/80 transition-colors leading-relaxed">Complimentary worldwide express delivery on orders over $250.</span>
          </Link>
          <Link to="/shipping-returns" className="group flex flex-col gap-2 hover:text-ink transition-colors">
            <span className="text-[10px] uppercase tracking-[0.25em] font-semibold">14-Day Returns</span>
            <span className="text-sm text-muted-foreground group-hover:text-ink/80 transition-colors leading-relaxed">Easy returns within 14 days of delivery. Unworn, tags attached.</span>
          </Link>
          <Link to="/authentication" className="group flex flex-col gap-2 hover:text-ink transition-colors">
            <span className="text-[10px] uppercase tracking-[0.25em] font-semibold">Authenticity Guaranteed</span>
            <span className="text-sm text-muted-foreground group-hover:text-ink/80 transition-colors leading-relaxed">Every piece is new, sealed and sourced from authorised partners.</span>
          </Link>
          <Link to="/contact" className="group flex flex-col gap-2 hover:text-ink transition-colors">
            <span className="text-[10px] uppercase tracking-[0.25em] font-semibold">Concierge</span>
            <span className="text-sm text-muted-foreground group-hover:text-ink/80 transition-colors leading-relaxed">Personal styling and sourcing — replies within 24 hours, Mon–Sat.</span>
          </Link>
        </div>

        {/* ───── Payments row ───── */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-6 border-t border-ink/10 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="font-semibold text-ink/70">Secure Checkout</span>
          <span className="opacity-30">·</span>
          <span>Visa</span><span className="opacity-30">·</span>
          <span>Mastercard</span><span className="opacity-30">·</span>
          <span>Amex</span><span className="opacity-30">·</span>
          <span>Apple Pay</span><span className="opacity-30">·</span>
          <span>Shop Pay</span><span className="opacity-30">·</span>
          <span>Klarna</span>
        </div>


        {/* ───── Legal / social bottom bar ───── */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center pt-6 mt-2 border-t border-ink/5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <p>&copy; {COPYRIGHT_YEAR} Palace of Roman. All rights reserved.</p>
          <div className="flex gap-6 items-center flex-wrap justify-center">
            <a href="https://www.instagram.com/palaceofroman/" target="_blank" rel="noopener noreferrer" aria-label="Palace of Roman on Instagram" className="hover:text-ink transition-colors">Instagram</a>
            <a href="https://www.facebook.com/people/Palace-of-Roman/61581195176963/" target="_blank" rel="noopener noreferrer" aria-label="Palace of Roman on Facebook" className="hover:text-ink transition-colors">Facebook</a>
            <a href="https://www.tiktok.com/@palaceofroman" target="_blank" rel="noopener noreferrer" aria-label="Palace of Roman on TikTok" className="hover:text-ink transition-colors">TikTok</a>
            <a href="https://share.google/CZeLml2jcRi9MtNqP" target="_blank" rel="noopener noreferrer" aria-label="Palace of Roman on Google" className="hover:text-ink transition-colors">Google</a>

            <Link to="/legal-notice" className="hover:text-ink transition-colors">Legal</Link>
            <Link to="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-ink transition-colors">Terms</Link>
            {isAdmin ? (
              <Link to="/admin" className="text-bronze hover:text-ink transition-colors">Admin</Link>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
}
