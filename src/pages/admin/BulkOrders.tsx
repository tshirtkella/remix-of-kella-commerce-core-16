import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, Phone, Package, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-amber-500",
  completed: "bg-green-500",
  cancelled: "bg-gray-500",
};

const BulkOrders = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-bulk-orders"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("bulk_orders") as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase.from("bulk_orders") as any).update({ status }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Status updated" });
    qc.invalidateQueries({ queryKey: ["admin-bulk-orders"] });
    if (selected?.id === id) setSelected({ ...selected, status });
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Delete this bulk order request?")) return;
    const { error } = await (supabase.from("bulk_orders") as any).delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Deleted" });
    qc.invalidateQueries({ queryKey: ["admin-bulk-orders"] });
    setSelected(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulk Order Requests</h1>
        <p className="text-sm text-muted-foreground">Customers who want to place wholesale or custom bulk orders.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {["new", "contacted", "completed", "cancelled"].map((s) => (
          <Card key={s}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground capitalize">{s}</div>
              <div className="text-2xl font-bold">{orders.filter((o: any) => o.status === s).length}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>All Requests ({orders.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No bulk order requests yet.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{o.full_name}</span>
                      <Badge className={`${STATUS_COLORS[o.status]} text-white text-xs`}>{o.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{o.email}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{o.contact_number}</span>
                      <span className="flex items-center gap-1"><Package className="h-3 w-3" />{o.quantity_range}</span>
                      <span>{format(new Date(o.created_at), "PP p")}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setSelected(o)}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="outline" onClick={() => deleteOrder(o.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Bulk Order Request</DialogTitle></DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <Badge className={`${STATUS_COLORS[selected.status]} text-white`}>{selected.status}</Badge>
                <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v)}>
                  <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field label="Name" value={selected.full_name} />
              <Field label="Email" value={selected.email} />
              <Field label="Contact" value={selected.contact_number} />
              {selected.product_name && <Field label="Inquired Product" value={selected.product_name} />}
              <Field label="Quantity" value={selected.quantity_range} />
              <Field label="Categories" value={selected.product_categories?.join(", ")} />
              <Field label="Custom Print" value={selected.custom_print ? `Yes — ${selected.custom_print_details || "(no details)"}` : "No"} />
              <Field label="Custom Tag" value={selected.custom_tag ? `Yes — ${selected.custom_tag_details || "(no details)"}` : "No"} />
              <Field label="Purpose" value={selected.order_purpose === "Other" ? `Other — ${selected.order_purpose_other}` : selected.order_purpose} />
              {selected.additional_notes && <Field label="Notes" value={selected.additional_notes} />}
              <Field label="Submitted" value={format(new Date(selected.created_at), "PPpp")} />

              <div className="flex gap-2 pt-2">
                <a href={`mailto:${selected.email}?subject=Re: Your Bulk Order Request`} className="flex-1">
                  <Button variant="outline" className="w-full gap-2"><Mail className="h-4 w-4" />Email</Button>
                </a>
                <a href={`tel:${selected.contact_number}`} className="flex-1">
                  <Button variant="outline" className="w-full gap-2"><Phone className="h-4 w-4" />Call</Button>
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: any }) => (
  <div>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="font-medium break-words">{value || "—"}</div>
  </div>
);

export default BulkOrders;
