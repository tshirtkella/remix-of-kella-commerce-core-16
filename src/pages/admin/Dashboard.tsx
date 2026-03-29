import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package, ShoppingCart, Users, DollarSign, TrendingUp,
  TrendingDown, ArrowUpRight, CheckCircle2, XCircle, Clock,
  LayoutGrid,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const PIE_COLORS = [
  "hsl(220, 90%, 50%)",
  "hsl(160, 60%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 55%)",
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [products, variants, orders, customers, categories] = await Promise.all([
        supabase.from("products").select("id, is_active", { count: "exact" }),
        supabase.from("variants").select("inventory_quantity"),
        supabase.from("orders").select("id, total, status, created_at"),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id, name", { count: "exact" }),
      ]);

      const totalStock = variants.data?.reduce((s, v) => s + v.inventory_quantity, 0) ?? 0;
      const totalRevenue = orders.data?.reduce((s, o) => s + Number(o.total), 0) ?? 0;
      const pendingOrders = orders.data?.filter((o) => o.status === "pending").length ?? 0;
      const completedOrders = orders.data?.filter((o) => o.status === "delivered").length ?? 0;
      const cancelledOrders = orders.data?.filter((o) => o.status === "cancelled").length ?? 0;
      const activeProducts = products.data?.filter((p) => p.is_active).length ?? 0;

      return {
        productCount: products.count ?? 0,
        activeProducts,
        totalStock,
        orderCount: orders.data?.length ?? 0,
        customerCount: customers.count ?? 0,
        categoryCount: categories.count ?? 0,
        totalRevenue,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        categories: categories.data ?? [],
      };
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(first_name, last_name, email), order_items(id, product_name, quantity, unit_price)")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const { data: topProducts } = useQuery({
    queryKey: ["top-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, base_price, slug, images(url)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data;
    },
  });

  // Mock weekly revenue data (would come from real order aggregation)
  const revenueData = [
    { day: "Mon", revenue: 1200, cost: 800 },
    { day: "Tue", revenue: 1800, cost: 950 },
    { day: "Wed", revenue: 1400, cost: 700 },
    { day: "Thu", revenue: 2200, cost: 1100 },
    { day: "Fri", revenue: 2800, cost: 1300 },
    { day: "Sat", revenue: 3200, cost: 1500 },
    { day: "Sun", revenue: 2600, cost: 1200 },
  ];

  const orderStatusData = [
    { name: "Completed", value: stats?.completedOrders ?? 0 },
    { name: "Pending", value: stats?.pendingOrders ?? 0 },
    { name: "Cancelled", value: stats?.cancelledOrders ?? 0 },
    {
      name: "Processing",
      value: Math.max(0, (stats?.orderCount ?? 0) - (stats?.completedOrders ?? 0) - (stats?.pendingOrders ?? 0) - (stats?.cancelledOrders ?? 0)),
    },
  ].filter((d) => d.value > 0);

  const statusIcon: Record<string, any> = {
    pending: <Clock className="h-3.5 w-3.5" />,
    delivered: <CheckCircle2 className="h-3.5 w-3.5" />,
    cancelled: <XCircle className="h-3.5 w-3.5" />,
  };

  const statusStyle: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    confirmed: "bg-primary/10 text-primary",
    processing: "bg-primary/10 text-primary",
    shipped: "bg-accent/10 text-accent",
    delivered: "bg-success/10 text-success",
    cancelled: "bg-destructive/10 text-destructive",
    refunded: "bg-muted text-muted-foreground",
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back! Here's what's happening with T-Shirt Kella
          </p>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Orders</p>
                <p className="text-2xl font-heading font-bold mt-1">{stats?.orderCount ?? 0}</p>
                <p className="text-xs text-success flex items-center gap-1 mt-1.5">
                  <TrendingUp className="h-3 w-3" /> +10% Since last month
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-success">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Completed</p>
                <p className="text-2xl font-heading font-bold mt-1">{stats?.completedOrders ?? 0}</p>
                <p className="text-xs text-success flex items-center gap-1 mt-1.5">
                  <TrendingUp className="h-3 w-3" /> +7.5% Since last month
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cancelled</p>
                <p className="text-2xl font-heading font-bold mt-1">{stats?.cancelledOrders ?? 0}</p>
                <p className="text-xs text-destructive flex items-center gap-1 mt-1.5">
                  <TrendingDown className="h-3 w-3" /> -3.5% Since last month
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-accent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Revenue</p>
                <p className="text-2xl font-heading font-bold mt-1">${(stats?.totalRevenue ?? 0).toFixed(0)}</p>
                <p className="text-xs text-destructive flex items-center gap-1 mt-1.5">
                  <TrendingDown className="h-3 w-3" /> -7.5% Since last month
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Revenue vs Cost</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Weekly Overview</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" /> Cost
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={revenueData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 90%)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`$${value}`, ""]}
                />
                <Bar dataKey="revenue" fill="hsl(220, 90%, 50%)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="cost" fill="hsl(160, 60%, 45%)" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Order Status</CardTitle>
            <p className="text-xs text-muted-foreground">Breakdown by status</p>
          </CardHeader>
          <CardContent>
            {orderStatusData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm">
                No orders yet
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {orderStatusData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {orderStatusData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="ml-auto font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inventory Summary */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Inventory</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-2">
              <p className="text-3xl font-heading font-bold">{stats?.totalStock ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Stock Units</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-lg font-heading font-bold">{stats?.productCount ?? 0}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Products</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-lg font-heading font-bold">{stats?.activeProducts ?? 0}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Active</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-lg font-heading font-bold">{stats?.categoryCount ?? 0}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Categories</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
              <span className="text-muted-foreground">Pending Orders</span>
              <Badge variant="secondary" className="bg-warning/10 text-warning border-0">
                {stats?.pendingOrders ?? 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Customers</span>
              <span className="font-medium">{stats?.customerCount ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Order Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Order Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/admin/orders")}>
              View All <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {!recentOrders?.length ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground text-sm">
                <ShoppingCart className="h-8 w-8 mb-2 opacity-40" />
                No orders yet
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-border p-3 hover:shadow-md transition-shadow bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-muted-foreground">{order.order_number}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusStyle[order.status] ?? ""}`}>
                        {statusIcon[order.status]}
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">
                      {order.customers
                        ? `${order.customers.first_name ?? ""} ${order.customers.last_name ?? ""}`.trim() || order.customers.email
                        : "Guest"}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        {order.order_items?.length ?? 0} item{(order.order_items?.length ?? 0) !== 1 ? "s" : ""}
                      </span>
                      <span className="font-heading font-bold text-sm">${Number(order.total).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Categories Row */}
      {(stats?.categories?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Categories</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/admin/categories")}>
              View All <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {stats?.categories?.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => navigate("/admin/categories")}
                  className="flex-shrink-0 flex flex-col items-center justify-center w-28 h-24 rounded-xl border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer"
                >
                  <LayoutGrid className="h-6 w-6 text-primary mb-2" />
                  <span className="text-xs font-medium text-foreground">{cat.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latest Products */}
      {(topProducts?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Latest Products</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/admin/products")}>
              View All <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {topProducts?.map((product) => (
                <Link to={`/admin/products/${product.id}`} key={product.id} className="rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <div className="h-32 bg-muted flex items-center justify-center">
                    {product.images?.[0]?.url ? (
                      <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-sm font-heading font-bold text-primary mt-1">
                      ${Number(product.base_price).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
