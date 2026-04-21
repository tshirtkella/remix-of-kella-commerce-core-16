import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "@/hooks/use-toast";

const CartDrawer = () => {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, isCartOpen, setIsCartOpen } = useCart();
  const { format } = useCurrency();
  const { toast } = useToast();

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Cart ({totalItems})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <ShoppingBag className="h-16 w-16 opacity-20" />
            <p className="text-sm">Your cart is empty</p>
            <Button variant="outline" onClick={() => setIsCartOpen(false)} asChild>
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-3 p-3 rounded-lg border border-border">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-20 h-20 rounded-md object-cover shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <span className="text-2xl opacity-20">👕</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.slug}`}
                      className="text-sm font-medium text-foreground hover:text-primary line-clamp-1"
                      onClick={() => setIsCartOpen(false)}
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.color} / {item.size}
                    </p>
                    <p className="text-sm font-semibold mt-1">{format(item.price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name}`}
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="h-9 w-9 rounded border border-border flex items-center justify-center hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition"
                      >
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span
                        className="text-sm font-medium w-8 text-center"
                        aria-live="polite"
                        aria-label={`Quantity: ${item.quantity}`}
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.name}`}
                        onClick={() => {
                          const success = updateQuantity(item.variantId, item.quantity + 1);
                          if (!success) {
                            toast({ title: "Stock limit reached!", description: `Only ${item.maxStock} available.`, variant: "destructive" });
                          }
                        }}
                        className="h-9 w-9 rounded border border-border flex items-center justify-center hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition">
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name} from cart`}
                        onClick={() => removeItem(item.variantId)}
                        className="ml-auto h-9 w-9 rounded flex items-center justify-center text-muted-foreground hover:text-destructive focus-visible:ring-2 focus-visible:ring-destructive focus-visible:outline-none transition"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{format(totalPrice)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Shipping calculated at checkout.</p>
              <Button className="w-full" size="lg" asChild onClick={() => setIsCartOpen(false)}>
                <Link to="/checkout">Checkout — {format(totalPrice)}</Link>
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setIsCartOpen(false)}>
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
