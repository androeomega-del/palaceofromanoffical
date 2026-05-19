import { Link } from "@tanstack/react-router";

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
              <Link to="/brands" className="text-sm text-muted-foreground hover:text-ink transition-colors">Brands Index</Link>
            </div>
            <div className="flex flex-col gap-4">
              <h5 className="text-[10px] uppercase tracking-[0.2em] font-semibold">Client Care</h5>
              <a href="#" className="text-sm text-muted-foreground hover:text-ink transition-colors">Shipping &amp; Returns</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-ink transition-colors">Order Tracking</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-ink transition-colors">Authentication</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-ink transition-colors">Contact</a>
            </div>
            <div className="hidden md:flex flex-col gap-6">
              <h5 className="text-[10px] uppercase tracking-[0.2em] font-semibold">In Correspondence</h5>
              <form className="relative" onSubmit={(e) => e.preventDefault()}>
                <input type="email" placeholder="Email Address"
                  className="bg-transparent border-b border-ink/20 py-2 w-full text-sm focus:outline-none focus:border-ink transition-colors" />
                <button className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest">Join</button>
              </form>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center pt-12 border-t border-ink/5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Palace of Roman. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-ink transition-colors">Privacy</a>
            <a href="#" className="hover:text-ink transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
