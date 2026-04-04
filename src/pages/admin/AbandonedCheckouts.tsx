import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Trash2, Eye, Clock, User, Phone, Mail, MapPin, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/useCurrency";
import { formatDistanceToNow } from "date-fns";

const AbandonedCheckouts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { format } = useCurrency();
  const [selectedDraft, setSelectedDraft] = useState<any>(null);

  const { data: drafts, isLoading } = useQuery({
    queryKey: ["draft-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("draft_orders")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("draft-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "draft_orders" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["draft-orders"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("draft_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["draft-orders"] });
      toast({ title: "Draft removed" });
      setSelectedDraft(null);
    },
  });

  const getCompleteness = (draft: any) => {
    const fields = ["first_name", "email", "phone", "address_line1", "city"];
    const filled = fields.filter((f) => draft[f]?.trim()).length;
    return Math.round((filled / fields.length) * 100);
  };

  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "—";
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Abandoned Checkouts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time view of incomplete checkout attempts
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Abandoned</p>
          <p className="text-2xl font-bold mt-1">{drafts?.length ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">With Email</p>
          <p className="text-2xl font-bold mt-1">
            {drafts?.filter((d) => d.email?.trim()).length ?? 0}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Potential Revenue</p>
          <p className="text-2xl font-bold mt-1">
            {format(drafts?.reduce((sum, d) => sum + Number(d.total || 0), 0) ?? 0)}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : !drafts?.length ? (
        <div className="flex flex-col items-center py-16">
          <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No abandoned checkouts yet</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cart Value</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Completeness</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Activity</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((draft) => {
                const completeness = getCompleteness(draft);
                const name = [draft.first_name, draft.last_name].filter(Boolean).join(" ") || "Anonymous";
                return (
                  <tr key={draft.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{name}</p>
                      {draft.city && (
                        <p className="text-xs text-muted-foreground">{draft.city}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="space-y-0.5">
                        {draft.email && <p className="text-xs">{draft.email}</p>}
                        {draft.phone && <p className="text-xs">{draft.phone}</p>}
                        {!draft.email && !draft.phone && <span className="text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {Number(draft.total) > 0 ? format(Number(draft.total)) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              completeness >= 80 ? "bg-green-500" : completeness >= 40 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${completeness}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{completeness}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {getTimeAgo(draft.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDraft(draft)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(draft.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedDraft} onOpenChange={(open) => !open && setSelectedDraft(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Abandoned Checkout Details
            </DialogTitle>
          </DialogHeader>
          {selectedDraft && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground text-xs">Name</p>
                    <p className="font-medium">
                      {[selectedDraft.first_name, selectedDraft.last_name].filter(Boolean).join(" ") || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground text-xs">Email</p>
                    <p className="font-medium">{selectedDraft.email || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground text-xs">Phone</p>
                    <p className="font-medium">{selectedDraft.phone || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground text-xs">Location</p>
                    <p className="font-medium">
                      {[selectedDraft.address_line1, selectedDraft.city, selectedDraft.state].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground text-xs">Last Activity</p>
                    <p className="font-medium">{getTimeAgo(selectedDraft.updated_at)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-muted-foreground text-xs">Cart Value</p>
                    <p className="font-medium">
                      {Number(selectedDraft.total) > 0 ? format(Number(selectedDraft.total)) : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {selectedDraft.payment_method && (
                <div className="text-sm">
                  <p className="text-muted-foreground text-xs">Payment Method</p>
                  <p className="font-medium capitalize">{selectedDraft.payment_method}</p>
                </div>
              )}

              {/* Cart Items */}
              {Array.isArray(selectedDraft.cart_items) && selectedDraft.cart_items.length > 0 && (
                <div className="border-t border-border pt-3">
                  <p className="text-sm font-medium mb-2">Cart Items</p>
                  <div className="space-y-2">
                    {selectedDraft.cart_items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-1.5 px-3 rounded-lg bg-muted/50">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          {item.color && item.size && (
                            <span className="text-muted-foreground ml-1">({item.color} / {item.size})</span>
                          )}
                          <span className="text-muted-foreground"> × {item.quantity}</span>
                        </div>
                        <span className="font-medium">{format(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(selectedDraft.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AbandonedCheckouts;
