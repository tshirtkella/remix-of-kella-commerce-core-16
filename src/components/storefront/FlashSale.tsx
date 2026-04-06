import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useCurrency } from "@/hooks/useCurrency";
import { Zap } from "lucide-react";

const FlashSale = () => {
  const { format } = useCurrency();

  const { data: products = [] } = useQuery({
    queryKey: ["flash-sale-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), variants(price_override, inventory_quantity), images(url, alt_text, position)")
        .eq("is_active", true)
        .gt("discount_percentage", 0)
        .order("discount_percentage", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-destructive fill-destructive" />
            <h2 className="text-xl font-bold font-heading">Flash Sale</h2>
            <span className="text-sm text-destructive font-semibold ml-2">On Sale Now</span>
          </div>
          <Link
            to="/shop?sale=true"
            className="text-sm font-semibold border border-primary text-primary px-4 py-1.5 rounded-lg hover:bg-primary hover:text-primary-foreground transition"
          >
            SHOP ALL PRODUCTS
          </Link>
        </div>

        {/* Product scroll */}
        <div className="flex gap-0 overflow-x-auto scrollbar-hide">
          {products.map((product) => {
            const minPrice = product.variants?.length
              ? Math.min(...product.variants.map((v: any) => v.price_override ?? product.base_price))
              : product.base_price;
            const discounted = Number(minPrice) * (1 - product.discount_percentage / 100);
            const original = Number(minPrice);

            return (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="flex-shrink-0 w-44 md:w-52 p-3 border-r border-border last:border-r-0 hover:bg-muted/30 transition group"
              >
                <div className="aspect-square bg-muted/30 rounded-lg overflow-hidden mb-2">
                  {product.images?.[0]?.url ? (
                    <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">👕</div>
                  )}
                </div>
                <h3 className="text-sm font-medium line-clamp-2 leading-tight">{product.name}</h3>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-base font-bold text-primary">{format(discounted)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="line-through">{format(original)}</span>
                  <span className="text-destructive font-semibold">-{product.discount_percentage}%</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FlashSale;
