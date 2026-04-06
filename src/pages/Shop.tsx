import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useSearchParams } from "react-router-dom";
import { useCurrency } from "@/hooks/useCurrency";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreFooter from "@/components/storefront/StoreFooter";

const Shop = () => {
  const { format } = useCurrency();
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
        .select("*, categories(name, slug), variants(price_override, inventory_quantity), images(url, alt_text, position)")
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
                : "All Products"}
          </h1>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => {
            const minPrice = product.variants?.length
              ? Math.min(...product.variants.map((v: any) => v.price_override ?? product.base_price))
              : product.base_price;
            const totalStock = product.variants?.reduce((s: number, v: any) => s + v.inventory_quantity, 0) ?? 0;

            return (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <div className="aspect-square bg-muted/50 flex items-center justify-center relative overflow-hidden">
                  {product.images?.[0]?.url ? (
                    <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-4xl opacity-20">👕</span>
                  )}
                  {totalStock === 0 && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded">SOLD OUT</span>
                  )}
                  {totalStock > 0 && totalStock < 5 && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-warning text-warning-foreground px-2 py-0.5 rounded">LOW STOCK</span>
                  )}
                  {product.discount_percentage > 0 && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded">
                      {product.discount_percentage}% OFF
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-muted-foreground">{(product as any).categories?.name || "Uncategorized"}</p>
                  <h3 className="font-semibold text-sm mt-0.5 group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
                  {product.discount_percentage > 0 ? (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-bold text-base">{format(Number(minPrice) * (1 - product.discount_percentage / 100))}</p>
                      <p className="text-xs text-muted-foreground line-through">{format(Number(minPrice))}</p>
                    </div>
                  ) : (
                    <p className="font-bold text-base mt-1">{format(Number(minPrice))}</p>
                  )}
                </div>
              </Link>
            );
          })}
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
