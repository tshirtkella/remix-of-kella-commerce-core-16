import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  ArrowLeft, LogOut, Settings, Camera, Loader2, Save,
  Clock, CheckCircle2, Truck, PackageCheck, XCircle,
  MapPin, Headphones, Info, ChevronRight, User, Phone, Edit2,
  ShoppingBag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface OrderCounts {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

const Profile = () => {
  const { user, loading, isAdmin, isModerator, isStaff, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile>({ first_name: null, last_name: null, phone: null, avatar_url: null });
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [orderCounts, setOrderCounts] = useState<OrderCounts>({ pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setProfileLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setFirstName(data.first_name ?? "");
        setLastName(data.last_name ?? "");
        setPhone(data.phone ?? "");
      }
      setProfileLoading(false);
    };

    const fetchOrderCounts = async () => {
      const { data } = await supabase.from("orders").select("status");
      if (data) {
        const counts: OrderCounts = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
        data.forEach((o) => {
          const s = o.status as string;
          if (s in counts) counts[s as keyof OrderCounts]++;
        });
        setOrderCounts(counts);
      }
    };

    void fetchProfile();
    void fetchOrderCounts();
  }, [user?.id]);

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const email = user.email ?? "";
  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || email;
  const initials = profile.first_name
    ? (profile.first_name[0] + (profile.last_name?.[0] ?? "")).toUpperCase()
    : email.slice(0, 2).toUpperCase();
  const roleBadge = isAdmin ? "Admin" : isModerator ? "Moderator" : "Customer";

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, first_name: firstName || null, last_name: lastName || null, phone: phone || null });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProfile((p) => ({ ...p, first_name: firstName || null, last_name: lastName || null, phone: phone || null }));
      toast({ title: "Profile updated" });
      setEditOpen(false);
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast({ title: "Invalid file", variant: "destructive" }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: "Max 5MB", variant: "destructive" }); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });

    if (uploadError) { toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" }); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").upsert({ id: user.id, avatar_url: avatarUrl });
    setProfile((p) => ({ ...p, avatar_url: avatarUrl }));
    toast({ title: "Avatar updated" });
    setUploading(false);
  };

  const orderStatuses = [
    { label: "Pending", count: orderCounts.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Processing", count: orderCounts.processing, icon: PackageCheck, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Shipped", count: orderCounts.shipped, icon: Truck, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Delivered", count: orderCounts.delivered, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Cancelled", count: orderCounts.cancelled, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
  ];

  const menuItems = [
    { label: "Edit Profile", icon: Edit2, onClick: () => setEditOpen(true) },
    { label: "Shipping Address", icon: MapPin, onClick: () => navigate("/shipping-address") },
    { label: "Support", icon: Headphones, onClick: () => navigate("/support") },
    { label: "About Us", icon: Info, onClick: () => navigate("/about-us") },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-blue-600 pb-8 pt-6 px-4">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/5" />

        <div className="relative max-w-2xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link to="/settings" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <Settings className="h-5 w-5" />
            </Link>
          </div>

          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-18 w-18 border-3 border-white/30 shadow-lg" style={{ height: 72, width: 72 }}>
                <AvatarImage src={profile.avatar_url ?? undefined} alt={displayName} />
                <AvatarFallback className="bg-white/20 text-primary-foreground font-bold text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-primary-foreground">{displayName}</h1>
              <Badge className="mt-1 bg-white/20 text-primary-foreground border-white/30 text-xs">
                {roleBadge}
              </Badge>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-around mt-6 bg-white/10 rounded-xl py-3 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-lg font-bold text-primary-foreground">
                {orderCounts.pending + orderCounts.processing + orderCounts.shipped + orderCounts.delivered + orderCounts.cancelled}
              </p>
              <p className="text-xs text-primary-foreground/70">Orders</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-lg font-bold text-primary-foreground">{orderCounts.delivered}</p>
              <p className="text-xs text-primary-foreground/70">Delivered</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-lg font-bold text-primary-foreground">{orderCounts.pending}</p>
              <p className="text-xs text-primary-foreground/70">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 -mt-2 pb-8 space-y-4">

        {/* My Orders */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" /> My Orders
            </h2>
            <Link to="/my-orders" className="text-xs text-primary hover:underline font-medium">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {orderStatuses.map((s) => (
              <button
                key={s.label}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-muted/50 transition-colors"
                onClick={() => navigate("/my-orders")}
              >
                <div className={`h-10 w-10 rounded-full ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <span className="text-xs font-medium text-foreground">{s.count}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <h2 className="font-heading font-semibold text-foreground mb-4">Services</h2>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="destructive"
          className="w-full h-12 rounded-xl text-sm font-semibold"
          onClick={() => void signOut()}
        >
          <LogOut className="h-4 w-4 mr-2" /> Log Out
        </Button>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" type="tel" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} disabled className="bg-muted/50" />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
