import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "./ProductCard";

const PAGE_SIZE = 12;

const JustForYou = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["just-for-you", page],
    queryFn: async () => {
      const from = 0;
      const to = page * PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from("products")
        .select("*, categories(name), variants(id, is_active, color, size, price_override, inventory_quantity), images(url, alt_text, position)", { count: "exact" })
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} compact />
        ))}
      </div>

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
