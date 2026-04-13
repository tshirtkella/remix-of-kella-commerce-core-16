import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useCurrency } from "@/hooks/useCurrency";
import { Zap, Star, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

const FlashSale = () => {
  const { format } = useCurrency();
  const { addItem } = useCart();
  const { toast } = useToast();

  const { data: products = [] } = useQuery({
    queryKey: ["flash-sale-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), variants(id, is_active, color, size, price_override, inventory_quantity), images(url, alt_text, position)")
        .eq("is_active", true)
        .gt("discount_percentage", 0)
        .order("discount_percentage", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  if (products.length === 0) return null;

  const handleQuickAdd = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    const firstVariant = product.variants?.find((v: any) => v.is_active && v.inventory_quantity > 0);
    if (!firstVariant) { toast({ title: "Out of stock", variant: "destructive" }); return; }
    const success = addItem({
      productId: product.id,
      variantId: firstVariant.id,
      name: product.name,
      color: firstVariant.color,
      size: firstVariant.size,
      price: firstVariant.price_override ?? product.base_price,
      quantity: 1,
      image: product.images?.sort((a: any, b: any) => a.position - b.position)?.[0]?.url,
      slug: product.slug,
      maxStock: firstVariant.inventory_quantity,
    });
    if (success) toast({ title: "Added to cart!" });
    else toast({ title: "Max stock reached", variant: "destructive" });
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-destructive/5">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-destructive fill-destructive" />
            <h2 className="text-xl font-bold font-heading">Flash Sale</h2>
            <span className="text-sm text-destructive font-semibold ml-2 animate-pulse">🔥 On Sale Now</span>
          </div>
          <Link
            to="/shop?sale=true"
            className="text-sm font-semibold border border-primary text-primary px-4 py-1.5 rounded-lg hover:bg-primary hover:text-primary-foreground transition"
          >
            SHOP ALL
          </Link>
        </div>

        <div className="flex gap-0 overflow-x-auto scrollbar-hide">
          {products.map((product) => {
            const minPrice = product.variants?.length
              ? Math.min(...product.variants.map((v: any) => v.price_override ?? product.base_price))
              : product.base_price;
            const discounted = Number(minPrice) * (1 - product.discount_percentage / 100);
            const original = Number(minPrice);
            const totalStock = product.variants?.reduce((s: number, v: any) => s + v.inventory_quantity, 0) ?? 0;
            const soldPercent = Math.min(95, Math.max(30, 100 - totalStock * 5));

            return (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="flex-shrink-0 w-44 md:w-52 p-3 border-r border-border last:border-r-0 hover:bg-muted/30 transition group relative"
              >
                <div className="aspect-square bg-muted/30 rounded-lg overflow-hidden mb-2 relative">
                  {product.images?.sort((a: any, b: any) => a.position - b.position)?.[0]?.url ? (
                    <img src={product.images.sort((a: any, b: any) => a.position - b.position)[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">👕</div>
                  )}
                  <span className="absolute top-1.5 right-1.5 text-[10px] font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded">
                    -{product.discount_percentage}%
                  </span>
                  {totalStock > 0 && (
                    <button
                      onClick={(e) => handleQuickAdd(e, product)}
                      className="absolute bottom-2 right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <ShoppingCart className="h-3 w-3" />
                    </button>
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
                {/* Sold progress bar */}
                <div className="mt-2">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-destructive rounded-full transition-all" style={{ width: `${soldPercent}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{soldPercent}% sold</p>
                </div>
                {/* Stars */}
                <div className="flex items-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-2.5 w-2.5 ${s <= 4 ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
                  ))}
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
