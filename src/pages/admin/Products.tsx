import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, AlertTriangle } from "lucide-react";

const Products = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), variants(id, size, color, sku, inventory_quantity, is_active)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your product catalog</p>
        </div>
        <Button asChild>
          <Link to="/admin/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : !products?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No products yet</p>
          <Button asChild className="mt-4" size="sm">
            <Link to="/admin/products/new">Add your first product</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Discount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Variants</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const totalStock = product.variants?.reduce(
                  (sum: number, v: any) => sum + v.inventory_quantity,
                  0
                ) ?? 0;
                return (
                  <tr key={product.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/admin/products/${product.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                        {product.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">{product.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.categories?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      ${Number(product.base_price).toFixed(2)}
                      {Number((product as any).discount_percentage) > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground line-through">
                          ${(Number(product.base_price) / (1 - Number((product as any).discount_percentage) / 100)).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {Number((product as any).discount_percentage) > 0 ? (
                        <Badge variant="destructive" className="text-xs">
                          {Number((product as any).discount_percentage)}% OFF
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground text-xs">
                          {product.variants?.length ?? 0} variants · {totalStock} in stock
                        </span>
                        {totalStock > 0 && totalStock <= 3 && (
                          <span className="inline-flex items-center gap-0.5 text-yellow-600" title="Low stock">
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </span>
                        )}
                        {totalStock === 0 && (product.variants?.length ?? 0) > 0 && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Out of stock
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Active" : "Draft"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Products;
