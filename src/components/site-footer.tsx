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
            <h5 className="text-[10px] uppercase tracking-[0.25em] font-semibold">Sign up for our newsletter</h5>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Sign up for our newsletter — you might receive promo codes here and there.
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
