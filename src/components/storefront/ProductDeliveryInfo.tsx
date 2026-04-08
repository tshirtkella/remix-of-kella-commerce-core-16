import { Truck, ShieldCheck, RotateCcw, MapPin } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

const ProductDeliveryInfo = () => {
  const { format } = useCurrency();
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 7);
  const deliveryEnd = new Date();
  deliveryEnd.setDate(deliveryEnd.getDate() + 12);
  const fmtStart = deliveryDate.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
  const fmtEnd = deliveryEnd.toLocaleDateString("en-US", { day: "2-digit", month: "short" });

  return (
    <div className="space-y-4">
      {/* Delivery Options */}
      <div className="border border-border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Delivery Options</h3>

        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-foreground">Dhaka, Bangladesh</p>
            <button className="text-xs text-primary hover:underline font-medium">CHANGE</button>
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
    </div>
  );
};

export default ProductDeliveryInfo;
