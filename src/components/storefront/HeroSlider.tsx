import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Truck, Ticket } from "lucide-react";
import { useOffers } from "@/hooks/useOffers";

const HeroSlider = () => {
  const { data: heroOffers = [] } = useOffers("hero");
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStart = useRef(0);

  const slides = heroOffers.length > 0
    ? heroOffers.map((o) => ({
        title: o.title,
        subtitle: o.subtitle || o.description || "",
        discount: o.discount_text,
        bg: o.bg_color || "#F59E0B",
        text: o.text_color || "#FFFFFF",
        cta: o.cta_text || "Shop Now",
        link: o.cta_link || "/shop",
        image: o.banner_image,
        badge: o.badge_label,
      }))
    : [
        {
          title: "Summer Sale",
          subtitle: "Fresh deals every day on top brands",
          discount: "UP TO 50% OFF",
          bg: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #FDE68A 100%)",
          text: "#FFFFFF",
          cta: "Shop Now",
          link: "/shop",
          image: null,
          badge: "🔥 HOT DEAL",
        },
        {
          title: "New Arrivals",
          subtitle: "Explore the latest collection",
          discount: "UP TO 30% OFF",
          bg: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%)",
          text: "#FFFFFF",
          cta: "Explore",
          link: "/shop",
          image: null,
          badge: "NEW",
        },
        {
          title: "Premium Quality",
          subtitle: "Handpicked fabrics & top-notch craftsmanship",
          discount: "FREE DELIVERY",
          bg: "linear-gradient(135deg, #10B981 0%, #34D399 50%, #6EE7B7 100%)",
          text: "#FFFFFF",
          cta: "Browse",
          link: "/shop",
          image: null,
          badge: "⭐ BEST SELLER",
        },
      ];

  const goTo = useCallback((idx: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(idx);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const next = useCallback(() => goTo((current + 1) % slides.length), [current, slides.length, goTo]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, slides.length, goTo]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next, slides.length]);

  const slide = slides[current];

  const bgStyle = slide.bg.includes("gradient")
    ? { background: slide.bg }
    : { backgroundColor: slide.bg };

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-lg group"
      onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const diff = touchStart.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
      }}
    >
      <div
        className="relative flex items-center min-h-[220px] sm:min-h-[280px] md:min-h-[360px] transition-all duration-500"
        style={bgStyle}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white/5 rounded-full" />
          <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-white/30 rounded-full animate-pulse" />
          <div className="absolute bottom-1/3 left-1/5 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse delay-300" />
        </div>

        {/* Content */}
        <div className="relative z-10 px-6 py-8 sm:px-10 md:px-14 md:py-12 max-w-lg">
          {slide.badge && (
            <span
              className="inline-block px-3 py-1 rounded-md text-xs font-bold mb-3 backdrop-blur-sm"
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                color: slide.text,
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              {slide.badge}
            </span>
          )}

          <h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-heading leading-tight drop-shadow-md"
            style={{ color: slide.text }}
          >
            {slide.title}
          </h2>

          {slide.subtitle && (
            <p
              className="text-sm sm:text-base md:text-lg mt-2 opacity-90 leading-relaxed"
              style={{ color: slide.text }}
            >
              {slide.subtitle}
            </p>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <div className="flex items-center gap-1.5 bg-teal-600/90 text-white text-xs font-bold px-3 py-1.5 rounded">
              <Truck className="h-3.5 w-3.5" />
              Free Delivery
            </div>
            <div className="flex items-center gap-1.5 bg-pink-600/90 text-white text-xs font-bold px-3 py-1.5 rounded">
              <Ticket className="h-3.5 w-3.5" />
              VOUCHER
            </div>
          </div>

          <div className="mt-5">
            <Link
              to={slide.link}
              className="inline-block px-7 py-2.5 rounded-full font-semibold text-sm shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
              style={{ backgroundColor: slide.text, color: slide.bg.includes("gradient") ? "#F59E0B" : slide.bg }}
            >
              {slide.cta} →
            </Link>
          </div>
        </div>

        {/* Discount circle */}
        {slide.discount && (
          <div className="hidden sm:flex absolute top-6 right-6 md:top-auto md:right-auto md:left-1/2 md:top-6 items-center justify-center">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-destructive text-destructive-foreground flex flex-col items-center justify-center shadow-xl animate-bounce-slow">
              <span className="text-[10px] md:text-xs font-medium leading-none">UP TO</span>
              <span className="text-xl md:text-2xl font-black leading-none">50%</span>
              <span className="text-[10px] md:text-xs font-bold leading-none">OFF</span>
            </div>
          </div>
        )}

        {/* Image */}
        {slide.image && (
          <div className="hidden md:block absolute right-0 top-0 bottom-0 w-1/2">
            <img src={slide.image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 h-2.5 bg-white shadow-md"
                  : "w-2.5 h-2.5 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-black/50 text-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-black/50 text-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
};

export default HeroSlider;
