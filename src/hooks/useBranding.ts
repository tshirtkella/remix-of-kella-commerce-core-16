import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BrandingConfig {
  store_name: string;
  logo_url: string;
  favicon_url: string;
}

const DEFAULT_BRANDING: BrandingConfig = {
  store_name: "T-Shirt Kella",
  logo_url: "",
  favicon_url: "",
};

export const useBranding = () => {
  const { data: branding = DEFAULT_BRANDING } = useQuery({
    queryKey: ["store-branding"],
    queryFn: async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("key, value")
        .in("key", ["store_name", "logo_url", "favicon_url"]);
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => { map[r.key] = r.value; });
      return {
        store_name: map.store_name || DEFAULT_BRANDING.store_name,
        logo_url: map.logo_url || "",
        favicon_url: map.favicon_url || "",
      };
    },
    staleTime: 60_000,
  });

  // Dynamically update favicon
  useEffect(() => {
    if (branding.favicon_url) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = branding.favicon_url;
    }
  }, [branding.favicon_url]);

  // Dynamically update page title
  useEffect(() => {
    if (branding.store_name) {
      document.title = `${branding.store_name} — Premium T-Shirts & Apparel`;
    }
  }, [branding.store_name]);

  return branding;
};
