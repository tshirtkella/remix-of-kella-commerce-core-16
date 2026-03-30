import { Link } from "react-router-dom";
import { ArrowLeft, Shirt, Heart, Shield, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const AboutUs = () => {
  const values = [
    { icon: Shirt, title: "Quality First", desc: "We source only the finest fabrics and materials for our t-shirts." },
    { icon: Heart, title: "Customer Love", desc: "Your satisfaction is our top priority. We're always here to help." },
    { icon: Shield, title: "Trusted Brand", desc: "Thousands of happy customers trust T-Shirt Kella for their style needs." },
    { icon: Truck, title: "Fast Delivery", desc: "Quick and reliable delivery across Bangladesh and beyond." },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/profile"><ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" /></Link>
          <h1 className="text-lg font-heading font-bold text-foreground">About Us</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <div className="text-center py-6 space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Shirt className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground">T-Shirt Kella</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            Your go-to destination for premium quality t-shirts. We believe everyone deserves
            to look and feel great, and we're on a mission to make that happen — one t-shirt at a time.
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-2 gap-3">
          {values.map((v) => (
            <Card key={v.title} className="border border-border">
              <CardContent className="p-4 text-center space-y-2">
                <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <v.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">{v.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Story */}
        <Card className="border border-border">
          <CardContent className="p-5 space-y-3">
            <h3 className="font-heading font-bold text-foreground">Our Story</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Founded with a passion for fashion and quality, T-Shirt Kella started as a small
              venture with big dreams. Today, we serve thousands of customers who appreciate
              premium fabrics, unique designs, and unbeatable comfort.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every t-shirt in our collection is carefully curated to ensure it meets our high
              standards. From casual everyday wear to statement pieces, we have something for everyone.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutUs;
