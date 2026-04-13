import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export const useWishlist = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wishlistIds = [], isLoading } = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("wishlists")
        .select("product_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((w) => w.product_id);
    },
    enabled: !!user,
  });

  const toggleMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Not logged in");
      const isWished = wishlistIds.includes(productId);
      if (isWished) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
        if (error) throw error;
        return { added: false };
      } else {
        const { error } = await supabase
          .from("wishlists")
          .insert({ user_id: user.id, product_id: productId });
        if (error) throw error;
        return { added: true };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist", user?.id] });
      toast({ title: result.added ? "Added to wishlist ❤️" : "Removed from wishlist" });
    },
    onError: () => toast({ title: "Failed", variant: "destructive" }),
  });

  return {
    wishlistIds,
    isLoading,
    isWished: (productId: string) => wishlistIds.includes(productId),
    toggle: (productId: string) => toggleMutation.mutate(productId),
    toggling: toggleMutation.isPending,
  };
};
