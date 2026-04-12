import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle2, Loader2, ChevronDown, MessageSquare, Send, ImagePlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  productId: string;
  productName: string;
}

const StarRating = ({ rating, size = 16 }: { rating: number; size?: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        className={s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}
        style={{ width: size, height: size }}
      />
    ))}
  </div>
);

const StarSelect = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button key={s} type="button" onClick={() => onChange(s)} className="transition hover:scale-110">
        <Star
          className={`h-7 w-7 ${s <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-300"}`}
        />
      </button>
    ))}
  </div>
);

const ProductReviews = ({ productId, productName }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [filterStar, setFilterStar] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Upload images if any
      let imageUrls: string[] = [];
      if (reviewImages.length > 0) {
        setUploadingImages(true);
        for (const file of reviewImages) {
          const ext = file.name.split(".").pop();
          const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadError } = await supabase.storage.from("review-images").upload(path, file);
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from("review-images").getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        }
        setUploadingImages(false);
      }

      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
        reviewer_name: reviewerName.trim() || "Anonymous",
        images: imageUrls.length > 0 ? imageUrls : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
      toast({ title: "Review submitted!" });
      setShowForm(false);
      setComment("");
      setRating(5);
      setReviewerName("");
      setReviewImages([]);
      setImagePreviews([]);
    },
    onError: () => { setUploadingImages(false); toast({ title: "Failed to submit review", variant: "destructive" }); },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((f) => {
      if (!f.type.startsWith("image/")) { toast({ title: "Only images allowed", variant: "destructive" }); return false; }
      if (f.size > 5 * 1024 * 1024) { toast({ title: "Max 5MB per image", variant: "destructive" }); return false; }
      return true;
    });
    const total = reviewImages.length + validFiles.length;
    if (total > 5) { toast({ title: "Maximum 5 images", variant: "destructive" }); return; }
    setReviewImages((prev) => [...prev, ...validFiles]);
    validFiles.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Fetch all replies for visible reviews
  const { data: repliesData = [] } = useQuery({
    queryKey: ["review-replies", productId],
    queryFn: async () => {
      const ids = reviews.map((r) => r.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("review_replies")
        .select("*")
        .in("review_id", ids)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: reviews.length > 0,
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!user || !replyingTo) return;
      const { error } = await supabase.from("review_replies").insert({
        review_id: replyingTo,
        user_id: user.id,
        reply_text: replyText.trim(),
        reviewer_name: user.email?.split("@")[0] ?? "User",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-replies", productId] });
      toast({ title: "Reply posted!" });
      setReplyingTo(null);
      setReplyText("");
    },
    onError: () => toast({ title: "Failed to post reply", variant: "destructive" }),
  });

  // Stats
  const total = reviews.length;
  const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const filtered = filterStar ? reviews.filter((r) => r.rating === filterStar) : reviews;
  const visible = filtered.slice(0, visibleCount);

  return (
    <section className="border-t border-border mt-10 pt-8">
      <h2 className="text-lg font-heading font-bold text-foreground mb-6">
        Ratings & Reviews of {productName}
      </h2>

      <div className="grid md:grid-cols-[200px_1fr] gap-8 mb-8">
        {/* Summary */}
        <div className="text-center md:text-left">
          <p className="text-5xl font-bold text-foreground">{avg.toFixed(1)}<span className="text-lg text-muted-foreground font-normal">/5</span></p>
          <StarRating rating={Math.round(avg)} size={22} />
          <p className="text-sm text-muted-foreground mt-1">{total} Ratings</p>
        </div>

        {/* Breakdown bars */}
        <div className="space-y-1.5">
          {breakdown.map(({ star, count }) => {
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <button
                key={star}
                onClick={() => setFilterStar(filterStar === star ? null : star)}
                className={`flex items-center gap-2 w-full group transition rounded px-1 py-0.5 ${filterStar === star ? "bg-primary/10" : "hover:bg-muted/50"}`}
              >
                <StarRating rating={star} size={14} />
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & sort bar */}
      <div className="flex items-center justify-between border-t border-b border-border py-3 mb-4">
        <p className="text-sm font-medium text-foreground">Product Reviews</p>
        <div className="flex items-center gap-3">
          {filterStar && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setFilterStar(null)}>
              {filterStar} Star ✕
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">Filter: {filterStar ? `${filterStar} star` : "All star"}</span>
        </div>
      </div>

      {/* Reviews list */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-5">
          {visible.map((r) => {
            const reviewReplies = repliesData.filter((rep) => rep.review_id === r.id);
            return (
              <div key={r.id} className="border-b border-border pb-5">
                <div className="flex items-center justify-between mb-1">
                  <StarRating rating={r.rating} size={16} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground">{r.reviewer_name}</span>
                  {r.is_verified_purchase && (
                    <span className="flex items-center gap-0.5 text-xs text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> Verified Purchase
                    </span>
                  )}
                </div>
                {r.comment && <p className="text-sm text-foreground leading-relaxed">{r.comment}</p>}
                {r.images && (r.images as string[]).length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {(r.images as string[]).map((img, i) => (
                      <img key={i} src={img} alt="" className="w-16 h-16 rounded object-cover border border-border" />
                    ))}
                  </div>
                )}

                {/* Replies */}
                {reviewReplies.length > 0 && (
                  <div className="mt-3 space-y-2 pl-3 border-l-2 border-primary/20">
                    {reviewReplies.map((rep) => (
                      <div key={rep.id} className="bg-muted/30 rounded-lg p-2.5">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-medium text-foreground">{rep.reviewer_name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(rep.created_at).toLocaleDateString("en-US", { day: "2-digit", month: "short" })}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/80">{rep.reply_text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply button & form */}
                {replyingTo === r.id ? (
                  <div className="flex gap-2 mt-3">
                    <Input
                      placeholder="Write a reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="text-sm h-8"
                    />
                    <Button
                      size="sm"
                      className="h-8 px-3"
                      disabled={!replyText.trim() || replyMutation.isPending}
                      onClick={() => replyMutation.mutate()}
                    >
                      {replyMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8" onClick={() => { setReplyingTo(null); setReplyText(""); }}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!user) { toast({ title: "Please log in to reply", variant: "destructive" }); return; }
                      setReplyingTo(r.id);
                    }}
                    className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageSquare className="h-3 w-3" /> Reply
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > visibleCount && (
        <button
          onClick={() => setVisibleCount((v) => v + 10)}
          className="flex items-center gap-1 mx-auto mt-4 text-sm text-primary hover:underline"
        >
          Show More <ChevronDown className="h-4 w-4" />
        </button>
      )}

      {/* Write review */}
      <div className="mt-8">
        {!showForm ? (
          <Button variant="outline" onClick={() => {
            if (!user) { toast({ title: "Please log in to write a review", variant: "destructive" }); return; }
            setShowForm(true);
          }}>
            Write a Review
          </Button>
        ) : (
          <div className="border border-border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Your Review</h3>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Rating</p>
              <StarSelect value={rating} onChange={setRating} />
            </div>
            <Input
              placeholder="Your name (optional)"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="max-w-xs"
            />
            <Textarea
              placeholder="Share your experience with this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
            {/* Image Upload Section */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Add Photos (optional, max 5)</p>
              <div className="flex flex-wrap gap-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt="" className="w-16 h-16 rounded-lg object-cover border border-border" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {reviewImages.length < 5 && (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-[9px]">Add</span>
                  </button>
                )}
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || uploadingImages}>
                {(submitMutation.isPending || uploadingImages) ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {uploadingImages ? "Uploading..." : "Submit Review"}
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setReviewImages([]); setImagePreviews([]); }}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductReviews;
