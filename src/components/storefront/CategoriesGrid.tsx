import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Grid3X3 } from "lucide-react";

const CategoriesGrid = () => {
  const { data: categories = [] } = useQuery({
    queryKey: ["store-categories-grid"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  if (categories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold font-heading">Categories</h2>
        <Link to="/categories" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
          View All <Grid3X3 className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {categories.slice(0, 16).map((cat) => (
          <Link
            key={cat.id}
            to={`/shop?category=${cat.slug}`}
            className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-muted/40 flex items-center justify-center">
              {cat.image_url ? (
                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              ) : (
                <span className="text-2xl opacity-30">📦</span>
              )}
            </div>
            <p className="text-xs md:text-sm font-medium text-center line-clamp-2 leading-tight">{cat.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoriesGrid;
