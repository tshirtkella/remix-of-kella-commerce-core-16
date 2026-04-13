import { Link } from "react-router-dom";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";

interface ProductCardProps {
  product: any;
  compact?: boolean;
}

const ProductCard = ({ product, compact = false }: ProductCardProps) => {
  const { format } = useCurrency();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isWished, toggle } = useWishlist();

  const wished = isWished(product.id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Please login first", variant: "destructive" });
      return;
    }
    toggle(product.id);
  };

  const minPrice = product.variants?.length
    ? Math.min(...product.variants.map((v: any) => v.price_override ?? product.base_price))
    : product.base_price;
  const totalStock = product.variants?.reduce((s: number, v: any) => s + v.inventory_quantity, 0) ?? 0;
  const hasDiscount = product.discount_percentage > 0;
  const discounted = hasDiscount ? Number(minPrice) * (1 - product.discount_percentage / 100) : Number(minPrice);

  // Find first available variant for quick add
  const firstVariant = product.variants?.find((v: any) => v.is_active && v.inventory_quantity > 0);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant) {
      toast({ title: "Out of stock", variant: "destructive" });
      return;
    }
    const success = addItem({
      productId: product.id,
      variantId: firstVariant.id,
      name: product.name,
      color: firstVariant.color,
      size: firstVariant.size,
      price: firstVariant.price_override ?? product.base_price,
      quantity: 1,
      image: product.images?.sort((a: any, b: any) => a.position - b.position)?.[0]?.url,
      slug: product.slug,
      maxStock: firstVariant.inventory_quantity,
    });
    if (success) {
      toast({ title: "Added to cart!", description: `${product.name}` });
    } else {
      toast({ title: "Already at max stock", variant: "destructive" });
    }
  };

  // Mock rating from reviews (will show static stars for now)
  const rating = 4.2;
  const reviewCount = Math.floor(Math.random() * 50) + 5;

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 relative"
    >
      {/* Image */}
      <div className="aspect-square bg-muted/30 overflow-hidden relative">
        {product.images?.sort((a: any, b: any) => a.position - b.position)?.[0]?.url ? (
          <img
            src={product.images.sort((a: any, b: any) => a.position - b.position)[0].url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">👕</div>
        )}

        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
          {totalStock === 0 && (
            <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded">SOLD OUT</span>
          )}
          {totalStock > 0 && totalStock <= 5 && (
            <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded">Limited Stock</span>
          )}
          {hasDiscount && (
            <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded">
              Save {product.discount_percentage}%
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform z-10"
          title={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-3.5 w-3.5 ${wished ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
        </button>

        {/* Quick Add to Cart */}
        {totalStock > 0 && (
          <button
            onClick={handleQuickAdd}
            className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110"
            title="Add to Cart"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <h3 className={`font-medium leading-tight line-clamp-2 ${compact ? "text-xs min-h-[2rem]" : "text-sm min-h-[2.5rem]"}`}>
          {product.name}
        </h3>

        {/* Price */}
        <div className="mt-1.5 flex items-center gap-2">
          <span className={`font-bold text-primary ${compact ? "text-sm" : "text-base"}`}>{format(discounted)}</span>
        </div>
        {hasDiscount && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="line-through">{format(Number(minPrice))}</span>
            <span className="text-destructive font-semibold">-{product.discount_percentage}%</span>
          </div>
        )}

        {/* Stars + Reviews */}
        <div className="flex items-center gap-1 mt-1.5">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-3 w-3 ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">({reviewCount})</span>
        </div>

        {/* Category label */}
        {!compact && product.categories?.name && (
          <p className="text-[10px] text-muted-foreground mt-1">{product.categories.name}</p>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
