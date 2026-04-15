import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, ShoppingCart } from "lucide-react";

interface Props {
  categoryId: string | null;
  currentProductId: string;
}

const FrequentlyBoughtTogether = ({ categoryId, currentProductId }: Props) => {
  const { format } = useCurrency();
  const { addItem } = useCart();
  const { toast } = useToast();

  const { data: products = [] } = useQuery({
    queryKey: ["fbt-products", categoryId, currentProductId],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id, name, slug, base_price, discount_percentage, images(url, position), variants(id, is_active, color, size, price_override, inventory_quantity)")
        .eq("is_active", true)
        .neq("id", currentProductId)
        .limit(3);
      if (categoryId) query = query.eq("category_id", categoryId);
      const { data } = await query.order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!currentProductId,
  });

  if (products.length === 0) return null;

  const addAll = () => {
    let added = 0;
    products.forEach((p: any) => {
      const v = p.variants?.find((v: any) => v.is_active && v.inventory_quantity > 0);
      if (!v) return;
      const success = addItem({
        productId: p.id,
        variantId: v.id,
        name: p.name,
        color: v.color,
        size: v.size,
        price: v.price_override ?? p.base_price,
        quantity: 1,
        image: p.images?.sort((a: any, b: any) => a.position - b.position)?.[0]?.url,
        slug: p.slug,
        maxStock: v.inventory_quantity,
      });
      if (success) added++;
    });
    if (added > 0) toast({ title: `${added} item${added > 1 ? "s" : ""} added to cart!` });
  };

  const totalPrice = products.reduce((sum: number, p: any) => {
    const price = p.discount_percentage > 0
      ? Number(p.base_price) * (1 - p.discount_percentage / 100)
      : Number(p.base_price);
    return sum + price;
  }, 0);

  return (
    <section className="mt-10 pt-8 border-t border-border">
      <h2 className="text-lg font-heading font-bold mb-4">Frequently Bought Together</h2>
      <div className="flex items-center gap-3 overflow-x-auto pb-4">
        {products.map((p: any, i: number) => {
          const img = p.images?.sort((a: any, b: any) => a.position - b.position)?.[0];
          const price = p.discount_percentage > 0 ? Number(p.base_price) * (1 - p.discount_percentage / 100) : Number(p.base_price);
          return (
            <div key={p.id} className="flex items-center gap-3">
              {i > 0 && <Plus className="h-5 w-5 text-muted-foreground shrink-0" />}
              <Link to={`/product/${p.slug}`} className="shrink-0 w-28 rounded-lg border border-border overflow-hidden bg-card hover:shadow-md transition group">
                <div className="aspect-square bg-muted/30 overflow-hidden">
                  {img?.url ? (
                    <img src={img.url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">👕</div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium line-clamp-1">{p.name}</p>
                  <p className="text-xs font-bold text-primary">{format(price)}</p>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-2">
        <p className="text-sm font-semibold">Total: <span className="text-primary">{format(totalPrice)}</span></p>
        <Button size="sm" onClick={addAll} className="gap-2">
          <ShoppingCart className="h-3.5 w-3.5" /> Add All to Cart
        </Button>
      </div>
    </section>
  );
};

export default FrequentlyBoughtTogether;
