import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  image_url: string | null;
  category_name: string | null;
}

const ProductSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const navigate = useNavigate();
  const { format } = useCurrency();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchProducts = async (term: string) => {
    if (term.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, base_price, categories(name), images(url, position)")
        .eq("is_active", true)
        .ilike("name", `%${term}%`)
        .order("name")
        .limit(6);

      if (error) throw error;

      const mapped: SearchResult[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        base_price: p.base_price,
        image_url: p.images?.sort((a: any, b: any) => a.position - b.position)?.[0]?.url || null,
        category_name: p.categories?.name || null,
      }));

      setResults(mapped);
      setIsOpen(mapped.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchProducts(value), 300);
  };

  const handleSelect = (slug: string) => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    navigate(`/product/${slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      setIsOpen(false);
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={wrapperRef} className="relative hidden sm:block">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search products..."
        className="pl-9 w-48 h-9 bg-muted/50 border-0 focus-visible:ring-1"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 w-72 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {loading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Searching...</div>
          ) : (
            results.map((product) => (
              <button
                key={product.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left"
                onClick={() => handleSelect(product.slug)}
              >
                <div className="h-10 w-10 rounded-md bg-muted/50 flex-shrink-0 overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex items-center justify-center h-full text-lg opacity-20">👕</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate text-foreground">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.category_name || "Uncategorized"} · {format(Number(product.base_price))}
                  </p>
                </div>
              </button>
            ))
          )}
          {query.trim().length >= 2 && (
            <button
              className="w-full px-4 py-2.5 text-xs font-medium text-primary hover:bg-accent transition-colors border-t border-border"
              onClick={() => {
                setIsOpen(false);
                navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
              }}
            >
              View all results for "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
