import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, ChevronRight, User, MapPin, Globe, DollarSign, Languages,
  Bell, ShieldCheck, LogOut, Loader2, Save, Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UserSettings = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Account settings
  const [accountOpen, setAccountOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Password
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  // Preferences (local state)
  const [country, setCountry] = useState("Bangladesh");
  const [currency, setCurrency] = useState("BDT");
  const [language, setLanguage] = useState("English");

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);

  // Privacy
  const [privacyOpen, setPrivacyOpen] = useState(false);

  // Selector dialogs
  const [countryOpen, setCountryOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setFirstName(data.first_name ?? "");
        setLastName(data.last_name ?? "");
        setPhone(data.phone ?? "");
      }
    };
    void fetch();
  }, [user?.id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const handleSaveAccount = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name: firstName || null,
      last_name: lastName || null,
      phone: phone || null,
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Account updated" }); setAccountOpen(false); }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return; }
    if (newPassword !== confirmPassword) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Password changed successfully" }); setPasswordOpen(false); setNewPassword(""); setConfirmPassword(""); }
    setChangingPw(false);
  };

  const menuSections = [
    {
      items: [
        { label: "Account Settings", icon: User, value: "", onClick: () => setAccountOpen(true) },
        { label: "Address Book", icon: MapPin, value: "", onClick: () => navigate("/shipping-address") },
        { label: "Change Password", icon: Lock, value: "", onClick: () => setPasswordOpen(true) },
      ],
    },
    {
      items: [
        { label: "Country", icon: Globe, value: country, onClick: () => setCountryOpen(true) },
        { label: "Currency", icon: DollarSign, value: currency, onClick: () => setCurrencyOpen(true) },
        { label: "Language", icon: Languages, value: language, onClick: () => setLanguageOpen(true) },
      ],
    },
    {
      items: [
        { label: "Notification Settings", icon: Bell, value: "", onClick: () => setNotifOpen(true) },
        { label: "Privacy Policy", icon: ShieldCheck, value: "", onClick: () => setPrivacyOpen(true) },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/profile"><ArrowLeft className="h-5 w-5 text-muted-foreground hover:text-foreground" /></Link>
          <h1 className="text-lg font-heading font-bold text-foreground flex-1 text-center pr-5">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-2">
        {menuSections.map((section, si) => (
          <div key={si} className="bg-card rounded-2xl border border-border overflow-hidden">
            {section.items.map((item, i) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors ${
                  i < section.items.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.value && <span className="text-sm text-muted-foreground">{item.value}</span>}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        ))}

        <div className="pt-4">
          <Button
            variant="destructive"
            className="w-full h-12 rounded-xl text-sm font-semibold"
            onClick={() => void signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" /> Log Out
          </Button>
        </div>
      </div>

      {/* Account Settings Dialog */}
      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Account Settings</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">First Name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Last Name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" type="tel" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input value={user.email ?? ""} disabled className="bg-muted/50" />
            </div>
            <Button onClick={handleSaveAccount} disabled={saving} className="w-full gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Change Password</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
            </div>
            <Button onClick={handleChangePassword} disabled={changingPw} className="w-full gap-1.5">
              {changingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Change Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Country Selector */}
      <Dialog open={countryOpen} onOpenChange={setCountryOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Select Country</DialogTitle></DialogHeader>
          <div className="space-y-1 pt-2">
            {["Bangladesh", "India", "Pakistan", "UAE", "Saudi Arabia", "USA", "UK"].map((c) => (
              <button
                key={c}
                onClick={() => { setCountry(c); setCountryOpen(false); toast({ title: `Country set to ${c}` }); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm hover:bg-muted/50 transition-colors ${
                  country === c ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Currency Selector */}
      <Dialog open={currencyOpen} onOpenChange={setCurrencyOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Select Currency</DialogTitle></DialogHeader>
          <div className="space-y-1 pt-2">
            {[
              { code: "BDT", label: "৳ Bangladeshi Taka" },
              { code: "INR", label: "₹ Indian Rupee" },
              { code: "USD", label: "$ US Dollar" },
              { code: "EUR", label: "€ Euro" },
              { code: "GBP", label: "£ British Pound" },
              { code: "AED", label: "د.إ UAE Dirham" },
              { code: "SAR", label: "﷼ Saudi Riyal" },
            ].map((c) => (
              <button
                key={c.code}
                onClick={() => { setCurrency(c.code); setCurrencyOpen(false); toast({ title: `Currency set to ${c.code}` }); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm hover:bg-muted/50 transition-colors ${
                  currency === c.code ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Language Selector */}
      <Dialog open={languageOpen} onOpenChange={setLanguageOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Select Language</DialogTitle></DialogHeader>
          <div className="space-y-1 pt-2">
            {["English", "বাংলা (Bengali)", "हिन्दी (Hindi)", "العربية (Arabic)", "اردو (Urdu)"].map((l) => (
              <button
                key={l}
                onClick={() => { setLanguage(l.split(" (")[0]); setLanguageOpen(false); toast({ title: `Language set to ${l}` }); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm hover:bg-muted/50 transition-colors ${
                  language === l.split(" (")[0] ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Settings Dialog */}
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Notification Settings</DialogTitle></DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Order Updates</p>
                <p className="text-xs text-muted-foreground">Get notified about order status changes</p>
              </div>
              <Switch checked={orderUpdates} onCheckedChange={setOrderUpdates} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Promotions & Deals</p>
                <p className="text-xs text-muted-foreground">Receive offers and discount alerts</p>
              </div>
              <Switch checked={promotions} onCheckedChange={setPromotions} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
            </div>
            <Button onClick={() => { setNotifOpen(false); toast({ title: "Notification preferences saved" }); }} className="w-full">
              Save Preferences
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">Privacy Policy</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2 text-sm text-muted-foreground leading-relaxed">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Information We Collect</h3>
              <p>We collect information you provide when creating an account, placing orders, or contacting support. This includes your name, email, phone number, and shipping address.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">How We Use Your Information</h3>
              <p>Your information is used to process orders, provide customer support, send order updates, and improve our services. We never sell your personal data to third parties.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Data Security</h3>
              <p>We implement industry-standard security measures to protect your personal information. All data is encrypted in transit and at rest.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Your Rights</h3>
              <p>You have the right to access, update, or delete your personal information at any time through your account settings or by contacting our support team.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Contact Us</h3>
              <p>For any privacy-related questions, please contact us at support@tshirtkella.com.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserSettings;
