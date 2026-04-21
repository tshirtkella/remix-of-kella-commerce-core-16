import { useEffect, useState } from "react";
import { Truck, ShieldCheck, RotateCcw, MapPin, Loader2, Plus } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const POPULAR_CITIES = [
  { city: "Dhaka", country: "Bangladesh" },
  { city: "Chattogram", country: "Bangladesh" },
  { city: "Sylhet", country: "Bangladesh" },
  { city: "Khulna", country: "Bangladesh" },
  { city: "Rajshahi", country: "Bangladesh" },
  { city: "Barishal", country: "Bangladesh" },
  { city: "Rangpur", country: "Bangladesh" },
  { city: "Mymensingh", country: "Bangladesh" },
];

interface SavedAddress {
  id: string;
  label: string | null;
  full_name: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  zip: string | null;
  country: string | null;
  is_default: boolean | null;
}

const STORAGE_KEY = "delivery_location";

const readStored = (): { city: string; country: string } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { city: "Dhaka", country: "Bangladesh" };
};

const ProductDeliveryInfo = () => {
  const { format } = useCurrency();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [location, setLocation] = useState(readStored);
  const [open, setOpen] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [fetching, setFetching] = useState(false);

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 7);
  const deliveryEnd = new Date();
  deliveryEnd.setDate(deliveryEnd.getDate() + 12);
  const fmtStart = deliveryDate.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
  const fmtEnd = deliveryEnd.toLocaleDateString("en-US", { day: "2-digit", month: "short" });

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      setFetching(true);
      const { data } = await supabase
        .from("shipping_addresses")
        .select("id, label, full_name, address_line1, address_line2, city, state, zip, country, is_default")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });
      if (!cancelled && data) setAddresses(data as SavedAddress[]);
      if (!cancelled) setFetching(false);
    })();
    return () => { cancelled = true; };
  }, [open, user]);

  const persist = (next: { city: string; country: string }) => {
    setLocation(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const pickSaved = (a: SavedAddress) => {
    persist({ city: a.city, country: a.country || "Bangladesh" });
    toast({ title: "Delivery location updated", description: `${a.city}, ${a.country || ""}`.trim() });
    setOpen(false);
  };

  const pickCity = (c: { city: string; country: string }) => {
    persist(c);
    toast({ title: "Delivery location updated", description: `${c.city}, ${c.country}` });
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Delivery Options */}
      <div className="border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Delivery Options</h3>

        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-foreground">{location.city}, {location.country}</p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-xs text-primary hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              CHANGE
            </button>
          </div>
        </div>

        <div className="border-t border-border pt-3 flex items-start gap-3">
          <Truck className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Standard Delivery</p>
              <p className="text-sm font-semibold text-foreground">{format(165)}</p>
            </div>
            <p className="text-xs text-muted-foreground">Guaranteed by {fmtStart} - {fmtEnd}</p>
          </div>
        </div>

        <div className="border-t border-border pt-3 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">Cash on Delivery Available</p>
        </div>
      </div>

      {/* Return & Warranty */}
      <div className="border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Return & Warranty</h3>

        <div className="flex items-start gap-3">
          <RotateCcw className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">14 days easy return</p>
        </div>

        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">Seller Warranty</p>
        </div>
      </div>

      {/* Change Location Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Change Delivery Location</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Saved addresses (logged-in users) */}
            {user && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Saved Addresses</p>
                {fetching ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : addresses.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-2">No saved addresses yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => { setOpen(false); navigate("/shipping-address"); }}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Address
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {addresses.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => pickSaved(a)}
                        className="w-full text-left px-3 py-2.5 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                      >
                        <p className="text-sm font-medium text-foreground">
                          {a.label || "Address"}{a.is_default ? " · Default" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {a.address_line1}, {a.city}{a.state ? `, ${a.state}` : ""} {a.country || ""}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Popular cities — quick picker */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {user && addresses.length > 0 ? "Or Pick a City" : "Popular Cities"}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {POPULAR_CITIES.map((c) => {
                  const active = location.city === c.city && location.country === c.country;
                  return (
                    <button
                      key={c.city}
                      type="button"
                      onClick={() => pickCity(c)}
                      className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                        active
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border hover:border-primary hover:bg-primary/5"
                      }`}
                    >
                      {c.city}
                    </button>
                  );
                })}
              </div>
            </div>

            {!user && (
              <p className="text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => { setOpen(false); navigate("/login"); }}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </button>
                {" "}to use your saved addresses.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDeliveryInfo;
