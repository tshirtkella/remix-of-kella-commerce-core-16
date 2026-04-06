import { Star, Quote } from "lucide-react";

const REVIEWS = [
  {
    name: "Rahim K.",
    rating: 5,
    text: "Amazing quality t-shirts! The fabric is super soft and the print is very durable. Will definitely order again.",
    date: "2 days ago",
  },
  {
    name: "Fatima A.",
    rating: 5,
    text: "Fast delivery and excellent customer support. The colors are exactly as shown in the pictures.",
    date: "1 week ago",
  },
  {
    name: "Kamal H.",
    rating: 4,
    text: "Great value for money. The sizing guide was very helpful. Highly recommended for casual wear.",
    date: "2 weeks ago",
  },
  {
    name: "Nusrat J.",
    rating: 5,
    text: "Best online store for t-shirts in Bangladesh. Premium quality at affordable prices. Love it!",
    date: "3 weeks ago",
  },
];

const CustomerReviews = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-heading">What Our Customers Say</h2>
        <p className="text-muted-foreground text-sm mt-1">Trusted by thousands of happy shoppers</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {REVIEWS.map((r, i) => (
          <div
            key={i}
            className="p-5 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
          >
            <Quote className="h-6 w-6 text-primary/30 mb-3" />
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{r.text}</p>
            <div className="flex items-center gap-0.5 mt-3">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star
                  key={s}
                  className={`h-3.5 w-3.5 ${s < r.rating ? "text-warning fill-warning" : "text-muted"}`}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-semibold">{r.name}</span>
              <span className="text-xs text-muted-foreground">{r.date}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CustomerReviews;
