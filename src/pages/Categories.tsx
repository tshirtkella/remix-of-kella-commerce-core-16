import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreFooter from "@/components/storefront/StoreFooter";
import { usePageSection } from "@/hooks/usePageTemplates";

const categoryColors = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"];

const Categories = () => {
  const content = usePageSection("categories", "hero");
  const { data: categories = [] } = useQuery({
    queryKey: ["all-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StoreHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold font-heading mb-2">{content?.heading || "All Categories"}</h1>
        {content?.subtitle && <p className="text-muted-foreground mb-8">{content.subtitle}</p>}
        {!content?.subtitle && <div className="mb-8" />}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group relative rounded-xl overflow-hidden aspect-square flex items-end p-4"
              style={{ backgroundColor: categoryColors[i % categoryColors.length] + "18" }}
            >
              {cat.image_url ? (
                <img src={cat.image_url} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div
                  className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                  style={{ backgroundColor: categoryColors[i % categoryColors.length] }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="relative z-10">
                <p className="font-semibold text-sm text-white">{cat.name}</p>
                {cat.description && (
                  <p className="text-xs text-white/70 mt-0.5 line-clamp-2">{cat.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
        {categories.length === 0 && (
          <p className="text-center text-muted-foreground py-16">No categories yet.</p>
        )}
      </main>
      <StoreFooter />
    </div>
  );
};

export default Categories;
