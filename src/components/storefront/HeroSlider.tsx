import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useOffers } from "@/hooks/useOffers";

const HeroSlider = () => {
  const { data: heroOffers = [] } = useOffers("hero");
  const [current, setCurrent] = useState(0);

  const slides = heroOffers.length > 0
    ? heroOffers.map((o) => ({
        title: o.title,
        subtitle: o.subtitle || o.description || "",
        discount: o.discount_text,
        bg: o.bg_color || "#3B82F6",
        text: o.text_color || "#FFFFFF",
        cta: o.cta_text || "Shop Now",
        link: o.cta_link || "/shop",
        image: o.banner_image,
        badge: o.badge_label,
      }))
    : [
        {
          title: "Wear Your Style",
          subtitle: "Premium t-shirts & apparel for every occasion",
          discount: "UP TO 50% OFF",
          bg: "hsl(var(--primary))",
          text: "#FFFFFF",
          cta: "Shop Now",
          link: "/shop",
          image: null,
          badge: "NEW",
        },
      ];

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next, slides.length]);

  const slide = slides[current];

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ backgroundColor: slide.bg }}>
      <div className="relative flex items-center min-h-[260px] md:min-h-[360px]">
        {/* Content */}
        <div className="relative z-10 px-8 py-10 md:px-16 md:py-14 max-w-lg">
          {slide.badge && (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 bg-white/20" style={{ color: slide.text }}>
              {slide.badge}
            </span>
          )}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading leading-tight" style={{ color: slide.text }}>
            {slide.title}
          </h2>
          {slide.subtitle && (
            <p className="text-base md:text-lg mt-2 opacity-80" style={{ color: slide.text }}>
              {slide.subtitle}
            </p>
          )}
          {slide.discount && (
            <div className="mt-4 inline-flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-full text-sm md:text-base font-bold">
              {slide.discount}
            </div>
          )}
          <div className="mt-6">
            <Link
              to={slide.link}
              className="inline-block px-8 py-3 rounded-full font-semibold text-sm transition hover:opacity-90"
              style={{ backgroundColor: slide.text, color: slide.bg }}
            >
              {slide.cta}
            </Link>
          </div>
        </div>

        {/* Image */}
        {slide.image && (
          <div className="hidden md:block absolute right-0 top-0 bottom-0 w-1/2">
            <img src={slide.image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? "bg-white scale-125" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition">
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
};

export default HeroSlider;
