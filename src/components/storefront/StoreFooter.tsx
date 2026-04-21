import { Link } from "react-router-dom";
import { Shirt, Phone, Mail, MapPin } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";
import { usePageSection } from "@/hooks/usePageTemplates";

const StoreFooter = () => {
  const branding = useBranding();
  const content = usePageSection("footer", "content");

  return (
    <footer className="bg-foreground text-background mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-xs sm:text-sm">
          {/* Customer Care */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Customer Care</h4>
            <ul className="space-y-2.5 text-sm opacity-70">
              <li><Link to="/support" className="hover:opacity-100 transition">Help Center</Link></li>
              <li><Link to="/support" className="hover:opacity-100 transition">How to Buy</Link></li>
              <li><Link to="/refund-policy" className="hover:opacity-100 transition">Returns & Refunds</Link></li>
              <li><Link to="/support" className="hover:opacity-100 transition">Contact Us</Link></li>
              <li><Link to="/my-orders" className="hover:opacity-100 transition">Track Order</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm opacity-70">
              <li><Link to="/about-us" className="hover:opacity-100 transition">About Us</Link></li>
              <li><Link to="/terms" className="hover:opacity-100 transition">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:opacity-100 transition">Privacy Policy</Link></li>
              <li><Link to="/shipping-policy" className="hover:opacity-100 transition">Shipping Policy</Link></li>
              <li><Link to="/refund-policy" className="hover:opacity-100 transition">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Contact</h4>
            <ul className="space-y-3 text-sm opacity-70">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{content?.contact_phone || content?.phone || "+880 1XXX-XXXXXX"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span>{content?.contact_email || content?.email || "support@store.com"}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{content?.address || "Dhaka, Bangladesh"}</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Stay Updated</h4>
            <p className="text-sm opacity-60 mb-3">Get the latest offers and new arrivals.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-sm placeholder:text-white/40 border border-white/10 focus:outline-none focus:border-primary"
              />
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">
                Join
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {branding.logo_url ? (
                <img src={branding.logo_url} alt={branding.store_name} className="h-8 w-8 rounded-lg object-contain" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Shirt className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-primary">Happy Shopping</p>
                <p className="text-xs opacity-50">Download App</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 text-center text-sm opacity-40">
          © {new Date().getFullYear()} {branding.store_name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
