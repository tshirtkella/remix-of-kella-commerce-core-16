import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams } from "react-router-dom";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreFooter from "@/components/storefront/StoreFooter";
import ProductCard from "@/components/storefront/ProductCard";
import { usePageSection } from "@/hooks/usePageTemplates";

const Shop = () => {
  const content = usePageSection("shop", "hero");
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");
  const searchQuery = searchParams.get("search") || "";

  const { data: categories = [] } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, slug").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StoreHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold font-heading">
            {searchQuery
              ? `Results for "${searchQuery}"`
              : categorySlug
                ? categories.find((c) => c.slug === categorySlug)?.name ?? "Shop"
                : content?.heading || "All Products"}
          </h1>
          <span className="text-sm text-muted-foreground">{products.length} products</span>
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            to="/shop"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !categorySlug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categorySlug === cat.slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {products.length === 0 && (
          <p className="text-center text-muted-foreground py-16">No products found.</p>
        )}
      </main>
      <StoreFooter />
    </div>
  );
};

export default Shop;
