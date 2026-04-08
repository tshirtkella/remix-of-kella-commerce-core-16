import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ChevronLeft, ChevronRight, Loader2, Share2, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreFooter from "@/components/storefront/StoreFooter";
import RelatedProducts from "@/components/storefront/RelatedProducts";
import ProductDeliveryInfo from "@/components/storefront/ProductDeliveryInfo";
import ProductReviews from "@/components/storefront/ProductReviews";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { format } = useCurrency();
  const { toast } = useToast();
  const { addItem } = useCart();
  const navigate = useNavigate();

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

  const buildCartItem = () => {
    if (!product || !selectedVariant || !selectedColor || !selectedSize) return null;
    return {
      productId: product.id,
      variantId: (selectedVariant as any).id,
      name: product.name,
      color: selectedColor,
      size: selectedSize,
      price: Number(displayPrice),
      quantity,
      image: images[0]?.url,
      slug: product.slug,
      maxStock: stock ?? undefined,
    };
  };

  const handleAddToCart = () => {
    if (!selectedSize) { toast({ title: "Please select a size", variant: "destructive" }); return; }
    if (stock === 0) { toast({ title: "This variant is out of stock", variant: "destructive" }); return; }
    const item = buildCartItem();
    if (item) {
      const success = addItem(item);
      if (!success) { toast({ title: "Stock limit reached!", description: `Only ${stock} items available.`, variant: "destructive" }); return; }
      toast({ title: "Added to cart!", description: `${product?.name} — ${selectedColor} / ${selectedSize} × ${quantity}` });
    }
  };

  const handleBuyNow = () => {
    if (!selectedSize) { toast({ title: "Please select a size", variant: "destructive" }); return; }
    if (stock === 0) { toast({ title: "This variant is out of stock", variant: "destructive" }); return; }
    const item = buildCartItem();
    if (item) {
      const success = addItem(item);
      if (!success) { toast({ title: "Stock limit reached!", description: `Only ${stock} items available.`, variant: "destructive" }); return; }
      navigate("/checkout");
    }
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground transition">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-foreground transition">Shop</Link>
          {(product as any).categories && (
            <>
              <span>/</span>
              <Link to={`/shop?category=${(product as any).categories.slug}`} className="hover:text-foreground transition">
                {(product as any).categories.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* 3-column: Images | Info | Delivery */}
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr_280px] gap-6">
          {/* Column 1: Image Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted/30 border border-border">
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
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentImage((p) => (p + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img: any, i: number) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImage(i)}
                    className={`shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition ${
                      i === currentImage ? "border-primary" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <img src={img.url} alt={img.alt_text || ""} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Product Info */}
          <div className="space-y-4">
            <h1 className="text-xl sm:text-2xl font-heading font-bold leading-tight">{product.name}</h1>

            {/* Share & Wishlist */}
            <div className="flex items-center gap-3">
              <button className="text-muted-foreground hover:text-foreground transition"><Share2 className="h-5 w-5" /></button>
              <button className="text-muted-foreground hover:text-destructive transition"><Heart className="h-5 w-5" /></button>
            </div>

            {/* Brand / Category */}
            {(product as any).categories && (
              <p className="text-sm text-muted-foreground">
                Brand: <Link to={`/shop?category=${(product as any).categories.slug}`} className="text-primary hover:underline">{(product as any).categories.name}</Link>
              </p>
            )}

            {/* Price */}
            {product.discount_percentage > 0 ? (
              <div className="space-y-1">
                <p className="text-3xl font-bold text-primary">{format(Number(displayPrice) * (1 - product.discount_percentage / 100))}</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground line-through">{format(Number(displayPrice))}</p>
                  <Badge className="bg-destructive/10 text-destructive border-0 text-xs">-{product.discount_percentage}%</Badge>
                </div>
              </div>
            ) : (
              <p className="text-3xl font-bold text-primary">{format(Number(displayPrice))}</p>
            )}

            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            {/* Color Selector */}
            {colors.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Color Family: <span className="text-foreground">{selectedColor}</span></p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color as string}
                      onClick={() => { setSelectedColor(color as string); setSelectedSize(null); }}
                      className={`px-4 py-2 rounded border text-sm font-medium transition-all ${
                        selectedColor === color
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-foreground hover:border-primary/50"
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
                <p className="text-sm font-medium mb-2">Size</p>
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
                        className={`min-w-[48px] px-4 py-2 rounded border text-sm font-medium transition-all ${
                          outOfStock
                            ? "border-border text-muted-foreground/40 line-through cursor-not-allowed"
                            : selectedSize === size
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border text-foreground hover:border-primary/50"
                        }`}
                      >
                        {size as string}
                      </button>
                    );
                  })}
                </div>
                {stock !== null && stock > 0 && stock < 5 && (
                  <Badge className="mt-2 bg-warning/10 text-warning border-0 text-xs">Only {stock} left</Badge>
                )}
                {stock === 0 && (
                  <Badge className="mt-2 bg-destructive/10 text-destructive border-0 text-xs">Out of stock</Badge>
                )}
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-sm font-medium mb-2">Quantity</p>
              <div className="inline-flex items-center border border-border rounded">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-10 w-10 flex items-center justify-center hover:bg-muted/50 transition"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-medium text-sm border-x border-border">{quantity}</span>
                <button
                  onClick={() => {
                    const max = stock ?? Infinity;
                    if (quantity >= max) { toast({ title: "Stock limit reached!", variant: "destructive" }); return; }
                    setQuantity((q) => q + 1);
                  }}
                  className="h-10 w-10 flex items-center justify-center hover:bg-muted/50 transition"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleBuyNow} disabled={stock === 0} className="flex-1 h-11 text-sm font-semibold">
                Buy Now
              </Button>
              <Button onClick={handleAddToCart} disabled={stock === 0} variant="outline" className="flex-1 h-11 text-sm font-semibold">
                {stock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
            </div>
          </div>

          {/* Column 3: Delivery Info */}
          <div className="hidden lg:block">
            <ProductDeliveryInfo />
          </div>
        </div>

        {/* Mobile delivery info */}
        <div className="lg:hidden mt-6">
          <ProductDeliveryInfo />
        </div>

        {/* Reviews Section */}
        <ProductReviews productId={product.id} productName={product.name} />
      </main>

      <RelatedProducts categoryId={product.category_id} currentProductId={product.id} />
      <StoreFooter />
    </div>
  );
};

export default ProductDetail;
