import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X, ShieldCheck, User } from "lucide-react";
import { format as formatDate } from "date-fns";

interface CheckoutChatWidgetProps {
  sessionId: string;
}

const CheckoutChatWidget = ({ sessionId }: CheckoutChatWidgetProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [draftOrderId, setDraftOrderId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Find draft order for this session
  useEffect(() => {
    const findDraft = async () => {
      const { data } = await supabase
        .from("draft_orders")
        .select("id")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (data) setDraftOrderId(data.id);
    };
    findDraft();

    // Re-check periodically since draft may be created after component mounts
    const interval = setInterval(findDraft, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // Fetch and subscribe to messages
  useEffect(() => {
    if (!draftOrderId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("draft_order_messages")
        .select("*")
        .eq("draft_order_id", draftOrderId)
        .order("created_at", { ascending: true });
      if (data) {
        setMessages(data);
        if (!open) {
          setUnreadCount(data.filter((m: any) => m.sender === "admin" && !m.is_read).length);
        }
      }
    };
    fetchMessages();

    const channel = supabase
      .channel(`checkout-chat-${draftOrderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "draft_order_messages", filter: `draft_order_id=eq.${draftOrderId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          if (!open && payload.new.sender === "admin") {
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [draftOrderId, open]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setUnreadCount(0);
  }, [open]);

  const handleSend = async () => {
    if (!newMessage.trim() || !draftOrderId) return;
    setSending(true);
    try {
      await supabase.from("draft_order_messages").insert({
        draft_order_id: draftOrderId,
        session_id: sessionId,
        sender: "customer",
        message: newMessage.trim(),
      });
      setNewMessage("");
    } catch (e) {
      console.error("Failed to send:", e);
    }
    setSending(false);
  };

  // Don't show if no draft exists yet
  if (!draftOrderId) return null;

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 h-[28rem] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold text-sm">Live Support</p>
                <p className="text-[10px] opacity-80">We're here to help</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="opacity-70 hover:opacity-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-3 py-3">
            <div className="space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-6">
                  <p className="font-medium">Welcome! 👋</p>
                  <p className="text-xs mt-1">Need help with your order? Send us a message.</p>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "customer" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                      msg.sender === "customer"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      {msg.sender === "admin" ? (
                        <ShieldCheck className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      <span className="text-[10px] opacity-70 font-medium uppercase">
                        {msg.sender === "admin" ? "Support" : "You"}
                      </span>
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
          <div className="border-t border-border px-3 py-2.5 flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              className="flex-1 h-9 text-sm"
            />
            <Button size="icon" className="h-9 w-9" onClick={handleSend} disabled={sending || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default CheckoutChatWidget;
