import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag, Minus, Plus, ChevronLeft, ChevronRight, Truck, RotateCcw, Shield, Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreFooter from "@/components/storefront/StoreFooter";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { format } = useCurrency();
  const { toast } = useToast();

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product-detail", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, slug), variants(*), images(id, url, alt_text, position)")
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Derive available colors and sizes
  const colors = useMemo(() => {
    if (!product?.variants) return [];
    return [...new Set(product.variants.filter((v: any) => v.is_active).map((v: any) => v.color))];
  }, [product]);

  const sizes = useMemo(() => {
    if (!product?.variants) return [];
    const filtered = selectedColor
      ? product.variants.filter((v: any) => v.is_active && v.color === selectedColor)
      : product.variants.filter((v: any) => v.is_active);
    return [...new Set(filtered.map((v: any) => v.size))];
  }, [product, selectedColor]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants || !selectedColor || !selectedSize) return null;
    return product.variants.find(
      (v: any) => v.is_active && v.color === selectedColor && v.size === selectedSize
    ) ?? null;
  }, [product, selectedColor, selectedSize]);

  const displayPrice = selectedVariant
    ? (selectedVariant as any).price_override ?? product?.base_price
    : product?.base_price;

  const stock = selectedVariant ? (selectedVariant as any).inventory_quantity : null;

  const images = useMemo(() => {
    if (!product?.images?.length) return [];
    return [...product.images].sort((a: any, b: any) => a.position - b.position);
  }, [product]);

  // Auto-select first color
  if (colors.length > 0 && !selectedColor) {
    setSelectedColor(colors[0] as string);
  }

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize) {
      toast({ title: "Please select size and color", variant: "destructive" });
      return;
    }
    if (stock === 0) {
      toast({ title: "This variant is out of stock", variant: "destructive" });
      return;
    }
    toast({ title: "Added to cart!", description: `${product?.name} — ${selectedColor} / ${selectedSize} × ${quantity}` });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <StoreHeader />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <StoreHeader />
        <div className="text-center py-32 space-y-4">
          <p className="text-2xl font-heading font-bold text-foreground">Product not found</p>
          <Link to="/shop" className="text-primary hover:underline text-sm">Back to Shop</Link>
        </div>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StoreHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-foreground">Shop</Link>
          {(product as any).categories && (
            <>
              <span>/</span>
              <Link to={`/shop?category=${(product as any).categories.slug}`} className="hover:text-foreground">
                {(product as any).categories.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted/30 border border-border">
              {images.length > 0 ? (
                <img
                  src={(images[currentImage] as any).url}
                  alt={(images[currentImage] as any).alt_text || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-8xl opacity-10">👕</span>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage((p) => (p - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentImage((p) => (p + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img: any, i: number) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImage(i)}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                      i === currentImage ? "border-primary" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <img src={img.url} alt={img.alt_text || ""} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {(product as any).categories && (
                <Link
                  to={`/shop?category=${(product as any).categories.slug}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {(product as any).categories.name}
                </Link>
              )}
              <h1 className="text-3xl font-heading font-bold mt-1">{product.name}</h1>
              <p className="text-3xl font-bold mt-3">{format(Number(displayPrice))}</p>
              {stock !== null && stock > 0 && stock < 5 && (
                <Badge className="mt-2 bg-warning/10 text-warning border-0">Only {stock} left</Badge>
              )}
              {stock === 0 && (
                <Badge className="mt-2 bg-destructive/10 text-destructive border-0">Out of stock</Badge>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            {/* Color Selector */}
            {colors.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-3">
                  Color: <span className="text-muted-foreground">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color as string}
                      onClick={() => { setSelectedColor(color as string); setSelectedSize(null); }}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        selectedColor === color
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-foreground hover:border-primary/40"
                      }`}
                    >
                      {color as string}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {sizes.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-3">
                  Size: <span className="text-muted-foreground">{selectedSize ?? "Select a size"}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const variant = product.variants?.find(
                      (v: any) => v.is_active && v.color === selectedColor && v.size === size
                    );
                    const outOfStock = variant && (variant as any).inventory_quantity === 0;

                    return (
                      <button
                        key={size as string}
                        onClick={() => !outOfStock && setSelectedSize(size as string)}
                        disabled={!!outOfStock}
                        className={`min-w-[48px] px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          outOfStock
                            ? "border-border text-muted-foreground/40 line-through cursor-not-allowed"
                            : selectedSize === size
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-foreground hover:border-primary/40"
                        }`}
                      >
                        {size as string}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center border border-border rounded-lg">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-11 w-11 flex items-center justify-center hover:bg-muted/50 transition rounded-l-lg"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-medium text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="h-11 w-11 flex items-center justify-center hover:bg-muted/50 transition rounded-r-lg"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={stock === 0}
                className="flex-1 h-11 gap-2 text-sm font-semibold"
              >
                <ShoppingBag className="h-4 w-4" />
                {stock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
              {[
                { icon: Truck, label: "Free Shipping", sub: "Orders over ৳2000" },
                { icon: RotateCcw, label: "Easy Returns", sub: "7-day policy" },
                { icon: Shield, label: "Secure Payment", sub: "100% protected" },
              ].map((b) => (
                <div key={b.label} className="text-center space-y-1">
                  <b.icon className="h-5 w-5 mx-auto text-muted-foreground" />
                  <p className="text-xs font-medium">{b.label}</p>
                  <p className="text-[10px] text-muted-foreground">{b.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
};

export default ProductDetail;
