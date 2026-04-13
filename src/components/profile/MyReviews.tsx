import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Edit2, Loader2, MessageSquare, ChevronDown, ChevronUp, Bell, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  userId: string;
}

const EDIT_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`h-4 w-4 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
    ))}
  </div>
);

const canEdit = (createdAt: string) => {
  return Date.now() - new Date(createdAt).getTime() < EDIT_WINDOW_MS;
};

const timeLeftLabel = (createdAt: string) => {
  const ms = EDIT_WINDOW_MS - (Date.now() - new Date(createdAt).getTime());
  if (ms <= 0) return null;
  const mins = Math.ceil(ms / 60000);
  return `${mins}m left to edit`;
};

const MyReviews = ({ userId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [unreadReplies, setUnreadReplies] = useState<Set<string>>(new Set());
  const [, setTick] = useState(0);

  // Re-render every minute to update time-left labels
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["my-reviews", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*, products:product_id(name, slug)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: allReplies = [] } = useQuery({
    queryKey: ["my-review-replies", userId],
    queryFn: async () => {
      if (reviews.length === 0) return [];
      const ids = reviews.map((r) => r.id);
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

  useEffect(() => {
    if (reviews.length === 0) return;
    const ids = reviews.map((r) => r.id);

    const channel = supabase
      .channel("my-review-replies-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "review_replies" }, (payload) => {
        const newReply = payload.new as any;
        if (ids.includes(newReply.review_id) && newReply.user_id !== userId) {
          setUnreadReplies((prev) => new Set(prev).add(newReply.review_id));
          toast({ title: "New reply on your review!", description: newReply.reply_text.slice(0, 60) });
          queryClient.invalidateQueries({ queryKey: ["my-review-replies", userId] });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [reviews.length, userId]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, comment, rating }: { id: string; comment: string; rating: number }) => {
      const { error } = await supabase.from("product_reviews").update({ comment, rating }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reviews", userId] });
      toast({ title: "Review updated" });
      setEditingId(null);
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-6">
        <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => {
        const replies = allReplies.filter((rep) => rep.review_id === r.id);
        const product = r.products as any;
        const isEditing = editingId === r.id;
        const isExpanded = expandedId === r.id;
        const hasUnread = unreadReplies.has(r.id);
        const editable = canEdit(r.created_at);
        const timeLeft = timeLeftLabel(r.created_at);

        return (
          <div key={r.id} className="border border-border rounded-xl p-4 space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{product?.name ?? "Unknown Product"}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {editable ? (
                  <button
                    onClick={() => {
                      setEditingId(r.id);
                      setEditComment(r.comment ?? "");
                      setEditRating(r.rating);
                    }}
                    className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                    title={timeLeft ?? "Edit review"}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <span className="p-1.5 text-muted-foreground/40" title="Edit window expired">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            </div>

            {/* Time left badge */}
            {editable && timeLeft && (
              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{timeLeft}</span>
            )}

            {/* Rating & Comment */}
            {isEditing && editable ? (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setEditRating(s)}>
                      <Star className={`h-5 w-5 ${s <= editRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                    </button>
                  ))}
                </div>
                <Textarea value={editComment} onChange={(e) => setEditComment(e.target.value)} rows={3} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateMutation.mutate({ id: r.id, comment: editComment, rating: editRating })} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null} Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <StarRating rating={r.rating} />
                {r.comment && <p className="text-sm text-foreground/80">{r.comment}</p>}
              </>
            )}

            {/* Replies toggle */}
            {replies.length > 0 && (
              <button
                onClick={() => {
                  setExpandedId(isExpanded ? null : r.id);
                  if (hasUnread) setUnreadReplies((prev) => { const n = new Set(prev); n.delete(r.id); return n; });
                }}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {replies.length} {replies.length === 1 ? "reply" : "replies"}
                {hasUnread && <Bell className="h-3 w-3 text-destructive animate-pulse" />}
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}

            {isExpanded && (
              <div className="space-y-2 pl-3 border-l-2 border-primary/20 mt-2">
                {replies.map((rep) => (
                  <div key={rep.id} className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{rep.reviewer_name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(rep.created_at).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80">{rep.reply_text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MyReviews;
