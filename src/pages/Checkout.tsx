import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Trash2, HelpCircle, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreFooter from "@/components/storefront/StoreFooter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ShippingZone = "inside_dhaka" | "sub_dhaka" | "outside_dhaka";
type PaymentMethod = "cod" | "sslcommerz" | "bkash";
type BillingOption = "same" | "different";

const SHIPPING_ZONES: { value: ShippingZone; label: string; description?: string; price: number }[] = [
  { value: "inside_dhaka", label: "Inside Dhaka (ঢাকার ভিতরে)", price: 60 },
  { value: "sub_dhaka", label: "Sub Dhaka", description: "Keranigonj, Turag, Demra, Diabari, Purbachal, 100 feet, Bosila, Nowabpur, Dohar, Kamrangirchar, Doniya, Amin Bazar", price: 100 },
  { value: "outside_dhaka", label: "Outside Dhaka", description: "120tk Advance Payment Required via Bkash", price: 120 },
];

const Checkout = () => {
  const { items, totalPrice, clearCart, removeItem } = useCart();
  const { format } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [shippingZone, setShippingZone] = useState<ShippingZone>("inside_dhaka");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [billingOption, setBillingOption] = useState<BillingOption>("same");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount_type: string; discount_value: number; id: string } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [emailOffers, setEmailOffers] = useState(true);
  const [saveInfo, setSaveInfo] = useState(false);
  const [textOffers, setTextOffers] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[\d+\-() ]{7,15}$/;

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!emailRegex.test(form.email.trim())) errors.email = "Enter a valid email address";

    if (!form.firstName.trim()) errors.firstName = "First name is required";
    else if (form.firstName.trim().length < 2) errors.firstName = "First name must be at least 2 characters";

    if (!form.phone.trim()) errors.phone = "Phone is required";
    else if (!phoneRegex.test(form.phone.trim())) errors.phone = "Enter a valid phone number";

    if (!form.address.trim()) errors.address = "Address is required";
    else if (form.address.trim().length < 5) errors.address = "Enter a complete address";

    if (!form.city.trim()) errors.city = "City is required";

    return errors;
  };

  const getFieldError = (field: string) => attempted ? fieldErrors[field] : undefined;

  // Fetch enabled payment methods from admin settings
  const { data: paymentSettings } = useQuery({
    queryKey: ["store-payment-settings-checkout"],
    queryFn: async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("key, value")
        .like("key", "payment_%");
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => { map[r.key] = r.value; });
      const hasAnySettings = Object.keys(map).length > 0;
      return {
        sslcommerz: hasAnySettings ? map.payment_sslcommerz_enabled === "true" : true,
        cod: map.payment_cod_enabled !== "false",
        bkash: hasAnySettings ? map.payment_bkash_enabled === "true" : true,
        bkash_number: map.payment_bkash_number || "",
        bkash_instructions: map.payment_bkash_instructions || "",
      };
    },
    staleTime: 30_000,
  });

  const enabledMethods = paymentSettings ?? { sslcommerz: true, cod: true, bkash: true, bkash_number: "", bkash_instructions: "" };

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    zip: "",
    phone: "",
    country: "Bangladesh",
  });

  const shippingCost = SHIPPING_ZONES.find((z) => z.value === shippingZone)?.price ?? 60;
  const promoDiscount = appliedPromo
    ? appliedPromo.discount_type === "percentage"
      ? Math.round(totalPrice * (appliedPromo.discount_value / 100) * 100) / 100
      : Math.min(appliedPromo.discount_value, totalPrice)
    : 0;
  const discountedSubtotal = totalPrice - promoDiscount;
  const tax = Math.round(discountedSubtotal * 0.075 * 100) / 100;
  const grandTotal = discountedSubtotal + shippingCost + tax;

  const handleApplyPromo = async () => {
    const code = discountCode.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .single();
      if (error || !data) { setPromoError("Invalid promo code"); return; }
      if (data.ends_at && new Date(data.ends_at) < new Date()) { setPromoError("This code has expired"); return; }
      if (data.starts_at && new Date(data.starts_at) > new Date()) { setPromoError("This code is not yet active"); return; }
      if (data.max_uses && data.used_count >= data.max_uses) { setPromoError("This code has reached its usage limit"); return; }
      if (totalPrice < data.min_order_amount) { setPromoError(`Minimum order amount is ৳${data.min_order_amount}`); return; }
      setAppliedPromo({ code: data.code, discount_type: data.discount_type, discount_value: Number(data.discount_value), id: data.id });
      toast({ title: "Promo code applied!", description: `${data.discount_type === "percentage" ? data.discount_value + "%" : "৳" + data.discount_value} discount` });
    } catch {
      setPromoError("Failed to validate code");
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setDiscountCode("");
    setPromoError("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear specific field error on change
    if (attempted && fieldErrors[name]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[name]; return next; });
    }
  };

  const handlePlaceOrder = async () => {
    setAttempted(true);
    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast({ title: "Please fix the errors below", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "Your cart is empty", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const fullName = `${form.firstName} ${form.lastName}`.trim();

      const { data: customer, error: custErr } = await supabase
        .from("customers")
        .insert({
          email: form.email,
          first_name: form.firstName,
          last_name: form.lastName || null,
          phone: form.phone,
          address_line1: form.address,
          city: form.city,
          zip: form.zip || null,
          country: form.country,
        })
        .select("id")
        .single();

      if (custErr) throw custErr;

      const shippingAddress = `${fullName}\n${form.address}\n${form.city}${form.zip ? `, ${form.zip}` : ""}\n${form.country}\n${form.phone}`;
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: customer.id,
          subtotal: discountedSubtotal,
          shipping_cost: shippingCost,
          tax,
          total: grandTotal,
          shipping_address: shippingAddress,
          notes: `Shipping: ${shippingZone} | Payment: ${paymentMethod}${appliedPromo ? ` | Promo: ${appliedPromo.code} (-${appliedPromo.discount_type === "percentage" ? appliedPromo.discount_value + "%" : "৳" + appliedPromo.discount_value})` : ""}`,
          status: paymentMethod === "cod" ? "confirmed" : "pending",
        })
        .select("id")
        .single();

      if (orderErr) throw orderErr;

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

      // Increment promo code used_count via secure function
      if (appliedPromo) {
        await supabase.rpc("increment_promo_usage", { _promo_id: appliedPromo.id });
      }

      if (paymentMethod === "sslcommerz") {
        toast({ title: "Online payment coming soon!", description: "Your order has been placed as COD for now." });
      } else if (paymentMethod === "bkash") {
        toast({ title: "bKash payment coming soon!", description: "Your order has been placed as COD for now." });
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

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Left – Form */}
          <div className="lg:col-span-3 space-y-8">
            {/* Contact */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Contact</h2>
                {!user && (
                  <Link to="/login" className="text-sm text-primary hover:underline">Sign in</Link>
                )}
              </div>
              <Input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email or mobile phone number *"
                className={getFieldError("email") ? "border-destructive ring-1 ring-destructive" : ""}
              />
              {getFieldError("email") && <p className="text-xs text-destructive">{getFieldError("email")}</p>}
              <div className="flex items-center gap-2">
                <Checkbox id="emailOffers" checked={emailOffers} onCheckedChange={(v) => setEmailOffers(!!v)} />
                <Label htmlFor="emailOffers" className="text-sm cursor-pointer">Email me with news and offers</Label>
              </div>
            </section>

            <Separator />

            {/* Delivery */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Delivery</h2>

              <div>
                <Label className="text-xs text-muted-foreground">Country/Region</Label>
                <Input value="Bangladesh" disabled className="mt-1 bg-muted/30" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name *" className={getFieldError("firstName") ? "border-destructive ring-1 ring-destructive" : ""} />
                  {getFieldError("firstName") && <p className="text-xs text-destructive mt-1">{getFieldError("firstName")}</p>}
                </div>
                <div>
                  <Input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" />
                </div>
              </div>

              <div>
                <Input name="address" value={form.address} onChange={handleChange} placeholder="Address *" className={getFieldError("address") ? "border-destructive ring-1 ring-destructive" : ""} />
                {getFieldError("address") && <p className="text-xs text-destructive mt-1">{getFieldError("address")}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input name="city" value={form.city} onChange={handleChange} placeholder="City *" className={getFieldError("city") ? "border-destructive ring-1 ring-destructive" : ""} />
                  {getFieldError("city") && <p className="text-xs text-destructive mt-1">{getFieldError("city")}</p>}
                </div>
                <Input name="zip" value={form.zip} onChange={handleChange} placeholder="Postal code (optional)" />
              </div>

              <div className="relative">
                <Input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone *" className={getFieldError("phone") ? "border-destructive ring-1 ring-destructive" : ""} />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">In case we need to contact you about your order</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {getFieldError("phone") && <p className="text-xs text-destructive mt-1">{getFieldError("phone")}</p>}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="saveInfo" checked={saveInfo} onCheckedChange={(v) => setSaveInfo(!!v)} />
                <Label htmlFor="saveInfo" className="text-sm cursor-pointer">Save this information for next time</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="textOffers" checked={textOffers} onCheckedChange={(v) => setTextOffers(!!v)} />
                <Label htmlFor="textOffers" className="text-sm cursor-pointer">Text me with news and offers</Label>
              </div>
            </section>

            <Separator />

            {/* Shipping Method */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Shipping method</h2>
              <RadioGroup value={shippingZone} onValueChange={(v) => setShippingZone(v as ShippingZone)} className="space-y-0 border border-border rounded-lg overflow-hidden">
                {SHIPPING_ZONES.map((zone, idx) => (
                  <label
                    key={zone.value}
                    className={`flex items-start gap-3 p-4 cursor-pointer transition ${
                      shippingZone === zone.value ? "bg-primary/5 border-primary" : "hover:bg-muted/30"
                    } ${idx > 0 ? "border-t border-border" : ""}`}
                  >
                    <RadioGroupItem value={zone.value} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{zone.label}</p>
                      {zone.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{zone.description}</p>
                      )}
                    </div>
                    <span className="text-sm font-medium shrink-0">{format(zone.price)}</span>
                  </label>
                ))}
              </RadioGroup>
            </section>

            <Separator />

            {/* Payment */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Payment</h2>
              <p className="text-xs text-muted-foreground">All transactions are secure and encrypted.</p>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="space-y-0 border border-border rounded-lg overflow-hidden">
                {enabledMethods.sslcommerz && (
                  <>
                    <label
                      className={`flex items-center gap-3 p-4 cursor-pointer transition ${
                        paymentMethod === "sslcommerz" ? "bg-primary/5 border-primary" : "hover:bg-muted/30"
                      }`}
                    >
                      <RadioGroupItem value="sslcommerz" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">SSLCOMMERZ</span>
                          <div className="flex gap-1">
                            <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold">VISA</span>
                            <span className="text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded font-bold">MC</span>
                            <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded font-bold">AMEX</span>
                            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-bold">+2</span>
                          </div>
                        </div>
                      </div>
                    </label>
                    {paymentMethod === "sslcommerz" && (
                      <div className="px-4 pb-4 bg-muted/20 border-t border-border">
                        <p className="text-sm text-muted-foreground py-3">
                          You'll be redirected to SSLCOMMERZ to complete your purchase.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {enabledMethods.cod && (
                  <label
                    className={`flex items-center gap-3 p-4 cursor-pointer transition border-t border-border ${
                      paymentMethod === "cod" ? "bg-primary/5 border-primary" : "hover:bg-muted/30"
                    }`}
                  >
                    <RadioGroupItem value="cod" />
                    <span className="text-sm font-medium">Cash on Delivery (COD)</span>
                  </label>
                )}

                {enabledMethods.bkash && (
                  <>
                    <label
                      className={`flex items-center gap-3 p-4 cursor-pointer transition border-t border-border ${
                        paymentMethod === "bkash" ? "bg-primary/5 border-primary" : "hover:bg-muted/30"
                      }`}
                    >
                      <RadioGroupItem value="bkash" />
                      <span className="text-sm font-semibold text-foreground">bkash</span>
                    </label>
                  </>
                )}
              </RadioGroup>
            </section>

            <Separator />

            {/* Billing Address */}
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Billing address</h2>
              <RadioGroup value={billingOption} onValueChange={(v) => setBillingOption(v as BillingOption)} className="space-y-0 border border-border rounded-lg overflow-hidden">
                <label className={`flex items-center gap-3 p-4 cursor-pointer transition ${billingOption === "same" ? "bg-primary/5" : "hover:bg-muted/30"}`}>
                  <RadioGroupItem value="same" />
                  <span className="text-sm font-medium">Same as shipping address</span>
                </label>
                <label className={`flex items-center gap-3 p-4 cursor-pointer transition border-t border-border ${billingOption === "different" ? "bg-primary/5" : "hover:bg-muted/30"}`}>
                  <RadioGroupItem value="different" />
                  <span className="text-sm font-medium">Use a different billing address</span>
                </label>
              </RadioGroup>
            </section>

            {/* Pay Now button */}
            <Button
              className="w-full h-12 font-semibold text-base"
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : paymentMethod === "cod" ? (
                "Place Order"
              ) : (
                "Pay now"
              )}
            </Button>

            {/* Footer links */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 pb-8">
              <Link to="/about" className="underline hover:text-foreground">Refund policy</Link>
              <Link to="/about" className="underline hover:text-foreground">Shipping</Link>
              <Link to="/about" className="underline hover:text-foreground">Privacy policy</Link>
              <Link to="/about" className="underline hover:text-foreground">Terms of service</Link>
            </div>
          </div>

          {/* Right – Order Summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4 bg-muted/20 border-l border-border lg:pl-8 lg:-ml-4">
              {/* Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-3 items-start">
                    <div className="relative shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover border border-border" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-xl opacity-30">👕</div>
                      )}
                      <span className="absolute -top-2 -right-2 bg-muted-foreground text-background text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.size}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{format(item.price * item.quantity)}</span>
                      <button onClick={() => removeItem(item.variantId)} className="text-muted-foreground hover:text-destructive transition">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount */}
              {appliedPromo ? (
                <div className="flex items-center justify-between bg-success/10 rounded-lg px-3 py-2 pt-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-success" />
                    <span className="text-sm font-mono font-bold text-success">{appliedPromo.code}</span>
                    <Badge variant="secondary" className="text-[10px] bg-success/20 text-success border-0">
                      {appliedPromo.discount_type === "percentage" ? `${appliedPromo.discount_value}% off` : `৳${appliedPromo.discount_value} off`}
                    </Badge>
                  </div>
                  <button onClick={removePromo} className="text-muted-foreground hover:text-destructive transition">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="pt-2 space-y-1">
                  <div className="flex gap-2">
                    <Input
                      value={discountCode}
                      onChange={(e) => { setDiscountCode(e.target.value); setPromoError(""); }}
                      placeholder="Discount code or gift card"
                      className={`flex-1 uppercase font-mono ${promoError ? "border-destructive" : ""}`}
                    />
                    <Button variant="outline" onClick={handleApplyPromo} disabled={promoLoading}>
                      {promoLoading ? "..." : "Apply"}
                    </Button>
                  </div>
                  {promoError && <p className="text-xs text-destructive">{promoError}</p>}
                </div>
              )}

              <Separator />

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{format(totalPrice)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount ({appliedPromo?.code})</span>
                    <span>-{format(promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    Shipping
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Based on your shipping zone selection</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <span>{format(shippingCost)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    Estimated taxes
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Tax calculated at 7.5%</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <span>{format(tax)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-baseline font-bold text-lg pb-4">
                <span>Total</span>
                <span>{format(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
};

export default Checkout;
