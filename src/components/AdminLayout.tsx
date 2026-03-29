import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Package, LayoutGrid, LogOut, Shirt, ShoppingCart, Users, Settings, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/admin", icon: BarChart3, label: "Dashboard", exact: true },
  { to: "/admin/products", icon: Package, label: "Products" },
  { to: "/admin/categories", icon: LayoutGrid, label: "Categories" },
  { to: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { to: "/admin/customers", icon: Users, label: "Customers" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

const AdminLayout = () => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
        <div className="flex items-center gap-2 p-5 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Shirt className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <span className="font-heading font-semibold text-sidebar-accent-foreground">T-Shirt Kella</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
