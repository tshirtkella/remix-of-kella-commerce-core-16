import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Megaphone, Eye, GripVertical } from "lucide-react";

const PLACEMENTS = [
  { value: "hero", label: "Hero Banner", desc: "Large banner at top of homepage" },
  { value: "top_banner", label: "Top Strip", desc: "Thin banner above header" },
  { value: "sidebar", label: "Sidebar", desc: "Side widget on product pages" },
  { value: "product_page", label: "Product Page", desc: "Banner on product listing" },
  { value: "checkout", label: "Checkout", desc: "Promo strip at checkout" },
  { value: "popup", label: "Popup", desc: "Overlay popup modal" },
];

const PRESET_COLORS = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6",
  "#EC4899", "#F97316", "#14B8A6", "#6366F1", "#1E293B",
];

interface Offer {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  discount_text: string;
  badge_label: string | null;
  bg_color: string | null;
  text_color: string | null;
  placement: string;
  cta_text: string | null;
  cta_link: string | null;
  is_active: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

const emptyForm = {
  title: "",
  subtitle: "",
  description: "",
  discount_text: "",
  badge_label: "SALE",
  bg_color: "#3B82F6",
  text_color: "#FFFFFF",
  placement: "hero",
  cta_text: "Shop Now",
  cta_link: "/products",
  is_active: true,
  priority: 0,
  starts_at: "",
  ends_at: "",
};

const Offers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [previewOffer, setPreviewOffer] = useState<Offer | null>(null);

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      return data as Offer[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: typeof form & { id?: string }) => {
      const record: any = {
        title: payload.title,
        subtitle: payload.subtitle || null,
        description: payload.description || null,
        discount_text: payload.discount_text,
        badge_label: payload.badge_label || "SALE",
        bg_color: payload.bg_color,
        text_color: payload.text_color,
        placement: payload.placement,
        cta_text: payload.cta_text || "Shop Now",
        cta_link: payload.cta_link || "/products",
        is_active: payload.is_active,
        priority: payload.priority,
        starts_at: payload.starts_at || null,
        ends_at: payload.ends_at || null,
      };
      if (payload.id) {
        const { error } = await supabase.from("offers").update(record).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("offers").insert(record);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast({ title: editingId ? "Offer updated" : "Offer created" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast({ title: "Offer deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("offers").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["offers"] }),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openEdit = (offer: Offer) => {
    setEditingId(offer.id);
    setForm({
      title: offer.title,
      subtitle: offer.subtitle || "",
      description: offer.description || "",
      discount_text: offer.discount_text,
      badge_label: offer.badge_label || "SALE",
      bg_color: offer.bg_color || "#3B82F6",
      text_color: offer.text_color || "#FFFFFF",
      placement: offer.placement,
      cta_text: offer.cta_text || "Shop Now",
      cta_link: offer.cta_link || "/products",
      is_active: offer.is_active,
      priority: offer.priority,
      starts_at: offer.starts_at ? offer.starts_at.slice(0, 16) : "",
      ends_at: offer.ends_at ? offer.ends_at.slice(0, 16) : "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.discount_text) {
      toast({ title: "Title and discount text are required", variant: "destructive" });
      return;
    }
    saveMutation.mutate(editingId ? { ...form, id: editingId } : form);
  };

  const placementLabel = (p: string) => PLACEMENTS.find((pl) => pl.value === p)?.label || p;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Offers & Promotions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create highlight banners that appear across your store
          </p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); }} className="gap-1">
          <Plus className="h-4 w-4" /> New Offer
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : !offers.length ? (
        <div className="flex flex-col items-center py-16">
          <Megaphone className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No offers yet. Create your first promotion!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <Card key={offer.id} className={`overflow-hidden transition-opacity ${!offer.is_active ? "opacity-50" : ""}`}>
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  {/* Color preview strip */}
                  <div className="w-2 shrink-0" style={{ backgroundColor: offer.bg_color || "#3B82F6" }} />
                  
                  {/* Live mini-preview */}
                  <div
                    className="w-48 shrink-0 flex flex-col items-center justify-center p-4 text-center"
                    style={{ backgroundColor: offer.bg_color || "#3B82F6", color: offer.text_color || "#FFF" }}
                  >
                    {offer.badge_label && (
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 rounded px-1.5 py-0.5 mb-1">
                        {offer.badge_label}
                      </span>
                    )}
                    <span className="font-bold text-sm leading-tight">{offer.discount_text}</span>
                    <span className="text-[10px] mt-0.5 opacity-80">{offer.title}</span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">{offer.title}</h3>
                        <Badge variant="outline" className="text-[10px] shrink-0">{placementLabel(offer.placement)}</Badge>
                        {!offer.is_active && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                      </div>
                      {offer.subtitle && <p className="text-xs text-muted-foreground truncate">{offer.subtitle}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>Priority: {offer.priority}</span>
                        {offer.ends_at && (
                          <span>Ends: {new Date(offer.ends_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={offer.is_active}
                        onCheckedChange={(v) => toggleMutation.mutate({ id: offer.id, is_active: v })}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewOffer(offer)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(offer)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(offer.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Offer" : "Create New Offer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Live preview */}
            <div
              className="rounded-lg p-6 text-center"
              style={{ backgroundColor: form.bg_color, color: form.text_color }}
            >
              {form.badge_label && (
                <span className="text-xs font-bold tracking-widest uppercase bg-white/20 rounded-full px-3 py-1">
                  {form.badge_label}
                </span>
              )}
              <p className="text-2xl font-bold mt-2">{form.discount_text || "DISCOUNT TEXT"}</p>
              <p className="text-lg font-medium mt-1">{form.title || "Offer Title"}</p>
              {form.subtitle && <p className="text-sm opacity-80 mt-1">{form.subtitle}</p>}
              {form.cta_text && (
                <button className="mt-3 px-4 py-1.5 rounded-full bg-white/20 text-sm font-medium hover:bg-white/30 transition">
                  {form.cta_text}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Summer Collection" />
              </div>
              <div className="space-y-2">
                <Label>Discount Text *</Label>
                <Input value={form.discount_text} onChange={(e) => setForm({ ...form, discount_text: e.target.value })} placeholder="UP TO 50% OFF" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Limited time only" />
              </div>
              <div className="space-y-2">
                <Label>Badge Label</Label>
                <Input value={form.badge_label} onChange={(e) => setForm({ ...form, badge_label: e.target.value })} placeholder="SALE" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Placement</Label>
                <Select value={form.placement} onValueChange={(v) => setForm({ ...form, placement: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLACEMENTS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label} — {p.desc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority (higher = shown first)</Label>
                <Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CTA Button Text</Label>
                <Input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>CTA Link</Label>
                <Input value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} />
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        className={`h-6 w-6 rounded-full border-2 transition ${form.bg_color === c ? "border-foreground scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setForm({ ...form, bg_color: c })}
                      />
                    ))}
                  </div>
                  <Input
                    type="color"
                    value={form.bg_color}
                    onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
                    className="w-10 h-8 p-0.5 cursor-pointer"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Text Color</Label>
                <div className="flex items-center gap-2">
                  <button
                    className={`h-6 w-6 rounded-full border-2 bg-white ${form.text_color === "#FFFFFF" ? "border-foreground" : "border-border"}`}
                    onClick={() => setForm({ ...form, text_color: "#FFFFFF" })}
                  />
                  <button
                    className={`h-6 w-6 rounded-full border-2 bg-black ${form.text_color === "#000000" ? "border-foreground" : "border-border"}`}
                    onClick={() => setForm({ ...form, text_color: "#000000" })}
                  />
                  <Input
                    type="color"
                    value={form.text_color}
                    onChange={(e) => setForm({ ...form, text_color: e.target.value })}
                    className="w-10 h-8 p-0.5 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Starts At (optional)</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Ends At (optional)</Label>
                <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={handleSubmit} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingId ? "Update Offer" : "Create Offer"}
              </Button>
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Preview Dialog */}
      <Dialog open={!!previewOffer} onOpenChange={(o) => !o && setPreviewOffer(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Preview: {previewOffer?.title}</DialogTitle>
          </DialogHeader>
          {previewOffer && (
            <div className="p-4 space-y-4">
              {/* Hero style */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Hero Banner</p>
                <div
                  className="rounded-xl p-8 text-center relative overflow-hidden"
                  style={{ backgroundColor: previewOffer.bg_color || "#3B82F6", color: previewOffer.text_color || "#FFF" }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
                  <div className="relative z-10">
                    {previewOffer.badge_label && (
                      <span className="text-xs font-bold tracking-widest uppercase bg-white/20 rounded-full px-4 py-1">
                        {previewOffer.badge_label}
                      </span>
                    )}
                    <p className="text-3xl font-bold mt-3">{previewOffer.discount_text}</p>
                    <p className="text-xl font-medium mt-1">{previewOffer.title}</p>
                    {previewOffer.subtitle && <p className="text-sm opacity-80 mt-1">{previewOffer.subtitle}</p>}
                    {previewOffer.cta_text && (
                      <button className="mt-4 px-6 py-2 rounded-full bg-white/20 font-medium hover:bg-white/30 transition">
                        {previewOffer.cta_text}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {/* Strip style */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Top Strip Banner</p>
                <div
                  className="rounded-lg py-2.5 px-4 flex items-center justify-center gap-3 text-sm"
                  style={{ backgroundColor: previewOffer.bg_color || "#3B82F6", color: previewOffer.text_color || "#FFF" }}
                >
                  {previewOffer.badge_label && (
                    <span className="text-[10px] font-bold bg-white/20 rounded px-2 py-0.5">{previewOffer.badge_label}</span>
                  )}
                  <span className="font-bold">{previewOffer.discount_text}</span>
                  <span className="opacity-80">—</span>
                  <span>{previewOffer.title}</span>
                  {previewOffer.cta_text && (
                    <span className="underline font-medium cursor-pointer ml-1">{previewOffer.cta_text} →</span>
                  )}
                </div>
              </div>
              {/* Card style */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Sidebar Card</p>
                <div
                  className="rounded-xl p-5 w-64"
                  style={{ backgroundColor: previewOffer.bg_color || "#3B82F6", color: previewOffer.text_color || "#FFF" }}
                >
                  {previewOffer.badge_label && (
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 rounded px-2 py-0.5">
                      {previewOffer.badge_label}
                    </span>
                  )}
                  <p className="text-xl font-bold mt-2">{previewOffer.discount_text}</p>
                  <p className="text-sm font-medium mt-1">{previewOffer.title}</p>
                  {previewOffer.subtitle && <p className="text-xs opacity-80 mt-1">{previewOffer.subtitle}</p>}
                  {previewOffer.cta_text && (
                    <button className="mt-3 text-xs font-medium underline">{previewOffer.cta_text} →</button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Offers;
