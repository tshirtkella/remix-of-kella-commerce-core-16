import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { Badge } from "@/components/ui/badge";

interface RelatedProductsProps {
  categoryId: string | null;
  currentProductId: string;
}

const RelatedProducts = ({ categoryId, currentProductId }: RelatedProductsProps) => {
  const { format } = useCurrency();

  const { data: products = [] } = useQuery({
    queryKey: ["related-products", categoryId, currentProductId],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id, name, slug, base_price, discount_percentage, images(url, position), variants(price_override, inventory_quantity, is_active)")
        .eq("is_active", true)
        .neq("id", currentProductId)
        .limit(4);

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentProductId,
  });

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-xl font-heading font-bold mb-6">You may also like</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p: any) => {
          const image = p.images?.sort((a: any, b: any) => a.position - b.position)[0];
          const activeVariants = p.variants?.filter((v: any) => v.is_active) || [];
          const minPrice = activeVariants.length > 0
            ? Math.min(...activeVariants.map((v: any) => v.price_override ?? p.base_price))
            : p.base_price;
          const totalStock = activeVariants.reduce((s: number, v: any) => s + (v.inventory_quantity || 0), 0);

          return (
            <Link
              key={p.id}
              to={`/product/${p.slug}`}
              className="group rounded-lg border border-border overflow-hidden bg-card hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-muted/30 overflow-hidden relative">
                {image ? (
                  <img src={image.url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl opacity-10">👕</span>
                  </div>
                )}
                {totalStock === 0 && (
                  <Badge className="absolute top-2 left-2 bg-destructive/90 text-destructive-foreground text-[10px]">SOLD OUT</Badge>
                )}
              </div>
              <div className="p-3 space-y-1">
                <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">{p.name}</p>
                {p.discount_percentage > 0 ? (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold">{format(Number(minPrice) * (1 - p.discount_percentage / 100))}</p>
                    <p className="text-xs text-muted-foreground line-through">{format(Number(minPrice))}</p>
                  </div>
                ) : (
                  <p className="text-sm font-bold">{format(Number(minPrice))}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default RelatedProducts;
