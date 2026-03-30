import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Package, Clock, Truck, CheckCircle2, XCircle, PackageCheck } from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  shipping_address: string | null;
}

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  confirmed: { icon: PackageCheck, color: "text-blue-600", bg: "bg-blue-50" },
  processing: { icon: PackageCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
  shipped: { icon: Truck, color: "text-purple-600", bg: "bg-purple-50" },
  delivered: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  cancelled: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  refunded: { icon: XCircle, color: "text-gray-600", bg: "bg-gray-50" },
};

const MyOrders = () => {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setFetching(true);
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, status, total, created_at, shipping_address")
        .order("created_at", { ascending: false });
      if (data) setOrders(data as Order[]);
      setFetching(false);
    };
    void fetch();
  }, [user?.id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const filtered = tab === "all" ? orders : orders.filter((o) => o.status === tab);
  const tabs = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/profile"><ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" /></Link>
          <h1 className="text-lg font-heading font-bold text-foreground">My Orders</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full justify-start overflow-x-auto bg-transparent gap-1 p-0 h-auto mb-4">
            {tabs.map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className="capitalize text-xs px-3 py-1.5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="space-y-3">
            {fetching ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Package className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground">No orders found</p>
              </div>
            ) : (
              filtered.map((order) => {
                const cfg = statusConfig[order.status] ?? statusConfig.pending;
                const Icon = cfg.icon;
                return (
                  <Card key={order.id} className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Order #{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <Badge className={`${cfg.bg} ${cfg.color} border-0 capitalize text-xs`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">Total Amount</p>
                        <p className="text-sm font-bold text-foreground">৳{order.total.toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default MyOrders;
