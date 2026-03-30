import { Link } from "react-router-dom";
import { Shirt, ShoppingBag, User, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useBranding } from "@/hooks/useBranding";
import ProductSearch from "./ProductSearch";

const StoreHeader = () => {
  const { user, isStaff, signOut } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const branding = useBranding();

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            {branding.logo_url ? (
              <img src={branding.logo_url} alt={branding.store_name} className="h-9 w-9 rounded-xl object-contain group-hover:scale-105 transition-transform" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground group-hover:scale-105 transition-transform">
                <Shirt className="h-5 w-5" />
              </div>
            )}
            <span className="font-heading font-bold text-lg text-foreground">{branding.store_name}</span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">Home</Link>
            <Link to="/shop" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Shop</Link>
            <Link to="/categories" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Categories</Link>
            
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ProductSearch />
            <Button variant="ghost" size="icon" className="h-9 w-9 relative" onClick={() => setIsCartOpen(true)}>
              <ShoppingBag className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
            {user ? (
              <>
                {isStaff && (
                  <Link to="/admin">
                    <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Admin panel">
                      <Shield className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Link to="/profile">
                  <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Profile">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => void signOut()}
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Login">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default StoreHeader;
