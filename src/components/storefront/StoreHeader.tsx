import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shirt, ShoppingBag, User, Shield, Search, Menu, X, ChevronDown, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useBranding } from "@/hooks/useBranding";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageSection } from "@/hooks/usePageTemplates";

const StoreHeader = () => {
  const { user, isStaff, signOut } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const branding = useBranding();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const topBarContent = usePageSection("home", "top_bar");

  const { data: categories = [] } = useQuery({
    queryKey: ["header-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name, slug, image_url").order("name").limit(20);
      return data || [];
    },
  });

  // Predictive search
  const { data: searchResults } = useQuery({
    queryKey: ["search-suggestions", searchQuery],
    queryFn: async () => {
      if (searchQuery.trim().length < 2) return { products: [], categories: [] };
      const [prodRes, catRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, slug, base_price, discount_percentage, images(url, position)")
          .eq("is_active", true)
          .ilike("name", `%${searchQuery.trim()}%`)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("categories")
          .select("id, name, slug, image_url")
          .ilike("name", `%${searchQuery.trim()}%`)
          .limit(3),
      ]);
      return {
        products: prodRes.data || [],
        categories: catRes.data || [],
      };
    },
    enabled: searchQuery.trim().length >= 2,
    staleTime: 10_000,
  });

  const megaMenuRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close suggestions + mega menu on outside click/touch
  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSuggestions(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(target)) {
        setShowCategories(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  const openMega = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setShowCategories(true);
  };
  const scheduleCloseMega = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setShowCategories(false), 150);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSuggestions(false);
    }
  };

  const hasSuggestions = (searchResults?.products?.length || 0) > 0 || (searchResults?.categories?.length || 0) > 0;
  const callPhone = topBarContent?.call_phone || "";
  const callHours = topBarContent?.call_hours || "";

  // Split categories into 2 columns for mega menu
  const half = Math.ceil(categories.length / 2);
  const catCol1 = categories.slice(0, half);
  const catCol2 = categories.slice(half);

  return (
    <header className="sticky top-0 z-40">
      {/* Value Proposition Bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-8 text-xs">
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline font-medium">
              {topBarContent?.message || "🚚 Free Shipping on orders over ৳1000 • 24/7 Customer Support"}
            </span>
            <Link to="/support" className="hover:underline sm:hidden">Help</Link>
          </div>
          <div className="flex items-center gap-4">
            {callPhone && (
              <a href={`tel:${callPhone.replace(/\s/g, "")}`} className="hidden md:flex items-center gap-1 hover:underline font-medium">
                <Phone className="h-3 w-3" />
                <span>Call: {callPhone}</span>
                {callHours && <span className="opacity-80">({callHours})</span>}
              </a>
            )}
            {user ? (
              <>
                <Link to="/profile" className="hover:underline">My Account</Link>
                <Link to="/my-orders" className="hover:underline">My Orders</Link>
                <button onClick={() => void signOut()} className="hover:underline">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:underline font-semibold">Login</Link>
                <Link to="/login" className="hover:underline font-semibold">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-14">
            {/* Mobile menu toggle */}
            <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              {branding.logo_url ? (
                <img src={branding.logo_url} alt={branding.store_name} className="h-8 w-8 rounded-lg object-contain group-hover:scale-105 transition-transform" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:scale-105 transition-transform">
                  <Shirt className="h-4 w-4" />
                </div>
              )}
              <span className="font-heading font-bold text-lg text-foreground hidden sm:inline">{branding.store_name}</span>
            </Link>

            {/* Central Search Bar with suggestions */}
            <div ref={searchRef} className="flex-1 max-w-2xl mx-auto relative">
              <form onSubmit={handleSearch}>
                <div className="flex items-center">
                  <Input
                    placeholder="Search products, categories..."
                    className="rounded-r-none border-r-0 h-10 bg-muted/40 focus-visible:ring-1 focus-visible:ring-primary"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                  />
                  <Button type="submit" className="rounded-l-none h-10 px-5">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </form>

              {/* Search Suggestions Dropdown */}
              {showSuggestions && hasSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 max-h-[400px] overflow-y-auto">
                  {searchResults?.categories && searchResults.categories.length > 0 && (
                    <div className="p-2 border-b border-border">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 mb-1">Categories</p>
                      {searchResults.categories.map((cat: any) => (
                        <Link
                          key={cat.id}
                          to={`/shop?category=${cat.slug}`}
                          onClick={() => { setShowSuggestions(false); setSearchQuery(""); }}
                          className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition"
                        >
                          {cat.image_url ? (
                            <img src={cat.image_url} alt={cat.name} className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs">📁</div>
                          )}
                          <span className="text-sm font-medium">{cat.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults?.products && searchResults.products.length > 0 && (
                    <div className="p-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2 mb-1">Products</p>
                      {searchResults.products.map((p: any) => {
                        const img = p.images?.sort((a: any, b: any) => a.position - b.position)?.[0];
                        const price = p.discount_percentage > 0
                          ? Number(p.base_price) * (1 - p.discount_percentage / 100)
                          : Number(p.base_price);
                        return (
                          <Link
                            key={p.id}
                            to={`/product/${p.slug}`}
                            onClick={() => { setShowSuggestions(false); setSearchQuery(""); }}
                            className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition"
                          >
                            {img?.url ? (
                              <img src={img.url} alt={p.name} className="w-10 h-10 rounded object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-lg opacity-30">👕</div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                              <p className="text-xs font-semibold text-primary">৳{Math.round(price)}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1">
              {isStaff && (
                <Link to="/admin">
                  <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Admin panel">
                    <Shield className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Link to={user ? "/profile" : "/login"}>
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Account">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-9 w-9 relative" onClick={() => setIsCartOpen(true)}>
                <ShoppingBag className="h-4 w-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation Bar with Mega Menu */}
      <div className="bg-card border-b border-border hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 h-10 overflow-x-auto scrollbar-hide">
            <Link to="/" className="text-xs font-medium text-foreground hover:text-primary transition-colors px-3 py-1.5 rounded hover:bg-muted whitespace-nowrap">Home</Link>

            {/* Mega Menu */}
            <div
              ref={megaMenuRef}
              className="relative"
              onMouseEnter={openMega}
              onMouseLeave={scheduleCloseMega}
            >
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={showCategories}
                onClick={() => setShowCategories((v) => !v)}
                className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded hover:bg-muted flex items-center gap-1 whitespace-nowrap"
              >
                Shop by Category <ChevronDown className={`h-3 w-3 transition-transform ${showCategories ? "rotate-180" : ""}`} />
              </button>
              {showCategories && categories.length > 0 && (
                <div className="absolute top-full left-0 bg-popover border border-border rounded-lg shadow-2xl z-50 w-[560px] p-5">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase text-primary mb-2 tracking-wider">Browse</p>
                      {catCol1.map((cat) => (
                        <Link
                          key={cat.id}
                          to={`/shop?category=${cat.slug}`}
                          onClick={() => setShowCategories(false)}
                          className="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent hover:text-primary transition group"
                        >
                          {cat.image_url ? (
                            <img src={cat.image_url} alt={cat.name} className="w-7 h-7 rounded object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded bg-muted flex items-center justify-center text-xs opacity-50">📦</div>
                          )}
                          <span className="line-clamp-1">{cat.name}</span>
                        </Link>
                      ))}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold uppercase text-primary mb-2 tracking-wider">More</p>
                      {catCol2.map((cat) => (
                        <Link
                          key={cat.id}
                          to={`/shop?category=${cat.slug}`}
                          onClick={() => setShowCategories(false)}
                          className="flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent hover:text-primary transition"
                        >
                          {cat.image_url ? (
                            <img src={cat.image_url} alt={cat.name} className="w-7 h-7 rounded object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded bg-muted flex items-center justify-center text-xs opacity-50">📦</div>
                          )}
                          <span className="line-clamp-1">{cat.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">{categories.length} categories available</p>
                    <Link
                      to="/categories"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View All Categories →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link to="/shop" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded hover:bg-muted whitespace-nowrap">Shop All</Link>
            <Link to="/shop?sort=newest" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded hover:bg-muted whitespace-nowrap">New Arrivals</Link>
            <Link to="/shop?discounted=true" className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors px-3 py-1.5 rounded hover:bg-muted whitespace-nowrap font-semibold">SALE 🔥</Link>
            <Link to="/about-us" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded hover:bg-muted whitespace-nowrap">About Us</Link>
            <Link to="/support" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded hover:bg-muted whitespace-nowrap">Support</Link>
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-card border-b border-border max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-3 space-y-2">
            {callPhone && (
              <a href={`tel:${callPhone.replace(/\s/g, "")}`} className="flex items-center gap-2 py-2 text-sm font-medium text-primary border-b border-border mb-2">
                <Phone className="h-4 w-4" /> Call to Order: {callPhone}
              </a>
            )}
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium">Home</Link>
            <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium">Shop All</Link>
            <Link to="/shop?discounted=true" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-semibold text-destructive">SALE 🔥</Link>
            <Link to="/categories" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium">All Categories</Link>
            {categories.map((cat) => (
              <Link key={cat.id} to={`/shop?category=${cat.slug}`} onClick={() => setMobileMenuOpen(false)} className="block py-1.5 text-sm text-muted-foreground pl-4">
                {cat.name}
              </Link>
            ))}
            <Link to="/support" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium">Support</Link>
            <Link to="/about-us" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium">About Us</Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default StoreHeader;
