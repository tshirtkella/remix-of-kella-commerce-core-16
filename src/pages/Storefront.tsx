import { useOffers } from "@/hooks/useOffers";
import { TopBanner, SidebarCard, InlinePromo } from "@/components/storefront/OfferBanners";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreFooter from "@/components/storefront/StoreFooter";
import CategoryCarousel from "@/components/storefront/CategoryCarousel";
import HeroSlider from "@/components/storefront/HeroSlider";
import FlashSale from "@/components/storefront/FlashSale";
import CategoriesGrid from "@/components/storefront/CategoriesGrid";
import JustForYou from "@/components/storefront/JustForYou";
import CustomerReviews from "@/components/storefront/CustomerReviews";
import TrustBadges from "@/components/storefront/TrustBadges";

const Storefront = () => {
  const { data: topOffers = [] } = useOffers("top_banner");
  const { data: sidebarOffers = [] } = useOffers("sidebar");
  const { data: productPageOffers = [] } = useOffers("product_page");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {topOffers[0] && <TopBanner offer={topOffers[0]} />}
      <StoreHeader />
      <CategoryCarousel />

      <main>
        {/* Hero Slider */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <HeroSlider />
            </div>
            {sidebarOffers.length > 0 && (
              <aside className="hidden lg:flex flex-col gap-3 w-56 shrink-0">
                {sidebarOffers.slice(0, 2).map((offer) => (
                  <SidebarCard key={offer.id} offer={offer} />
                ))}
              </aside>
            )}
          </div>
        </section>

        {/* Trust Badges */}
        <TrustBadges />

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

        {/* Just For You */}
        <JustForYou />

        {/* Customer Reviews */}
        <CustomerReviews />
      </main>

      <StoreFooter />
    </div>
  );
};

export default Storefront;
