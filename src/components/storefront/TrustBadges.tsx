import { Shield, CreditCard, RotateCcw, Truck, Clock, Award } from "lucide-react";

const BADGES = [
  { icon: Shield, label: "Secure Payment", desc: "SSL Encrypted" },
  { icon: CreditCard, label: "Cash on Delivery", desc: "Pay at your door" },
  { icon: RotateCcw, label: "Easy Returns", desc: "7-day return policy" },
  { icon: Truck, label: "Free Shipping", desc: "On orders ৳2000+" },
  { icon: Clock, label: "Fast Delivery", desc: "2-5 business days" },
  { icon: Award, label: "Genuine Products", desc: "100% authentic" },
];

const TrustBadges = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {BADGES.map((b) => (
          <div key={b.label} className="flex flex-col items-center text-center gap-1.5 p-3 rounded-xl bg-card border border-border">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <b.icon className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold">{b.label}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{b.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrustBadges;
