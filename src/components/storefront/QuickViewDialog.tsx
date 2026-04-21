import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart, Star, Heart, Clock, Truck, ShieldCheck, RotateCcw, AlertTriangle } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import ShareButton from "./ShareButton";

interface QuickViewDialogProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickViewDialog = ({ product, open, onOpenChange }: QuickViewDialogProps) => {
  const { format } = useCurrency();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isWished, toggle } = useWishlist();
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

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
    return product.variants.find((v: any) => v.is_active && v.color === selectedColor && v.size === selectedSize) ?? null;
  }, [product, selectedColor, selectedSize]);

  // Auto-select first color
  if (colors.length > 0 && !selectedColor) {
    setSelectedColor(colors[0] as string);
  }

  const displayPrice = selectedVariant?.price_override ?? product?.base_price;
  const stock = selectedVariant?.inventory_quantity ?? null;
  const image = product?.images?.sort((a: any, b: any) => a.position - b.position)?.[0];
  const totalStock = product?.variants?.reduce((s: number, v: any) => s + v.inventory_quantity, 0) ?? 0;
  const deliveryHours = new Date().getHours() < 14 ? "today" : "tomorrow";
  const wished = product ? isWished(product.id) : false;

  // Stub rating (matches ProductCard behaviour)
  const rating = 4.2;
  const reviewCount = useMemo(() => Math.floor((product?.id?.charCodeAt?.(0) ?? 30) % 50) + 5, [product?.id]);

  const handleAdd = () => {
    if (!selectedSize) { toast({ title: "Please select a size", variant: "destructive" }); return; }
    if (!selectedVariant || stock === 0) { toast({ title: "Out of stock", variant: "destructive" }); return; }
    const success = addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      color: selectedColor!,
      size: selectedSize!,
      price: Number(displayPrice),
      quantity,
      image: image?.url,
      slug: product.slug,
      maxStock: stock ?? undefined,
    });
    if (success) {
      toast({ title: "Added to cart!", description: `${product.name}` });
      onOpenChange(false);
    } else {
      toast({ title: "Stock limit reached!", variant: "destructive" });
    }
  };

  const handleWishlist = () => {
    if (!user) { toast({ title: "Please login first", variant: "destructive" }); return; }
    toggle(product.id);
  };


  if (!product) return null;

  const finalPrice = product.discount_percentage > 0
    ? Number(displayPrice) * (1 - product.discount_percentage / 100)
    : Number(displayPrice);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <div className="flex flex-col sm:flex-row max-h-[90vh]">
          {/* Image */}
          <div className="sm:w-1/2 aspect-square bg-muted/30 relative shrink-0">
            {image?.url ? (
              <img src={image.url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl opacity-10">👕</div>
            )}
            {totalStock === 0 && (
              <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs">SOLD OUT</Badge>
            )}
            {product.discount_percentage > 0 && totalStock > 0 && (
              <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs">
                -{product.discount_percentage}%
              </Badge>
            )}
          </div>

          {/* Info */}
          <div className="sm:w-1/2 p-5 space-y-3 overflow-y-auto">
            <Link to={`/product/${product.slug}`} onClick={() => onOpenChange(false)} className="text-lg font-bold font-heading hover:text-primary transition line-clamp-2 block">
              {product.name}
            </Link>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} aria-hidden="true" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{rating.toFixed(1)} ({reviewCount} reviews)</span>
            </div>

            {/* Action icons */}
            <div className="flex items-center gap-3">
              <ShareButton
                variant="ghost-icon"
                url={`${window.location.origin}/product/${product.slug}`}
                title={product.name}
                description={product.description ?? undefined}
                image={image?.url}
              />
              <button
                type="button"
                onClick={handleWishlist}
                aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={wished}
                className="text-muted-foreground hover:text-destructive transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded p-1">
                <Heart className={`h-4 w-4 ${wished ? "fill-red-500 text-red-500" : ""}`} aria-hidden="true" />
              </button>
            </div>

            {product.categories?.name && (
              <p className="text-xs text-muted-foreground">
                Brand: <Link to={`/shop?category=${product.categories.slug}`} onClick={() => onOpenChange(false)} className="text-primary hover:underline">{product.categories.name}</Link>
              </p>
            )}

            {/* Price */}
            {product.discount_percentage > 0 ? (
              <div>
                <p className="text-2xl font-bold text-primary">{format(finalPrice)}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground line-through">{format(Number(displayPrice))}</span>
                  <span className="text-xs text-destructive font-semibold">
                    Save {format(Number(displayPrice) - finalPrice)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-2xl font-bold text-primary">{format(Number(displayPrice))}</p>
            )}

            {/* Urgency */}
            {totalStock > 0 && totalStock <= 10 && (
              <div className="flex items-center gap-2 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2.5 py-1.5 rounded border border-amber-500/20">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="font-medium">Only {totalStock} left — order soon!</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Order within <span className="font-semibold text-foreground">2 hours</span> for delivery {deliveryHours}</span>
            </div>

            {product.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            {/* SKU */}
            {selectedVariant?.sku && (
              <p className="text-[11px] text-muted-foreground">SKU: <span className="text-foreground font-mono">{selectedVariant.sku}</span></p>
            )}

            {/* Color */}
            {colors.length > 0 && (
              <div role="radiogroup" aria-label="Color">
                <p className="text-xs font-medium mb-1.5">Color: <span className="text-foreground">{selectedColor}</span></p>
                <div className="flex flex-wrap gap-1.5">
                  {colors.map((c) => (
                    <button
                      key={c as string}
                      type="button"
                      role="radio"
                      aria-checked={selectedColor === c}
                      aria-label={`Color ${c as string}`}
                      onClick={() => { setSelectedColor(c as string); setSelectedSize(null); }}
                      className={`min-h-[36px] px-3 py-1.5 rounded border text-xs font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${selectedColor === c ? "border-primary bg-primary/5 text-primary" : "border-border"}`}>
                      {c as string}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size */}
            {sizes.length > 0 && (
              <div role="radiogroup" aria-label="Size">
                <p className="text-xs font-medium mb-1.5">Size</p>
                <div className="flex flex-wrap gap-1.5">
                  {sizes.map((s) => {
                    const v = product.variants?.find((v: any) => v.is_active && v.color === selectedColor && v.size === s);
                    const oos = v && v.inventory_quantity === 0;
                    return (
                      <button
                        key={s as string}
                        type="button"
                        role="radio"
                        aria-checked={selectedSize === s}
                        aria-label={`Size ${s as string}${oos ? " (out of stock)" : ""}`}
                        onClick={() => !oos && setSelectedSize(s as string)}
                        disabled={!!oos}
                        className={`min-w-[40px] min-h-[36px] px-3 py-1.5 rounded border text-xs font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${oos ? "border-border text-muted-foreground/40 line-through" : selectedSize === s ? "border-primary bg-primary/5 text-primary" : "border-border"}`}>
                        {s as string}
                      </button>
                    );
                  })}
                </div>
                {stock !== null && stock > 0 && stock < 5 && (
                  <p className="text-xs text-amber-600 mt-1">Only {stock} left in this size!</p>
                )}
                {stock === 0 && (
                  <p className="text-xs text-destructive mt-1">This variant is out of stock</p>
                )}
              </div>
            )}

            {/* Qty + Add */}
            <div className="flex items-center gap-3 pt-2">
              <div className="inline-flex items-center border border-border rounded">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="h-9 w-9 flex items-center justify-center hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                  <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <span
                  className="w-10 text-center text-sm font-medium border-x border-border"
                  aria-live="polite"
                  aria-label={`Quantity: ${quantity}`}>
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity(q => q + 1)}
                  className="h-9 w-9 flex items-center justify-center hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
              <Button onClick={handleAdd} disabled={totalStock === 0} className="flex-1 h-10 text-sm">
                <ShoppingCart className="h-4 w-4 mr-2" aria-hidden="true" />
                {totalStock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
              <div className="flex flex-col items-center text-center gap-1">
                <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-[10px] text-muted-foreground leading-tight">Fast Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <RotateCcw className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-[10px] text-muted-foreground leading-tight">Easy Returns</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-[10px] text-muted-foreground leading-tight">Secure Payment</span>
              </div>
            </div>

            <Link to={`/product/${product.slug}`} onClick={() => onOpenChange(false)} className="block text-xs text-primary hover:underline text-center pt-1">
              View Full Details →
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickViewDialog;
