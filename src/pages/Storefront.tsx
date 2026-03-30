import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Truck, Shield, RotateCcw } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useOffers } from "@/hooks/useOffers";
import { TopBanner, HeroBanner, SidebarCard, InlinePromo } from "@/components/storefront/OfferBanners";
import StoreHeader from "@/components/storefront/StoreHeader";
import StoreFooter from "@/components/storefront/StoreFooter";

const Storefront = () => {
  const { format } = useCurrency();

  const { data: topOffers = [] } = useOffers("top_banner");
  const { data: heroOffers = [] } = useOffers("hero");
  const { data: sidebarOffers = [] } = useOffers("sidebar");
  const { data: productPageOffers = [] } = useOffers("product_page");

  const { data: categories = [] } = useQuery({
    queryKey: ["store-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["store-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), variants(price_override, inventory_quantity), images(url, alt_text, position)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const FEATURES = [
    { icon: Truck, title: "Free Shipping", desc: "On orders over ৳2000" },
    { icon: Shield, title: "Secure Payment", desc: "100% protected" },
    { icon: RotateCcw, title: "Easy Returns", desc: "7-day return policy" },
    { icon: Sparkles, title: "Premium Quality", desc: "Handpicked fabrics" },
  ];

  const categoryColors = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Banner Offer */}
      {topOffers[0] && <TopBanner offer={topOffers[0]} />}

      <StoreHeader />

      <main>
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {heroOffers[0] ? (
            <HeroBanner offer={heroOffers[0]} />
          ) : (
            <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-8 py-14 md:px-16 md:py-20 text-center">
              <h1 className="text-4xl md:text-5xl font-bold font-heading">Wear Your Style</h1>
              <p className="text-lg mt-3 opacity-80 max-w-md mx-auto">Premium t-shirts & apparel for every occasion</p>
              <Link
                to="/shop"
                className="inline-block mt-6 px-8 py-3 rounded-full bg-white/20 font-semibold hover:bg-white/30 transition"
              >
                Shop Now
              </Link>
            </div>
          )}
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-heading">Shop by Category</h2>
            <Link to="/categories" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.slice(0, 5).map((cat, i) => (
              <Link
                key={cat.id}
                to={`/shop?category=${cat.slug}`}
                className="group relative rounded-xl overflow-hidden aspect-square flex items-end p-4"
                style={{ backgroundColor: categoryColors[i % categoryColors.length] + "18" }}
              >
                {(cat as any).image_url ? (
                  <img src={(cat as any).image_url} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div
                    className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                    style={{ backgroundColor: categoryColors[i % categoryColors.length] }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="relative z-10">
                  <p className="font-semibold text-sm text-white">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-white/70 mt-0.5 line-clamp-1">{cat.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Products + Sidebar Offers */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold font-heading">Latest Products</h2>
            <Link to="/shop" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex gap-6">
            {/* Product Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => {
                  const minPrice = product.variants?.length
                    ? Math.min(
                        ...product.variants.map((v: any) => v.price_override ?? product.base_price)
                      )
                    : product.base_price;
                  const totalStock = product.variants?.reduce((s: number, v: any) => s + v.inventory_quantity, 0) ?? 0;

                  return (
                    <Link
                      key={product.id}
                      to={`/product/${product.slug}`}
                      className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5"
                    >
                      {/* Placeholder image */}
                      <div className="aspect-square bg-muted/50 flex items-center justify-center relative overflow-hidden">
                        {product.images?.[0]?.url ? (
                          <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <span className="text-4xl opacity-20">👕</span>
                        )}
                        {totalStock === 0 && (
                          <span className="absolute top-2 left-2 text-[10px] font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded">
                            SOLD OUT
                          </span>
                        )}
                        {totalStock > 0 && totalStock < 5 && (
                          <span className="absolute top-2 left-2 text-[10px] font-bold bg-warning text-warning-foreground px-2 py-0.5 rounded">
                            LOW STOCK
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-muted-foreground">
                          {(product as any).categories?.name || "Uncategorized"}
                        </p>
                        <h3 className="font-semibold text-sm mt-0.5 group-hover:text-primary transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="font-bold text-base mt-1">{format(Number(minPrice))}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Offers */}
            {sidebarOffers.length > 0 && (
              <aside className="hidden lg:flex flex-col gap-4 w-64 shrink-0">
                {sidebarOffers.map((offer) => (
                  <SidebarCard key={offer.id} offer={offer} />
                ))}
              </aside>
            )}
          </div>
        </section>

        {/* Inline Product Page Promo */}
        {productPageOffers[0] && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <InlinePromo offer={productPageOffers[0]} />
          </section>
        )}

        {/* Second Hero offer if exists */}
        {heroOffers[1] && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <HeroBanner offer={heroOffers[1]} />
          </section>
        )}
      </main>

      <StoreFooter />
    </div>
  );
};

export default Storefront;
