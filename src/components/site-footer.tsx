import { Link } from "@tanstack/react-router";
import { NewsletterForm } from "@/components/newsletter-form";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 pt-32 pb-12 bg-canvas">
      <div className="max-w-screen-2xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between gap-12 mb-32">
          <div className="max-w-[40ch]">
            <h4 className="text-xl font-serif mb-6">Palace of Roman</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The destination for refined multi-brand luxury. Curating the world's most significant designers
              through a singular, architectural lens.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-16">
            <div className="flex flex-col gap-4">
              <h5 className="text-[10px] uppercase tracking-[0.2em] font-semibold">Boutique</h5>
              <Link to="/collections/$handle" params={{ handle: "new-arrivals" }} className="text-sm text-muted-foreground hover:text-ink transition-colors">New Arrivals</Link>
              <Link to="/collections/$handle" params={{ handle: "womens-clothing" }} className="text-sm text-muted-foreground hover:text-ink transition-colors">Women's Clothing</Link>
              <Link to="/collections/$handle" params={{ handle: "womens-shoes" }} className="text-sm text-muted-foreground hover:text-ink transition-colors">Women's Shoes</Link>
              <Link to="/collections/$handle" params={{ handle: "mens-clothing" }} className="text-sm text-muted-foreground hover:text-ink transition-colors">Men's Clothing</Link>
              <Link to="/collections/$handle" params={{ handle: "mens-shoes" }} className="text-sm text-muted-foreground hover:text-ink transition-colors">Men's Shoes</Link>
              <Link to="/collections" className="text-sm text-muted-foreground hover:text-ink transition-colors">All Collections</Link>
              <Link to="/brands" className="text-sm text-muted-foreground hover:text-ink transition-colors">Brands Index</Link>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="text-[10px] uppercase tracking-[0.2em] font-semibold">Client Care</h5>
              <Link to="/shipping-returns" className="text-sm text-muted-foreground hover:text-ink transition-colors">Shipping &amp; Returns</Link>
              <Link to="/authentication" className="text-sm text-muted-foreground hover:text-ink transition-colors">Authentication</Link>
              <Link to="/faq" className="text-sm text-muted-foreground hover:text-ink transition-colors">FAQ</Link>
              <Link to="/contact" className="text-sm text-muted-foreground hover:text-ink transition-colors">Contact</Link>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-ink transition-colors">About</Link>
              <Link to="/journal" className="text-sm text-muted-foreground hover:text-ink transition-colors">Journal</Link>
            </div>
            <div className="hidden md:flex flex-col gap-6">
              <h5 className="text-[10px] uppercase tracking-[0.2em] font-semibold">In Correspondence</h5>
              <form className="relative" onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="Email Address"
                  className="bg-transparent border-b border-ink/20 py-2 w-full text-sm focus:outline-none focus:border-ink transition-colors" />
                <button className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest">Join</button>
              </form>
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                Quiet correspondence — new arrivals, editorials, private previews.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center pt-12 border-t border-ink/5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Palace of Roman. All rights reserved.</p>
          <div className="flex gap-8">
            <Link to="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-ink transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
