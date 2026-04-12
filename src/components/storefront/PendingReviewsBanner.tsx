import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Star, ChevronRight } from "lucide-react";

const PendingReviewsBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchCount = async () => {
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_items(variant_id)")
        .eq("status", "delivered");

      if (!orders || orders.length === 0) return;

      const { data: reviews } = await supabase
        .from("product_reviews")
        .select("product_id")
        .eq("user_id", user.id);

      const reviewedIds = new Set(reviews?.map((r) => r.product_id) ?? []);

      const variantIds = orders
        .flatMap((o) => (o.order_items as any[]) ?? [])
        .map((i: any) => i.variant_id)
        .filter(Boolean);

      if (variantIds.length === 0) return;

      const { data: variants } = await supabase
        .from("variants")
        .select("id, product_id")
        .in("id", [...new Set(variantIds)]);

      if (!variants) return;

      const uniqueProductIds = new Set(variants.map((v) => v.product_id));
      let unreviewedCount = 0;
      uniqueProductIds.forEach((pid) => {
        if (!reviewedIds.has(pid)) unreviewedCount++;
      });

      setCount(unreviewedCount);
    };

    void fetchCount();
  }, [user?.id]);

  if (count === 0) return null;

  return (
    <button
      onClick={() => navigate("/my-orders?tab=to-review")}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 hover:shadow-md transition-all group"
    >
      <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
        <Star className="h-5 w-5 text-amber-600 fill-amber-400" />
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          {count} product{count > 1 ? "s" : ""} waiting for your review
        </p>
        <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
          Share your experience to help others
        </p>
      </div>
      <ChevronRight className="h-5 w-5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
};

export default PendingReviewsBanner;
