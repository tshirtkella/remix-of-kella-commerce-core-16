import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shirt, ShoppingBag, User, Shield, Search, Menu, X, ChevronDown } from "lucide-react";
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
      const { data } = await supabase.from("categories").select("id, name, slug, image_url").order("name").limit(10);
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

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSuggestions(false);
    }
  };

  const hasSuggestions = (searchResults?.products?.length || 0) > 0 || (searchResults?.categories?.length || 0) > 0;

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
                  {/* Category suggestions */}
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
                  {/* Product suggestions */}
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

      {/* Category Navigation Bar */}
      <div className="bg-card border-b border-border hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 h-10 overflow-x-auto scrollbar-hide">
            <Link to="/" className="text-xs font-medium text-foreground hover:text-primary transition-colors px-3 py-1.5 rounded hover:bg-muted whitespace-nowrap">Home</Link>
            <div className="relative group" onMouseEnter={() => setShowCategories(true)} onMouseLeave={() => setShowCategories(false)}>
              <button className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded hover:bg-muted flex items-center gap-1 whitespace-nowrap">
                Categories <ChevronDown className="h-3 w-3" />
              </button>
              {showCategories && (
                <div className="absolute top-full left-0 bg-popover border border-border rounded-lg shadow-lg z-50 min-w-[180px] py-1">
                  <Link to="/categories" className="block px-4 py-2 text-sm hover:bg-accent transition-colors font-medium text-primary">All Categories</Link>
                  {categories.map((cat) => (
                    <Link key={cat.id} to={`/shop?category=${cat.slug}`} className="block px-4 py-2 text-sm hover:bg-accent transition-colors">
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <Link to="/shop" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded hover:bg-muted whitespace-nowrap">Shop All</Link>
            <Link to="/about-us" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded hover:bg-muted whitespace-nowrap">About Us</Link>
            <Link to="/support" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded hover:bg-muted whitespace-nowrap">Support</Link>
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-card border-b border-border">
          <div className="px-4 py-3 space-y-2">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium">Home</Link>
            <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium">Shop All</Link>
            <Link to="/categories" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium">Categories</Link>
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
