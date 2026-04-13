import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Loader2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrency } from "@/hooks/useCurrency";
import { useWishlist } from "@/hooks/useWishlist";

interface Props {
  userId: string;
}

const MyWishlist = ({ userId }: Props) => {
  const { format } = useCurrency();
  const { toggle, toggling } = useWishlist();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["wishlist-items", userId],
    queryFn: async () => {
      const { data: wishRows, error } = await supabase
        .from("wishlists")
        .select("product_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!wishRows.length) return [];

      const ids = wishRows.map((w) => w.product_id);
      const { data: products, error: pErr } = await supabase
        .from("products")
        .select("id, name, slug, base_price, discount_percentage, images(url, position)")
        .in("id", ids);
      if (pErr) throw pErr;
      return (products ?? []).map((p) => ({
        ...p,
        image: p.images?.sort((a: any, b: any) => a.position - b.position)?.[0]?.url,
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-6">
        <Heart className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Your wishlist is empty</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((p) => {
        const discounted = p.discount_percentage > 0
          ? Number(p.base_price) * (1 - p.discount_percentage / 100)
          : Number(p.base_price);
        return (
          <div key={p.id} className="flex items-center gap-3 border border-border rounded-xl p-3">
            <Link to={`/product/${p.slug}`} className="shrink-0">
              <div className="h-16 w-16 rounded-lg bg-muted/30 overflow-hidden">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xl opacity-20">👕</div>
                )}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/product/${p.slug}`} className="text-sm font-medium text-foreground hover:text-primary line-clamp-2">
                {p.name}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-primary">{format(discounted)}</span>
                {p.discount_percentage > 0 && (
                  <span className="text-xs line-through text-muted-foreground">{format(Number(p.base_price))}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => toggle(p.id)}
              disabled={toggling}
              className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
              title="Remove from wishlist"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default MyWishlist;
