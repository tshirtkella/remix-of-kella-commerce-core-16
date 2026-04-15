import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PageTemplate {
  id: string;
  page_key: string;
  section_key: string;
  title: string | null;
  content: Record<string, any>;
  is_active: boolean;
  sort_order: number;
}

export const usePageTemplates = (pageKey: string) => {
  return useQuery({
    queryKey: ["page-templates", pageKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_templates")
        .select("*")
        .eq("page_key", pageKey)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as PageTemplate[];
    },
    staleTime: 60_000,
  });
};

export const usePageSection = (pageKey: string, sectionKey: string) => {
  const { data: templates = [] } = usePageTemplates(pageKey);
  return templates.find((t) => t.section_key === sectionKey)?.content ?? null;
};
