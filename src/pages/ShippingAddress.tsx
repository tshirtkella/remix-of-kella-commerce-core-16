import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Plus, MapPin, Loader2, Save, Trash2, Star, Edit2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Address {
  id: string;
  label: string;
  full_name: string | null;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  zip: string | null;
  country: string;
  is_default: boolean;
}

const emptyForm = {
  label: "Home",
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  zip: "",
  country: "Bangladesh",
};

const ShippingAddress = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [fetching, setFetching] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setFetching(true);
      const { data } = await supabase
        .from("shipping_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });
      if (data) setAddresses(data as Address[]);
      setFetching(false);
    };
    void fetch();
  }, [user?.id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (a: Address) => {
    setEditingId(a.id);
    setForm({
      label: a.label,
      full_name: a.full_name ?? "",
      phone: a.phone ?? "",
      address_line1: a.address_line1,
      address_line2: a.address_line2 ?? "",
      city: a.city,
      state: a.state ?? "",
      zip: a.zip ?? "",
      country: a.country,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.address_line1 || !form.city) {
      toast({ title: "Address and city are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      user_id: user.id,
      label: form.label || "Home",
      full_name: form.full_name || null,
      phone: form.phone || null,
      address_line1: form.address_line1,
      address_line2: form.address_line2 || null,
      city: form.city,
      state: form.state || null,
      zip: form.zip || null,
      country: form.country || "Bangladesh",
    };

    if (editingId) {
      const { error } = await supabase.from("shipping_addresses").update(payload).eq("id", editingId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else {
        setAddresses((prev) => prev.map((a) => a.id === editingId ? { ...a, ...payload } as Address : a));
        toast({ title: "Address updated" });
        setDialogOpen(false);
      }
    } else {
      const { data, error } = await supabase.from("shipping_addresses").insert(payload).select().single();
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
      else {
        setAddresses((prev) => [...prev, data as Address]);
        toast({ title: "Address added" });
        setDialogOpen(false);
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("shipping_addresses").delete().eq("id", id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "Address deleted" });
  };

  const handleSetDefault = async (id: string) => {
    // Unset all defaults first
    await supabase.from("shipping_addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("shipping_addresses").update({ is_default: true }).eq("id", id);
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
    toast({ title: "Default address set" });
  };

  const updateField = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/profile"><ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" /></Link>
            <h1 className="text-lg font-heading font-bold text-foreground">Shipping Addresses</h1>
          </div>
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add New
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {fetching ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <MapPin className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground">No addresses yet</p>
            <Button onClick={openNew} className="gap-1.5"><Plus className="h-4 w-4" /> Add Address</Button>
          </div>
        ) : (
          addresses.map((a) => (
            <Card key={a.id} className={`border ${a.is_default ? "border-primary/40 bg-primary/5" : "border-border"}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{a.label}</span>
                      {a.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    </div>
                    {a.full_name && <p className="text-sm text-foreground">{a.full_name}</p>}
                    <p className="text-sm text-muted-foreground">
                      {a.address_line1}{a.address_line2 ? `, ${a.address_line2}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {a.city}{a.state ? `, ${a.state}` : ""} {a.zip}
                    </p>
                    <p className="text-sm text-muted-foreground">{a.country}</p>
                    {a.phone && <p className="text-xs text-muted-foreground">📞 {a.phone}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    {!a.is_default && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSetDefault(a.id)} title="Set as default">
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? "Edit Address" : "Add New Address"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Label</Label>
                <Input value={form.label} onChange={(e) => updateField("label", e.target.value)} placeholder="Home / Office" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name</Label>
                <Input value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} placeholder="Recipient name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <Input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="Phone number" type="tel" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Address Line 1 *</Label>
              <Input value={form.address_line1} onChange={(e) => updateField("address_line1", e.target.value)} placeholder="Street address, house number" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Address Line 2</Label>
              <Input value={form.address_line2} onChange={(e) => updateField("address_line2", e.target.value)} placeholder="Apartment, suite, area (optional)" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">City *</Label>
                <Input value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="City" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">State / Division</Label>
                <Input value={form.state} onChange={(e) => updateField("state", e.target.value)} placeholder="State" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">ZIP / Postal Code</Label>
                <Input value={form.zip} onChange={(e) => updateField("zip", e.target.value)} placeholder="ZIP" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Country</Label>
                <Input value={form.country} onChange={(e) => updateField("country", e.target.value)} placeholder="Country" />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingId ? "Update Address" : "Save Address"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShippingAddress;
