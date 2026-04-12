import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrency } from "@/hooks/useCurrency";
import {
  ArrowLeft, Loader2, Package, Clock, Truck, CheckCircle2, XCircle,
  PackageCheck, ChevronRight, Star, MapPin,
} from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  variant_label: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  created_at: string;
  updated_at: string;
  shipping_address: string | null;
  notes: string | null;
  order_items: OrderItem[];
}

const STATUS_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", label: "Order Placed" },
  confirmed: { icon: PackageCheck, color: "text-blue-600", bg: "bg-blue-50", label: "Confirmed" },
  processing: { icon: PackageCheck, color: "text-indigo-600", bg: "bg-indigo-50", label: "Processing" },
  shipped: { icon: Truck, color: "text-purple-600", bg: "bg-purple-50", label: "Shipped" },
  delivered: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", label: "Delivered" },
  cancelled: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", label: "Cancelled" },
  refunded: { icon: XCircle, color: "text-gray-600", bg: "bg-gray-50", label: "Refunded" },
};

const OrderTrackingStepper = ({ status }: { status: string }) => {
  if (status === "cancelled" || status === "refunded") {
    const cfg = statusConfig[status];
    return (
      <div className="flex items-center gap-2 py-3">
        <div className={`h-8 w-8 rounded-full ${cfg.bg} flex items-center justify-center`}>
          <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
        </div>
        <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(status as any);

  return (
    <div className="py-4">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-muted z-0" />
        <div
          className="absolute top-4 left-4 h-0.5 bg-primary z-0 transition-all duration-500"
          style={{ width: `${Math.max(0, (currentIdx / (STATUS_STEPS.length - 1)) * 100 - 3)}%` }}
        />

        {STATUS_STEPS.map((step, i) => {
          const cfg = statusConfig[step];
          const isCompleted = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={step} className="flex flex-col items-center z-10 relative">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-card border-muted-foreground/30 text-muted-foreground/50"
                } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
              >
                <cfg.icon className="h-3.5 w-3.5" />
              </div>
              <span
                className={`text-[10px] mt-1.5 text-center leading-tight max-w-[60px] ${
                  isCompleted ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MyOrders = () => {
  const { user, loading } = useAuth();
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [tab, setTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewedProducts, setReviewedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      setFetching(true);
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, status, total, subtotal, tax, shipping_cost, created_at, updated_at, shipping_address, notes, order_items(id, product_name, variant_label, quantity, unit_price, total_price)")
        .order("created_at", { ascending: false });
      if (data) setOrders(data as any);
      setFetching(false);
    };

    const fetchReviewed = async () => {
      const { data } = await supabase
        .from("product_reviews")
        .select("product_id")
        .eq("user_id", user.id);
      if (data) setReviewedProducts(new Set(data.map((r) => r.product_id)));
    };

    void fetchOrders();
    void fetchReviewed();
  }, [user?.id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  // "To Review" = delivered orders with items not yet reviewed
  const toReviewOrders = orders.filter(
    (o) => o.status === "delivered" && o.order_items?.some((item) => !reviewedProducts.has(item.id))
  );

  const filtered = tab === "to-review"
    ? toReviewOrders
    : tab === "all"
      ? orders
      : orders.filter((o) => o.status === tab);

  const tabs = [
    { key: "all", label: "All" },
    { key: "to-review", label: `To Review${toReviewOrders.length > 0 ? ` (${toReviewOrders.length})` : ""}` },
    { key: "pending", label: "Pending" },
    { key: "processing", label: "Processing" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/profile"><ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" /></Link>
          <h1 className="text-lg font-heading font-bold text-foreground">My Orders</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Tabs */}
        <div className="overflow-x-auto pb-2 mb-4 -mx-4 px-4">
          <div className="flex gap-1.5 min-w-max">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                  tab === t.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders list */}
        <div className="space-y-3">
          {fetching ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              {tab === "to-review" ? (
                <>
                  <Star className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                  <p className="text-muted-foreground">No products to review</p>
                  <p className="text-xs text-muted-foreground">Reviews become available after your order is delivered</p>
                </>
              ) : (
                <>
                  <Package className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                  <p className="text-muted-foreground">No orders found</p>
                </>
              )}
            </div>
          ) : (
            filtered.map((order) => {
              const cfg = statusConfig[order.status] ?? statusConfig.pending;
              const Icon = cfg.icon;
              const isDelivered = order.status === "delivered";

              return (
                <Card key={order.id} className="border border-border overflow-hidden">
                  <CardContent className="p-0">
                    {/* Order header */}
                    <div className="px-4 pt-4 pb-2">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Order #{order.order_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <Badge className={`${cfg.bg} ${cfg.color} border-0 capitalize text-xs`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {cfg.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Tracking stepper */}
                    <div className="px-4">
                      <OrderTrackingStepper status={order.status} />
                    </div>

                    {/* Items preview */}
                    <div className="px-4 py-2 border-t border-border">
                      {order.order_items?.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-1.5 text-sm">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-foreground truncate block">{item.product_name}</span>
                            {item.variant_label && (
                              <span className="text-xs text-muted-foreground">{item.variant_label}</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground ml-2">×{item.quantity}</span>
                        </div>
                      ))}
                      {(order.order_items?.length ?? 0) > 2 && (
                        <p className="text-xs text-muted-foreground">+{order.order_items.length - 2} more items</p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-sm font-bold text-foreground">{format(order.total)}</p>
                      </div>
                      <div className="flex gap-2">
                        {isDelivered && tab === "to-review" && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-8 text-xs gap-1"
                            onClick={() => {
                              // Navigate to first unreviewed product - for now go to shop
                              navigate("/shop");
                            }}
                          >
                            <Star className="h-3 w-3" /> Write Review
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1"
                          onClick={() => setSelectedOrder(order)}
                        >
                          Details <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Tracking */}
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Order Tracking</p>
                <OrderTrackingStepper status={selectedOrder.status} />
              </div>

              {/* Shipping address */}
              {selectedOrder.shipping_address && (
                <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Shipping Address</p>
                    <p className="text-sm text-foreground whitespace-pre-line">{selectedOrder.shipping_address}</p>
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Items ({selectedOrder.order_items?.length ?? 0})</p>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                        {item.variant_label && (
                          <p className="text-xs text-muted-foreground">{item.variant_label}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {format(item.unit_price)}</p>
                      </div>
                      <p className="text-sm font-medium text-foreground">{format(item.total_price)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t border-border pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{format(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{format(selectedOrder.shipping_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{format(selectedOrder.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
                  <span>Total</span>
                  <span>{format(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Review CTA for delivered orders */}
              {selectedOrder.status === "delivered" && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 text-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Your order has been delivered!</p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-0.5 mb-2">Rate your purchase to help other buyers</p>
                  <Button size="sm" className="gap-1" onClick={() => navigate("/shop")}>
                    <Star className="h-3 w-3" /> Write a Review
                  </Button>
                </div>
              )}

              {selectedOrder.notes && (
                <div className="text-sm">
                  <p className="text-muted-foreground text-xs mb-0.5">Notes</p>
                  <p className="text-foreground">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyOrders;
