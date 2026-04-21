import { useEffect } from "react";
import { Lock, ShieldCheck, BadgeCheck, Loader2 } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";

interface PaymentRedirectOverlayProps {
  open: boolean;
  gatewayName?: string;
}

export const PaymentRedirectOverlay = ({
  open,
  gatewayName = "SSLCOMMERZ",
}: PaymentRedirectOverlayProps) => {
  const branding = useBranding();

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Redirecting to secure payment"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-primary" />

        <div className="p-8 flex flex-col items-center text-center">
          {/* Logo */}
          {branding.logo_url ? (
            <img
              src={branding.logo_url}
              alt={branding.store_name}
              className="h-10 w-auto object-contain mb-6"
            />
          ) : (
            <div className="text-base font-bold tracking-tight mb-6">
              {branding.store_name}
            </div>
          )}

          {/* Animated lock + spinner */}
          <div className="relative mb-6 h-24 w-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
            <div className="absolute inset-2 rounded-full bg-primary/5 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" strokeWidth={2.25} />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-foreground mb-1.5">
            Redirecting to secure payment…
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Please don&apos;t close or refresh this page.
          </p>

          {/* Trust row */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground mb-5">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              SSL Secured
            </span>
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3.5 w-3.5 text-success" />
              256-bit encryption
            </span>
            <span className="inline-flex items-center gap-1">
              <BadgeCheck className="h-3.5 w-3.5 text-success" />
              Verified gateway
            </span>
          </div>

          {/* Indeterminate progress bar */}
          <div className="relative w-full h-1 rounded-full bg-muted overflow-hidden mb-4">
            <div className="absolute inset-y-0 left-0 w-1/3 bg-primary rounded-full animate-[shimmer_1.4s_ease-in-out_infinite]" style={{ animation: "payment-progress 1.4s ease-in-out infinite" }} />
          </div>

          {/* Powered by */}
          <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            Powered by {gatewayName}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes payment-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

export default PaymentRedirectOverlay;
