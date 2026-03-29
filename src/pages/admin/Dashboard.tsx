import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, ArrowUpRight } from "lucide-react";

const StatCard = ({ title, value, icon: Icon, trend }: { title: string; value: string; icon: any; trend?: string }) => (
  <Card className="relative overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-heading font-bold">{value}</div>
      {trend && (
        <p className="text-xs text-success flex items-center gap-1 mt-1">
          <ArrowUpRight className="h-3 w-3" /> {trend}
        </p>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [products, variants, orders, customers] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("variants").select("inventory_quantity"),
        supabase.from("orders").select("id, total, status"),
        supabase.from("customers").select("id", { count: "exact", head: true }),
      ]);

      const totalStock = variants.data?.reduce((s, v) => s + v.inventory_quantity, 0) ?? 0;
      const totalRevenue = orders.data?.reduce((s, o) => s + Number(o.total), 0) ?? 0;
      const pendingOrders = orders.data?.filter((o) => o.status === "pending").length ?? 0;

      return {
        productCount: products.count ?? 0,
        totalStock,
        orderCount: orders.data?.length ?? 0,
        customerCount: customers.count ?? 0,
        totalRevenue,
        pendingOrders,
      };
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(first_name, last_name, email)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back to T-Shirt Kella</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Products" value={String(stats?.productCount ?? 0)} icon={Package} />
        <StatCard title="Total Orders" value={String(stats?.orderCount ?? 0)} icon={ShoppingCart} />
        <StatCard title="Customers" value={String(stats?.customerCount ?? 0)} icon={Users} />
        <StatCard
          title="Revenue"
          value={`$${(stats?.totalRevenue ?? 0).toFixed(2)}`}
          icon={DollarSign}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inventory Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Stock Units</span>
              <span className="font-heading font-bold text-lg">{stats?.totalStock ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pending Orders</span>
              <span className="font-heading font-bold text-lg text-warning">{stats?.pendingOrders ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {!recentOrders?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.customers
                          ? `${order.customers.first_name ?? ""} ${order.customers.last_name ?? ""}`.trim() || order.customers.email
                          : "Guest"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${Number(order.total).toFixed(2)}</p>
                      <p className="text-xs capitalize text-muted-foreground">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
