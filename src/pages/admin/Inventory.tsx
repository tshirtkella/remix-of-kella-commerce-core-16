import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  PackageX,
  Package,
  Search,
  Save,
  Settings2,
} from "lucide-react";

const Inventory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [editedStock, setEditedStock] = useState<Record<string, number>>({});
  const [thresholdInput, setThresholdInput] = useState<string | null>(null);

  const { data: threshold } = useQuery({
    queryKey: ["low_stock_threshold"],
    queryFn: async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", "low_stock_threshold")
        .single();
      return data ? parseInt(data.value) : 3;
    },
  });

  const lowStockThreshold = threshold ?? 3;

  const { data: variants, isLoading } = useQuery({
    queryKey: ["inventory-variants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("variants")
        .select("*, products(name, slug, is_active)")
        .order("inventory_quantity", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async (updates: { id: string; qty: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase
          .from("variants")
          .update({ inventory_quantity: u.qty })
          .eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-variants"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditedStock({});
      toast({ title: "Stock updated!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateThresholdMutation = useMutation({
    mutationFn: async (val: number) => {
      const { error } = await supabase
        .from("store_settings")
        .update({ value: String(val) })
        .eq("key", "low_stock_threshold");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["low_stock_threshold"] });
      setThresholdInput(null);
      toast({ title: "Threshold updated!" });
    },
  });

  const filtered = variants?.filter((v) => {
    const matchSearch =
      !search ||
      (v.products as any)?.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.sku.toLowerCase().includes(search.toLowerCase()) ||
      v.color.toLowerCase().includes(search.toLowerCase());

    const qty = editedStock[v.id] ?? v.inventory_quantity;
    if (filter === "low") return matchSearch && qty > 0 && qty <= lowStockThreshold;
    if (filter === "out") return matchSearch && qty === 0;
    return matchSearch;
  });

  const outOfStockCount = variants?.filter((v) => v.inventory_quantity === 0).length ?? 0;
  const lowStockCount =
    variants?.filter(
      (v) => v.inventory_quantity > 0 && v.inventory_quantity <= lowStockThreshold
    ).length ?? 0;
  const totalStock = variants?.reduce((s, v) => s + v.inventory_quantity, 0) ?? 0;
  const hasEdits = Object.keys(editedStock).length > 0;

  const handleSave = () => {
    const updates = Object.entries(editedStock).map(([id, qty]) => ({ id, qty }));
    updateStockMutation.mutate(updates);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage stock levels</p>
        </div>
        {hasEdits && (
          <Button onClick={handleSave} disabled={updateStockMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateStockMutation.isPending ? "Saving..." : `Save Changes (${Object.keys(editedStock).length})`}
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:ring-2 ring-primary/30 transition-all" onClick={() => setFilter("all")}>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Variants</p>
                <p className="text-2xl font-bold mt-1">{variants?.length ?? 0}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:ring-2 ring-primary/30 transition-all" onClick={() => setFilter("all")}>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Stock</p>
                <p className="text-2xl font-bold mt-1">{totalStock}</p>
              </div>
              <Package className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer hover:ring-2 transition-all ${filter === "low" ? "ring-2 ring-yellow-500/50" : "ring-yellow-500/30"}`}
          onClick={() => setFilter(filter === "low" ? "all" : "low")}
        >
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Low Stock (≤{lowStockThreshold})</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">{lowStockCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500/40" />
            </div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer hover:ring-2 transition-all ${filter === "out" ? "ring-2 ring-destructive/50" : "ring-destructive/30"}`}
          onClick={() => setFilter(filter === "out" ? "all" : "out")}
        >
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Out of Stock</p>
                <p className="text-2xl font-bold mt-1 text-destructive">{outOfStockCount}</p>
              </div>
              <PackageX className="h-8 w-8 text-destructive/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threshold config */}
      <Card>
        <CardContent className="py-4 px-5 flex items-center gap-4">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Low stock alert threshold:</span>
          <Input
            type="number"
            min="1"
            className="w-20 h-8 text-sm"
            value={thresholdInput ?? lowStockThreshold}
            onChange={(e) => setThresholdInput(e.target.value)}
          />
          {thresholdInput !== null && parseInt(thresholdInput) !== lowStockThreshold && (
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => updateThresholdMutation.mutate(parseInt(thresholdInput))}
              disabled={updateThresholdMutation.isPending}
            >
              Update
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Search & filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by product name, SKU, or color..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Inventory table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Variant</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map((v) => {
                const qty = editedStock[v.id] ?? v.inventory_quantity;
                const isEdited = v.id in editedStock;
                const isOut = qty === 0;
                const isLow = qty > 0 && qty <= lowStockThreshold;

                return (
                  <tr
                    key={v.id}
                    className={`border-b border-border last:border-0 transition-colors ${
                      isOut
                        ? "bg-destructive/5"
                        : isLow
                        ? "bg-yellow-500/5"
                        : "hover:bg-muted/30"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {(v.products as any)?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {v.size} / {v.color}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{v.sku}</td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min="0"
                        className={`w-24 h-8 text-sm ${isEdited ? "ring-2 ring-primary/40" : ""}`}
                        value={qty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (val === v.inventory_quantity) {
                            const next = { ...editedStock };
                            delete next[v.id];
                            setEditedStock(next);
                          } else {
                            setEditedStock({ ...editedStock, [v.id]: val });
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {isOut ? (
                        <Badge variant="destructive" className="text-xs">Out of stock</Badge>
                      ) : isLow ? (
                        <Badge className="text-xs bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Low stock
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">In stock</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No variants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Inventory;
