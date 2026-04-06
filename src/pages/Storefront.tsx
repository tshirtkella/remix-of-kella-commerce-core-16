import { Truck, Shield, RotateCcw, Sparkles } from "lucide-react";
import { useOffers } from "@/hooks/useOffers";
import { TopBanner, SidebarCard, InlinePromo } from "@/components/storefront/OfferBanners";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreFooter from "@/components/storefront/StoreFooter";
import HeroSlider from "@/components/storefront/HeroSlider";
import FlashSale from "@/components/storefront/FlashSale";
import CategoriesGrid from "@/components/storefront/CategoriesGrid";
import JustForYou from "@/components/storefront/JustForYou";
import CustomerReviews from "@/components/storefront/CustomerReviews";

const FEATURES = [
  { icon: Truck, title: "Free Shipping", desc: "On orders over ৳2000" },
  { icon: Shield, title: "Secure Payment", desc: "100% protected" },
  { icon: RotateCcw, title: "Easy Returns", desc: "7-day return policy" },
  { icon: Sparkles, title: "Premium Quality", desc: "Handpicked fabrics" },
];

const Storefront = () => {
  const { data: topOffers = [] } = useOffers("top_banner");
  const { data: sidebarOffers = [] } = useOffers("sidebar");
  const { data: productPageOffers = [] } = useOffers("product_page");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {topOffers[0] && <TopBanner offer={topOffers[0]} />}
      <StoreHeader />

      <main>
        {/* Hero Slider */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <HeroSlider />
            </div>
            {/* Sidebar offers next to hero */}
            {sidebarOffers.length > 0 && (
              <aside className="hidden lg:flex flex-col gap-3 w-56 shrink-0">
                {sidebarOffers.slice(0, 2).map((offer) => (
                  <SidebarCard key={offer.id} offer={offer} />
                ))}
              </aside>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <f.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Flash Sale */}
        <FlashSale />

        {/* Inline Promo */}
        {productPageOffers[0] && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
            <InlinePromo offer={productPageOffers[0]} />
          </section>
        )}

        {/* Categories */}
        <CategoriesGrid />

        {/* Just For You + Load More */}
        <JustForYou />

        {/* Customer Reviews */}
        <CustomerReviews />
      </main>

      <StoreFooter />
    </div>
  );
};

export default Storefront;
