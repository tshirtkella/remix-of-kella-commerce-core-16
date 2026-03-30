import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CreditCard, Banknote, ArrowLeft, Trash2 } from "lucide-react";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreFooter from "@/components/storefront/StoreFooter";

const Checkout = () => {
  const { items, totalPrice, clearCart, removeItem } = useCart();
  const { format } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "stripe">("cod");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    notes: "",
  });

  const shippingCost = totalPrice >= 2000 ? 0 : 120;
  const grandTotal = totalPrice + shippingCost;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async () => {
    if (!form.fullName || !form.phone || !form.address || !form.city) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "Your cart is empty", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

      // Create customer record
      const { data: customer, error: custErr } = await supabase
        .from("customers")
        .insert({
          email: form.email || `${form.phone}@placeholder.com`,
          first_name: form.fullName.split(" ")[0],
          last_name: form.fullName.split(" ").slice(1).join(" ") || null,
          phone: form.phone,
          address_line1: form.address,
          city: form.city,
          zip: form.zip || null,
        })
        .select("id")
        .single();

      if (custErr) throw custErr;

      // Create order
      const shippingAddress = `${form.fullName}\n${form.address}\n${form.city}${form.zip ? `, ${form.zip}` : ""}\n${form.phone}`;
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: customer.id,
          subtotal: totalPrice,
          shipping_cost: shippingCost,
          tax: 0,
          total: grandTotal,
          shipping_address: shippingAddress,
          notes: form.notes || null,
          status: paymentMethod === "cod" ? "confirmed" : "pending",
        })
        .select("id")
        .single();

      if (orderErr) throw orderErr;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        variant_id: item.variantId,
        product_name: item.name,
        variant_label: `${item.color} / ${item.size}`,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      if (paymentMethod === "stripe") {
        // For Stripe, we would redirect to payment - for now show coming soon
        toast({
          title: "Online payment coming soon!",
          description: "Your order has been placed as COD for now.",
        });
      }

      clearCart();
      toast({ title: "Order placed!", description: `Order #${orderNumber} confirmed.` });
      navigate("/");
    } catch (err: any) {
      console.error("Order error:", err);
      toast({ title: "Failed to place order", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <StoreHeader />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
          <p className="text-xl font-heading font-bold">Your cart is empty</p>
          <Button asChild>
            <Link to="/shop">Continue Shopping</Link>
          </Button>
        </div>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StoreHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition">
          <ArrowLeft className="h-4 w-4" /> Continue shopping
        </Link>

        <h1 className="text-2xl font-heading font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Form Section */}
          <div className="lg:col-span-3 space-y-6">
            {/* Contact */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Contact Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input id="fullName" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Your full name" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="01XXXXXXXXX" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" />
                </div>
              </div>
            </section>

            <Separator />

            {/* Shipping */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Shipping Address</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input id="address" name="address" value={form.address} onChange={handleChange} placeholder="House, Road, Area" />
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" name="city" value={form.city} onChange={handleChange} placeholder="Dhaka" />
                </div>
                <div>
                  <Label htmlFor="zip">Zip Code</Label>
                  <Input id="zip" name="zip" value={form.zip} onChange={handleChange} placeholder="1200" />
                </div>
              </div>
            </section>

            <Separator />

            {/* Payment */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Payment Method</h2>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as "cod" | "stripe")}
                className="space-y-3"
              >
                <label
                  className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition ${
                    paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem value="cod" id="cod" />
                  <Banknote className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Cash on Delivery</p>
                    <p className="text-xs text-muted-foreground">Pay when you receive your order</p>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition ${
                    paymentMethod === "stripe" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <RadioGroupItem value="stripe" id="stripe" />
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Pay Online (Card)</p>
                    <p className="text-xs text-muted-foreground">Secure payment via Stripe</p>
                  </div>
                </label>
              </RadioGroup>
            </section>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Order Notes (optional)</Label>
              <Input id="notes" name="notes" value={form.notes} onChange={handleChange} placeholder="Special instructions..." />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 border border-border rounded-lg p-5 space-y-4 bg-card">
              <h2 className="text-lg font-semibold">Order Summary</h2>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-3">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-14 h-14 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded bg-muted flex items-center justify-center shrink-0 text-lg opacity-20">👕</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.color} / {item.size} × {item.quantity}</p>
                      <p className="text-sm font-semibold">{format(item.price * item.quantity)}</p>
                    </div>
                    <button onClick={() => removeItem(item.variantId)} className="text-muted-foreground hover:text-destructive transition">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{format(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shippingCost === 0 ? "Free" : format(shippingCost)}</span>
                </div>
                {shippingCost > 0 && (
                  <p className="text-xs text-muted-foreground">Free shipping on orders over {format(2000)}</p>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{format(grandTotal)}</span>
              </div>

              <Button
                className="w-full h-12 font-semibold"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : paymentMethod === "cod" ? (
                  "Place Order (COD)"
                ) : (
                  "Pay Now"
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
};

export default Checkout;
