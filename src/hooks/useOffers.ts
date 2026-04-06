import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Offer {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  discount_text: string;
  badge_label: string | null;
  bg_color: string | null;
  text_color: string | null;
  placement: string;
  cta_text: string | null;
  cta_link: string | null;
  banner_image: string | null;
  is_active: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
}

export const useOffers = (placement?: string) => {
  return useQuery({
    queryKey: ["public-offers", placement],
    queryFn: async () => {
      let query = (supabase as any)
        .from("offers")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false });

      if (placement) {
        query = query.eq("placement", placement);
      }

      const { data, error } = await query;
      if (error) throw error;

      const now = new Date();
      return (data as Offer[]).filter((o) => {
        if (o.starts_at && new Date(o.starts_at) > now) return false;
        if (o.ends_at && new Date(o.ends_at) < now) return false;
        return true;
      });
    },
    staleTime: 30_000,
  });
};

export type { Offer };
