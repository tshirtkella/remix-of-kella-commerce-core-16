import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LogOut, Shield, Mail, Calendar, Camera, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

const Profile = () => {
  const { user, loading, isAdmin, isModerator, isStaff, signOut } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile>({ first_name: null, last_name: null, phone: null, avatar_url: null });
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
        setFirstName(data.first_name ?? "");
        setLastName(data.last_name ?? "");
        setPhone(data.phone ?? "");
      }
      setProfileLoading(false);
    };

    void fetchProfile();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const email = user.email ?? "No email";
  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || email;
  const initials = profile.first_name
    ? (profile.first_name[0] + (profile.last_name?.[0] ?? "")).toUpperCase()
    : email.slice(0, 2).toUpperCase();
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "Unknown";

  const roleBadge = isAdmin ? "Admin" : isModerator ? "Moderator" : "Customer";
  const roleBadgeVariant = isAdmin ? "destructive" : isModerator ? "secondary" : "outline";

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
      });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProfile((p) => ({ ...p, first_name: firstName || null, last_name: lastName || null, phone: phone || null }));
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, avatar_url: avatarUrl });

    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
    } else {
      setProfile((p) => ({ ...p, avatar_url: avatarUrl }));
      toast({ title: "Avatar updated" });
    }
    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to store
        </Link>

        {/* Profile Header Card */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4 pb-4">
            <div className="relative group">
              <Avatar className="h-20 w-20 text-lg">
                <AvatarImage src={profile.avatar_url ?? undefined} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1 space-y-1">
              <CardTitle className="text-xl font-heading">{displayName}</CardTitle>
              <Badge variant={roleBadgeVariant as any}>{roleBadge}</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Info row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="text-foreground font-medium">{email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Member since</p>
                  <p className="text-foreground font-medium">{createdAt}</p>
                </div>
              </div>
            </div>

            {/* Editable fields */}
            {profileLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4 border-t border-border pt-6">
                <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    type="tel"
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-border pt-4 flex flex-wrap gap-3">
              {isStaff && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Shield className="h-4 w-4" /> Admin Panel
                  </Button>
                </Link>
              )}
              <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => void signOut()}>
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
