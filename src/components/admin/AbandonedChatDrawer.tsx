import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, ShieldCheck, Phone, Mail, MapPin, ShoppingBag, Clock, CreditCard, MessageCircle } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { formatDistanceToNow, format as formatDate } from "date-fns";

interface AbandonedChatDrawerProps {
  draft: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AbandonedChatDrawer = ({ draft, open, onOpenChange }: AbandonedChatDrawerProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { format } = useCurrency();
  const queryClient = useQueryClient();

  // Fetch messages
  useEffect(() => {
    if (!draft?.id || !open) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("draft_order_messages")
        .select("*")
        .eq("draft_order_id", draft.id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${draft.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "draft_order_messages", filter: `draft_order_id=eq.${draft.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [draft?.id, open]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !draft) return;
    setSending(true);
    try {
      await supabase.from("draft_order_messages").insert({
        draft_order_id: draft.id,
        session_id: draft.session_id,
        sender: "admin",
        message: newMessage.trim(),
      });
      setNewMessage("");
    } catch (e) {
      console.error("Failed to send message:", e);
    }
    setSending(false);
  };

  if (!draft) return null;

  const name = [draft.first_name, draft.last_name].filter(Boolean).join(" ") || "Anonymous";
  const getTimeAgo = (date: string) => {
    try { return formatDistanceToNow(new Date(date), { addSuffix: true }); } catch { return "—"; }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-5 w-5 text-primary" />
            Chat — {name}
          </SheetTitle>
        </SheetHeader>

        {/* Customer Info Panel */}
        <div className="px-4 py-3 border-b border-border bg-muted/30 space-y-2.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Customer Details</span>
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {getTimeAgo(draft.updated_at)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium text-foreground">{name}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium text-foreground">{draft.phone || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-foreground break-all">{draft.email || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Payment</p>
                <p className="font-medium text-foreground capitalize">{draft.payment_method || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 col-span-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="font-medium text-foreground">
                  {[draft.address_line1, draft.address_line2, draft.city, draft.state, draft.zip, draft.country].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Cart Items */}
          {Array.isArray(draft.cart_items) && draft.cart_items.length > 0 && (
            <div className="pt-1">
              <div className="flex items-center gap-1.5 mb-1.5">
                <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Cart ({draft.cart_items.length} item{draft.cart_items.length > 1 ? "s" : ""}) — {Number(draft.total) > 0 ? format(Number(draft.total)) : "—"}
                </span>
              </div>
              <div className="space-y-1">
                {draft.cart_items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-background">
                    <span>
                      <span className="font-medium">{item.name}</span>
                      {item.color && item.size && <span className="text-muted-foreground"> ({item.color}/{item.size})</span>}
                      <span className="text-muted-foreground"> × {item.quantity}</span>
                    </span>
                    <span className="font-medium">{format(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {draft.notes && (
            <div className="text-xs">
              <span className="text-muted-foreground">Note: </span>
              <span className="text-foreground">{draft.notes}</span>
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <ScrollArea className="flex-1 px-4 py-3">
          <div className="space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>No messages yet</p>
                <p className="text-xs">Send a message to reach this customer</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    msg.sender === "admin"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {msg.sender === "admin" ? (
                      <ShieldCheck className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    <span className="text-[10px] opacity-70 font-medium uppercase">{msg.sender}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                  <p className="text-[10px] opacity-60 mt-1">
                    {formatDate(new Date(msg.created_at), "hh:mm a")}
                  </p>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border px-4 py-3 flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AbandonedChatDrawer;
