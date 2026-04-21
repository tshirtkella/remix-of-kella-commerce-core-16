import { useState } from "react";
import { Share2, Copy, Check, Mail, Facebook, Twitter, Linkedin, Send, MessageCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/hooks/useBranding";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  variant?: "full" | "icon" | "ghost-icon";
  className?: string;
  productId?: string;
  productSlug?: string;
  productName?: string;
}

const openShareWindow = (shareUrl: string) => {
  window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=600");
};

const ShareButton = ({
  url,
  title,
  description,
  variant = "full",
  className,
  productId,
  productSlug,
  productName,
}: ShareButtonProps) => {
  const { toast } = useToast();
  const { store_name } = useBranding();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const pitch = `Check out this ${title} on ${store_name}!`;
  const shareText = description ? `${pitch} — ${description}` : pitch;

  const trackShare = (network: string, action: "click" | "copy" | "native") => {
    // Fire-and-forget; never block the user flow
    supabase
      .from("share_events")
      .insert({
        product_id: productId ?? null,
        product_slug: productSlug ?? null,
        product_name: productName ?? title,
        network,
        action,
        url,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        user_id: user?.id ?? null,
      })
      .then(() => {});
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title, text: pitch, url });
        trackShare("native", "native");
        return;
      } catch {
        // User cancelled or failed — fall through to popover
      }
    }
    setOpen(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackShare("copy_link", "copy");
      toast({ title: "Link copied!", description: "Share it anywhere you like." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy link", variant: "destructive" });
    }
  };

  const networks = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "text-[#1877F2]",
      bg: "hover:bg-[#1877F2]/10",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(pitch)}`,
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "text-[#25D366]",
      bg: "hover:bg-[#25D366]/10",
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`,
    },
    {
      name: "Messenger",
      icon: Send,
      color: "text-[#0084FF]",
      bg: "hover:bg-[#0084FF]/10",
      url: `fb-messenger://share?link=${encodeURIComponent(url)}`,
      webFallback: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: "X",
      icon: Twitter,
      color: "text-foreground",
      bg: "hover:bg-foreground/10",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(pitch)}`,
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "text-[#0A66C2]",
      bg: "hover:bg-[#0A66C2]/10",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      name: "Telegram",
      icon: Send,
      color: "text-[#229ED9]",
      bg: "hover:bg-[#229ED9]/10",
      url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(pitch)}`,
    },
    {
      name: "Email",
      icon: Mail,
      color: "text-muted-foreground",
      bg: "hover:bg-muted",
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${url}`)}`,
    },
  ];

  const handleNetworkClick = (e: React.MouseEvent, net: typeof networks[number]) => {
    e.preventDefault();
    e.stopPropagation();
    if (net.name === "Messenger" && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      window.location.href = net.url;
      setTimeout(() => {
        if (net.webFallback) window.open(net.webFallback, "_blank", "noopener,noreferrer");
      }, 800);
    } else if (net.name === "Email") {
      window.location.href = net.url;
    } else {
      openShareWindow(net.webFallback ?? net.url);
    }
    setOpen(false);
  };

  const trigger =
    variant === "full" ? (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
        className={cn("gap-2", className)}
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    ) : variant === "ghost-icon" ? (
      <button
        type="button"
        onClick={handleNativeShare}
        aria-label="Share product"
        className={cn(
          "text-muted-foreground hover:text-foreground transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded p-1",
          className,
        )}
      >
        <Share2 className="h-4 w-4" />
      </button>
    ) : (
      <button
        type="button"
        onClick={handleNativeShare}
        aria-label="Share product"
        title="Share"
        className={cn(
          "h-8 w-8 rounded-full bg-card text-foreground border border-border flex items-center justify-center shadow-md hover:scale-110 transition",
          className,
        )}
      >
        <Share2 className="h-3.5 w-3.5" />
      </button>
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold">Share this product</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{pitch}</p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {networks.map((net) => {
              const Icon = net.icon;
              return (
                <button
                  key={net.name}
                  type="button"
                  onClick={(e) => handleNetworkClick(e, net)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2 rounded-lg border border-border transition",
                    net.bg,
                  )}
                  title={`Share on ${net.name}`}
                >
                  <Icon className={cn("h-5 w-5", net.color)} />
                  <span className="text-[10px] text-muted-foreground">{net.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <div className="flex-1 min-w-0 rounded-md border border-border bg-muted/30 px-2.5 py-2">
              <p className="text-[11px] text-muted-foreground truncate font-mono">{url}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant={copied ? "secondary" : "default"}
              onClick={handleCopy}
              className="shrink-0 gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ShareButton;
