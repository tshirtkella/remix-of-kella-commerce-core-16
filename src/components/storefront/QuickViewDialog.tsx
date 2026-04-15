import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

interface QuickViewDialogProps {
  product: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickViewDialog = ({ product, open, onOpenChange }: QuickViewDialogProps) => {
  const { format } = useCurrency();
  const { addItem } = useCart();
  const { toast } = useToast();
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

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogTitle className="sr-only">{product.name}</DialogTitle>
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="sm:w-1/2 aspect-square bg-muted/30 relative">
            {image?.url ? (
              <img src={image.url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl opacity-10">👕</div>
            )}
            {totalStock === 0 && (
              <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs">SOLD OUT</Badge>
            )}
          </div>

          {/* Info */}
          <div className="sm:w-1/2 p-5 space-y-3">
            <Link to={`/product/${product.slug}`} onClick={() => onOpenChange(false)} className="text-lg font-bold font-heading hover:text-primary transition line-clamp-2">
              {product.name}
            </Link>

            {product.discount_percentage > 0 ? (
              <div>
                <p className="text-xl font-bold text-primary">{format(Number(displayPrice) * (1 - product.discount_percentage / 100))}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground line-through">{format(Number(displayPrice))}</span>
                  <Badge className="bg-destructive/10 text-destructive border-0 text-xs">-{product.discount_percentage}%</Badge>
                </div>
              </div>
            ) : (
              <p className="text-xl font-bold text-primary">{format(Number(displayPrice))}</p>
            )}

            {/* Color */}
            {colors.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1.5">Color: {selectedColor}</p>
                <div className="flex flex-wrap gap-1.5">
                  {colors.map((c) => (
                    <button key={c as string} onClick={() => { setSelectedColor(c as string); setSelectedSize(null); }}
                      className={`px-3 py-1 rounded border text-xs font-medium ${selectedColor === c ? "border-primary bg-primary/5 text-primary" : "border-border"}`}>
                      {c as string}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size */}
            {sizes.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-1.5">Size</p>
                <div className="flex flex-wrap gap-1.5">
                  {sizes.map((s) => {
                    const v = product.variants?.find((v: any) => v.is_active && v.color === selectedColor && v.size === s);
                    const oos = v && v.inventory_quantity === 0;
                    return (
                      <button key={s as string} onClick={() => !oos && setSelectedSize(s as string)} disabled={!!oos}
                        className={`min-w-[40px] px-3 py-1 rounded border text-xs font-medium ${oos ? "border-border text-muted-foreground/40 line-through" : selectedSize === s ? "border-primary bg-primary/5 text-primary" : "border-border"}`}>
                        {s as string}
                      </button>
                    );
                  })}
                </div>
                {stock !== null && stock > 0 && stock < 5 && (
                  <p className="text-xs text-amber-600 mt-1">Only {stock} left!</p>
                )}
              </div>
            )}

            {/* Qty + Add */}
            <div className="flex items-center gap-3 pt-2">
              <div className="inline-flex items-center border border-border rounded">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="h-8 w-8 flex items-center justify-center hover:bg-muted/50"><Minus className="h-3 w-3" /></button>
                <span className="w-8 text-center text-sm font-medium border-x border-border">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="h-8 w-8 flex items-center justify-center hover:bg-muted/50"><Plus className="h-3 w-3" /></button>
              </div>
              <Button onClick={handleAdd} disabled={totalStock === 0} className="flex-1 h-9 text-sm">
                <ShoppingCart className="h-4 w-4 mr-2" />
                {totalStock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
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
