import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams } from "react-router-dom";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreFooter from "@/components/storefront/StoreFooter";
import ProductCard from "@/components/storefront/ProductCard";
import { usePageSection } from "@/hooks/usePageTemplates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

const Shop = () => {
  const content = usePageSection("shop", "hero");
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");
  const searchQuery = searchParams.get("search") || "";
  const discountedOnly = searchParams.get("discounted") === "true";
  const sortParam = searchParams.get("sort");

  const [sortBy, setSortBy] = useState(sortParam || "newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Sync sort with URL changes (e.g. clicking "New Arrivals" in header)
  useEffect(() => {
    if (sortParam) setSortBy(sortParam);
  }, [sortParam]);

  const { data: categories = [] } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, slug").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: rawProducts = [] } = useQuery({
    queryKey: ["shop-products", categorySlug, searchQuery],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("*, categories(name, slug), variants(id, is_active, color, size, price_override, inventory_quantity), images(url, alt_text, position)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (categorySlug) {
        const cat = categories.find((c) => c.slug === categorySlug);
        if (cat) q = q.eq("category_id", cat.id);
      }
      if (searchQuery) {
        q = q.ilike("name", `%${searchQuery}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !categorySlug || categories.length > 0,
  });

  // Extract all available colors and sizes
  const allColors = useMemo(() => {
    const s = new Set<string>();
    rawProducts.forEach((p: any) => p.variants?.forEach((v: any) => v.is_active && s.add(v.color)));
    return [...s].sort();
  }, [rawProducts]);

  const allSizes = useMemo(() => {
    const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
    const s = new Set<string>();
    rawProducts.forEach((p: any) => p.variants?.forEach((v: any) => v.is_active && s.add(v.size)));
    return [...s].sort((a, b) => {
      const ia = sizeOrder.indexOf(a), ib = sizeOrder.indexOf(b);
      if (ia >= 0 && ib >= 0) return ia - ib;
      if (ia >= 0) return -1;
      if (ib >= 0) return 1;
      return a.localeCompare(b);
    });
  }, [rawProducts]);

  // Filter and sort
  const products = useMemo(() => {
    let filtered = rawProducts.filter((p: any) => {
      if (discountedOnly && (!p.discount_percentage || p.discount_percentage <= 0)) return false;
      const minPrice = p.variants?.length
        ? Math.min(...p.variants.map((v: any) => v.price_override ?? p.base_price))
        : p.base_price;
      const effectivePrice = p.discount_percentage > 0 ? Number(minPrice) * (1 - p.discount_percentage / 100) : Number(minPrice);
      if (effectivePrice < priceRange[0] || effectivePrice > priceRange[1]) return false;

      if (selectedColors.length > 0) {
        const prodColors = p.variants?.filter((v: any) => v.is_active).map((v: any) => v.color) || [];
        if (!selectedColors.some((c) => prodColors.includes(c))) return false;
      }
      if (selectedSizes.length > 0) {
        const prodSizes = p.variants?.filter((v: any) => v.is_active).map((v: any) => v.size) || [];
        if (!selectedSizes.some((s) => prodSizes.includes(s))) return false;
      }
      return true;
    });

    // Sort
    filtered.sort((a: any, b: any) => {
      const priceA = Number(a.base_price) * (1 - (a.discount_percentage || 0) / 100);
      const priceB = Number(b.base_price) * (1 - (b.discount_percentage || 0) / 100);
      switch (sortBy) {
        case "price_low": return priceA - priceB;
        case "price_high": return priceB - priceA;
        case "popular": return (b.discount_percentage || 0) - (a.discount_percentage || 0);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [rawProducts, sortBy, priceRange, selectedColors, selectedSizes, discountedOnly]);

  const hasActiveFilters = selectedColors.length > 0 || selectedSizes.length > 0 || priceRange[0] > 0 || priceRange[1] < 50000;

  const clearFilters = () => {
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange([0, 50000]);
  };

  const toggleColor = (c: string) => setSelectedColors((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  const toggleSize = (s: string) => setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StoreHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold font-heading">
            {searchQuery
              ? `Results for "${searchQuery}"`
              : discountedOnly
                ? "🔥 Sale — Discounted Products"
                : categorySlug
                  ? categories.find((c) => c.slug === categorySlug)?.name ?? "Shop"
                  : content?.heading || "All Products"}
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{products.length} products</span>
            <Button variant="outline" size="sm" className="lg:hidden gap-2" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" /> Filters
            </Button>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link to="/shop"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!categorySlug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            All
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} to={`/shop?category=${cat.slug}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${categorySlug === cat.slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {cat.name}
            </Link>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className={`shrink-0 w-56 space-y-6 ${showFilters ? "block" : "hidden lg:block"}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase text-muted-foreground">Filters</h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-destructive hover:underline flex items-center gap-1">
                  <X className="h-3 w-3" /> Clear all
                </button>
              )}
            </div>

            {/* Sort */}
            <div>
              <p className="text-xs font-semibold mb-2 text-muted-foreground">Sort By</p>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div>
              <p className="text-xs font-semibold mb-2 text-muted-foreground">Price Range</p>
              <Slider
                min={0} max={50000} step={100}
                value={priceRange}
                onValueChange={(v) => setPriceRange(v as [number, number])}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>৳{priceRange[0]}</span>
                <span>৳{priceRange[1]}</span>
              </div>
            </div>

            {/* Colors */}
            {allColors.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2 text-muted-foreground">Color</p>
                <div className="flex flex-wrap gap-1.5">
                  {allColors.map((c) => (
                    <button key={c} onClick={() => toggleColor(c)}
                      className={`px-3 py-1 rounded-full border text-xs font-medium transition ${selectedColors.includes(c) ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/50"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {allSizes.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2 text-muted-foreground">Size</p>
                <div className="flex flex-wrap gap-1.5">
                  {allSizes.map((s) => (
                    <button key={s} onClick={() => toggleSize(s)}
                      className={`min-w-[36px] px-2.5 py-1 rounded border text-xs font-medium transition ${selectedSizes.includes(s) ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/50"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Product grid */}
          <div className="flex-1">
            {/* Mobile sort */}
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <span className="text-sm text-muted-foreground">{products.length} products</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {products.length === 0 && (
              <p className="text-center text-muted-foreground py-16">No products found.</p>
            )}
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
};

export default Shop;
