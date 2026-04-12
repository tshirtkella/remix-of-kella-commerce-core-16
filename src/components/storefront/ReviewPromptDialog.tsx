import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Package, ChevronRight, X } from "lucide-react";

interface UnreviewedProduct {
  productId: string;
  productName: string;
  productSlug: string;
  variantLabel: string | null;
  imageUrl: string | null;
}

const DISMISSED_KEY = "review_prompt_dismissed_at";

const ReviewPromptDialog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<UnreviewedProduct[]>([]);

  useEffect(() => {
    if (!user) return;

    // Don't show if dismissed recently (within 24 hours)
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < 24 * 60 * 60 * 1000) return;

    const fetchUnreviewed = async () => {
      // Get delivered orders for this user via customer email
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_items(id, variant_id, product_name, variant_label)")
        .eq("status", "delivered");

      if (!orders || orders.length === 0) return;

      // Get user's existing reviews
      const { data: reviews } = await supabase
        .from("product_reviews")
        .select("product_id")
        .eq("user_id", user.id);

      const reviewedProductIds = new Set(reviews?.map((r) => r.product_id) ?? []);

      // Get all variant_ids from delivered order items
      const variantIds = orders
        .flatMap((o) => (o.order_items as any[]) ?? [])
        .map((item: any) => item.variant_id)
        .filter(Boolean);

      if (variantIds.length === 0) return;

      // Get product info for these variants
      const { data: variants } = await supabase
        .from("variants")
        .select("id, product_id, products(id, name, slug, images(url))")
        .in("id", [...new Set(variantIds)]);

      if (!variants) return;

      // Map variant_id -> product info
      const variantProductMap = new Map<string, { productId: string; name: string; slug: string; imageUrl: string | null }>();
      variants.forEach((v: any) => {
        if (v.products) {
          variantProductMap.set(v.id, {
            productId: v.product_id,
            name: v.products.name,
            slug: v.products.slug,
            imageUrl: v.products.images?.[0]?.url ?? null,
          });
        }
      });

      // Find unreviewed products
      const unreviewedMap = new Map<string, UnreviewedProduct>();
      orders.flatMap((o) => (o.order_items as any[]) ?? []).forEach((item: any) => {
        const product = variantProductMap.get(item.variant_id);
        if (product && !reviewedProductIds.has(product.productId) && !unreviewedMap.has(product.productId)) {
          unreviewedMap.set(product.productId, {
            productId: product.productId,
            productName: product.name,
            productSlug: product.slug,
            variantLabel: item.variant_label,
            imageUrl: product.imageUrl,
          });
        }
      });

      const unreviewedList = Array.from(unreviewedMap.values());
      if (unreviewedList.length > 0) {
        setProducts(unreviewedList);
        // Delay popup slightly for better UX
        setTimeout(() => setOpen(true), 1500);
      }
    };

    void fetchUnreviewed();
  }, [user?.id]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setOpen(false);
  };

  const handleRate = (slug: string) => {
    setOpen(false);
    navigate(`/product/${slug}?review=true`);
  };

  if (products.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleDismiss()}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white relative">
          <button onClick={handleDismiss} className="absolute top-3 right-3 text-white/70 hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <Star className="h-5 w-5 fill-white text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Rate Your Purchases!</h3>
              <p className="text-white/80 text-sm">Your feedback helps other buyers</p>
            </div>
          </div>
          <div className="flex gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-4 w-4 fill-yellow-300 text-yellow-300" />
            ))}
          </div>
        </div>

        {/* Products list */}
        <div className="px-4 py-3 max-h-[300px] overflow-y-auto">
          <p className="text-xs text-muted-foreground mb-3">
            You have <span className="font-bold text-foreground">{products.length}</span> product{products.length > 1 ? "s" : ""} waiting for your review
          </p>
          <div className="space-y-2">
            {products.slice(0, 5).map((p) => (
              <div
                key={p.productId}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => handleRate(p.productSlug)}
              >
                <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.productName} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.productName}</p>
                  {p.variantLabel && (
                    <p className="text-xs text-muted-foreground">{p.variantLabel}</p>
                  )}
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-3 w-3 text-muted-foreground/30" />
                    ))}
                  </div>
                </div>
                <Button size="sm" variant="default" className="h-8 text-xs gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                  Rate <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          {products.length > 5 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              +{products.length - 5} more products to review
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 flex gap-2">
          <Button variant="outline" className="flex-1 text-xs" onClick={handleDismiss}>
            Remind Me Later
          </Button>
          <Button className="flex-1 text-xs gap-1" onClick={() => handleRate(products[0].productSlug)}>
            <Star className="h-3 w-3" /> Start Rating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewPromptDialog;
