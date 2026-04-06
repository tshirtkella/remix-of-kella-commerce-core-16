import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useCurrency } from "@/hooks/useCurrency";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 12;

const JustForYou = () => {
  const { format } = useCurrency();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["just-for-you", page],
    queryFn: async () => {
      const from = 0;
      const to = page * PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from("products")
        .select("*, categories(name), variants(price_override, inventory_quantity), images(url, alt_text, position)", { count: "exact" })
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { products: data, total: count || 0 };
    },
  });

  const products = data?.products || [];
  const total = data?.total || 0;
  const hasMore = products.length < total;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold font-heading mb-6">Just For You</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {products.map((product) => {
          const minPrice = product.variants?.length
            ? Math.min(...product.variants.map((v: any) => v.price_override ?? product.base_price))
            : product.base_price;
          const hasDiscount = product.discount_percentage > 0;
          const discounted = hasDiscount ? Number(minPrice) * (1 - product.discount_percentage / 100) : Number(minPrice);

          return (
            <Link
              key={product.id}
              to={`/product/${product.slug}`}
              className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="aspect-square bg-muted/30 overflow-hidden relative">
                {product.images?.[0]?.url ? (
                  <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">👕</div>
                )}
                {hasDiscount && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded">
                    -{product.discount_percentage}%
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium line-clamp-2 leading-tight min-h-[2.5rem]">{product.name}</h3>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-base font-bold text-primary">{format(discounted)}</span>
                </div>
                {hasDiscount && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="line-through">{format(Number(minPrice))}</span>
                    <span className="text-destructive font-semibold">-{product.discount_percentage}%</span>
                  </div>
                )}
                <div className="flex items-center gap-0.5 mt-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-3 w-3 text-warning fill-warning" />
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            className="min-w-[200px] border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold"
            onClick={() => setPage((p) => p + 1)}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            LOAD MORE
          </Button>
        </div>
      )}
    </section>
  );
};

export default JustForYou;
