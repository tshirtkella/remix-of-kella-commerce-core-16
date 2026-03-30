import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, MessageCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Support = () => {
  const contactOptions = [
    {
      icon: Phone,
      title: "Call Us",
      description: "Talk to our support team",
      detail: "+880 1234-567890",
      action: () => window.open("tel:+8801234567890"),
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      icon: Mail,
      title: "Email Us",
      description: "Get a response within 24 hours",
      detail: "support@tshirtkella.com",
      action: () => window.open("mailto:support@tshirtkella.com"),
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team",
      detail: "Available 10am - 8pm",
      action: () => {},
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/profile"><ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" /></Link>
          <h1 className="text-lg font-heading font-bold text-foreground">Support</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="text-center py-4">
          <h2 className="text-xl font-heading font-bold text-foreground">How can we help?</h2>
          <p className="text-sm text-muted-foreground mt-1">We're here to assist you with any questions</p>
        </div>

        <div className="space-y-3">
          {contactOptions.map((opt) => (
            <Card key={opt.title} className="border border-border cursor-pointer hover:border-primary/30 transition-colors" onClick={opt.action}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full ${opt.bg} flex items-center justify-center flex-shrink-0`}>
                  <opt.icon className={`h-5 w-5 ${opt.color}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-foreground">{opt.title}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                  <p className="text-xs font-medium text-foreground mt-0.5">{opt.detail}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-border mt-6">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">Business Hours</p>
              <p className="text-xs text-muted-foreground">Saturday - Thursday: 10:00 AM - 8:00 PM</p>
              <p className="text-xs text-muted-foreground">Friday: Closed</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;
