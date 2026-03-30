import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Shirt, Shield, Key, Users, DollarSign, Trash2, UserPlus, CreditCard, Image, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
];

type AppRole = "admin" | "moderator" | "user";

interface RoleEntry {
  id: string;
  user_id: string;
  role: AppRole;
  email?: string;
}

const Settings = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPw, setNewPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("user");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);

  const [brandingForm, setBrandingForm] = useState({
    store_name: "T-Shirt Kella",
    logo_url: "",
    favicon_url: "",
  });

  interface PaymentConfig {
    sslcommerz_enabled: boolean;
    sslcommerz_store_id: string;
    sslcommerz_store_password: string;
    sslcommerz_sandbox: boolean;
    cod_enabled: boolean;
    bkash_enabled: boolean;
    bkash_number: string;
    bkash_instructions: string;
  }

  const defaultPaymentConfig: PaymentConfig = {
    sslcommerz_enabled: false,
    sslcommerz_store_id: "",
    sslcommerz_store_password: "",
    sslcommerz_sandbox: true,
    cod_enabled: true,
    bkash_enabled: false,
    bkash_number: "",
    bkash_instructions: "",
  };

  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(defaultPaymentConfig);

  // Payment settings query
  const { data: paymentSettings } = useQuery({
    queryKey: ["store-payment-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("key, value")
        .like("key", "payment_%");
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => { map[r.key] = r.value; });
      return map;
    },
  });

  useEffect(() => {
    if (paymentSettings) {
      setPaymentConfig({
        sslcommerz_enabled: paymentSettings.payment_sslcommerz_enabled === "true",
        sslcommerz_store_id: paymentSettings.payment_sslcommerz_store_id || "",
        sslcommerz_store_password: paymentSettings.payment_sslcommerz_store_password ? "••••••••" : "",
        sslcommerz_sandbox: paymentSettings.payment_sslcommerz_sandbox !== "false",
        cod_enabled: paymentSettings.payment_cod_enabled !== "false",
        bkash_enabled: paymentSettings.payment_bkash_enabled === "true",
        bkash_number: paymentSettings.payment_bkash_number || "",
        bkash_instructions: paymentSettings.payment_bkash_instructions || "",
      });
    }
  }, [paymentSettings]);

  // Branding settings query
  const { data: brandingSettings } = useQuery({
    queryKey: ["store-branding-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("key, value")
        .in("key", ["store_name", "logo_url", "favicon_url"]);
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => { map[r.key] = r.value; });
      return map;
    },
  });

  useEffect(() => {
    if (brandingSettings) {
      setBrandingForm({
        store_name: brandingSettings.store_name || "T-Shirt Kella",
        logo_url: brandingSettings.logo_url || "",
        favicon_url: brandingSettings.favicon_url || "",
      });
    }
  }, [brandingSettings]);

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      const now = new Date().toISOString();
      const entries = [
        { key: "store_name", value: brandingForm.store_name },
        { key: "logo_url", value: brandingForm.logo_url },
        { key: "favicon_url", value: brandingForm.favicon_url },
      ];
      for (const entry of entries) {
        const { error } = await supabase
          .from("store_settings")
          .upsert({ key: entry.key, value: entry.value, updated_at: now }, { onConflict: "key" });
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["store-branding"] });
      queryClient.invalidateQueries({ queryKey: ["store-branding-admin"] });
      toast({ title: "Branding settings saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingBranding(false);
    }
  };

  const handleSavePayment = async () => {
    setSavingPayment(true);
    try {
      const now = new Date().toISOString();
      const entries: { key: string; value: string }[] = [
        { key: "payment_sslcommerz_enabled", value: String(paymentConfig.sslcommerz_enabled) },
        { key: "payment_sslcommerz_sandbox", value: String(paymentConfig.sslcommerz_sandbox) },
        { key: "payment_cod_enabled", value: String(paymentConfig.cod_enabled) },
        { key: "payment_bkash_enabled", value: String(paymentConfig.bkash_enabled) },
        { key: "payment_bkash_number", value: paymentConfig.bkash_number },
        { key: "payment_bkash_instructions", value: paymentConfig.bkash_instructions },
      ];

      // Only save credentials if not masked
      if (paymentConfig.sslcommerz_store_id && !paymentConfig.sslcommerz_store_id.startsWith("••")) {
        entries.push({ key: "payment_sslcommerz_store_id", value: paymentConfig.sslcommerz_store_id });
      }
      if (paymentConfig.sslcommerz_store_password && !paymentConfig.sslcommerz_store_password.startsWith("••")) {
        entries.push({ key: "payment_sslcommerz_store_password", value: paymentConfig.sslcommerz_store_password });
      }

      for (const entry of entries) {
        const { error } = await supabase
          .from("store_settings")
          .upsert({ key: entry.key, value: entry.value, updated_at: now }, { onConflict: "key" });
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["store-payment-settings"] });
      toast({ title: "Payment settings saved" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingPayment(false);
    }
  };

  // Currency
  const { data: currency, isLoading: currLoading } = useQuery({
    queryKey: ["store-currency"],
    queryFn: async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("value")
        .eq("key", "currency")
        .maybeSingle();
      return data?.value || "USD";
    },
  });

  const currencyMutation = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase
        .from("store_settings")
        .update({ value: code, updated_at: new Date().toISOString() })
        .eq("key", "currency");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-currency"] });
      toast({ title: "Currency updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // User roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data as RoleEntry[];
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AppRole }) => {
      // First sign up the user (they'll get a confirmation email)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: crypto.randomUUID().slice(0, 16) + "A1!", // temp password
        options: { emailRedirectTo: window.location.origin },
      });
      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Failed to create user");

      // Add role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: signUpData.user.id, role });
      if (roleError) throw roleError;

      return { userId: signUpData.user.id, email };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast({ title: "User added & invitation sent" });
      setInviteEmail("");
      setInviteRole("user");
      setAddDialogOpen(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").update({ role }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast({ title: "Role updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      toast({ title: "User role removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleChangePassword = async () => {
    if (!newPw || newPw.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setChangingPw(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated successfully" });
      setNewPw("");
    }
  };

  const roleColor = (r: string) => {
    if (r === "admin") return "default";
    if (r === "moderator") return "secondary";
    return "outline";
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account, team & store preferences</p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" /> Account Info
          </CardTitle>
          <CardDescription>Your admin account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Role</span>
            <Badge variant={isAdmin ? "default" : "secondary"}>
              {isAdmin ? "Admin" : "User"}
            </Badge>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">Joined</span>
            <span className="text-sm">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Team / Role Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" /> Team & Roles
            </CardTitle>
            <CardDescription>Manage who has access and their permissions</CardDescription>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <UserPlus className="h-4 w-4" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin — Full access</SelectItem>
                      <SelectItem value="moderator">Moderator — Manage products & orders</SelectItem>
                      <SelectItem value="user">User — View only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  disabled={!inviteEmail || addRoleMutation.isPending}
                  onClick={() => addRoleMutation.mutate({ email: inviteEmail, role: inviteRole })}
                >
                  {addRoleMutation.isPending ? "Adding..." : "Add & Send Invite"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {rolesLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team members yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs max-w-[200px] truncate">
                      {r.user_id}
                      {r.user_id === user?.id && (
                        <Badge variant="outline" className="ml-2 text-[10px]">You</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={r.role}
                        onValueChange={(v) => updateRoleMutation.mutate({ id: r.id, role: v as AppRole })}
                        disabled={r.user_id === user?.id}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={r.user_id === user?.id}
                        onClick={() => removeRoleMutation.mutate(r.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Currency Preference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" /> Currency
          </CardTitle>
          <CardDescription>Set the default currency for your store</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={currency || "USD"}
            onValueChange={(v) => currencyMutation.mutate(v)}
            disabled={currLoading}
          >
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.symbol} {c.code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Payment Methods
          </CardTitle>
          <CardDescription>Configure which payment options customers see at checkout</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SSLCOMMERZ */}
          <div className="space-y-3 p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">SSLCOMMERZ</p>
                <p className="text-xs text-muted-foreground">Accept Visa, Mastercard, Amex & more</p>
              </div>
              <Switch checked={paymentConfig.sslcommerz_enabled} onCheckedChange={(v) => setPaymentConfig(prev => ({ ...prev, sslcommerz_enabled: v }))} />
            </div>
            {paymentConfig.sslcommerz_enabled && (
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs">Store ID</Label>
                  <Input value={paymentConfig.sslcommerz_store_id} onChange={(e) => setPaymentConfig(prev => ({ ...prev, sslcommerz_store_id: e.target.value }))} placeholder="your_store_id" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Store Password</Label>
                  <Input type="password" value={paymentConfig.sslcommerz_store_password} onChange={(e) => setPaymentConfig(prev => ({ ...prev, sslcommerz_store_password: e.target.value }))} placeholder="your_store_password" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={paymentConfig.sslcommerz_sandbox} onCheckedChange={(v) => setPaymentConfig(prev => ({ ...prev, sslcommerz_sandbox: v }))} />
                  <Label className="text-xs">Sandbox / Test Mode</Label>
                </div>
              </div>
            )}
          </div>

          {/* bKash */}
          <div className="space-y-3 p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">bKash</p>
                <p className="text-xs text-muted-foreground">Mobile payment via bKash</p>
              </div>
              <Switch checked={paymentConfig.bkash_enabled} onCheckedChange={(v) => setPaymentConfig(prev => ({ ...prev, bkash_enabled: v }))} />
            </div>
            {paymentConfig.bkash_enabled && (
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs">bKash Number</Label>
                  <Input value={paymentConfig.bkash_number} onChange={(e) => setPaymentConfig(prev => ({ ...prev, bkash_number: e.target.value }))} placeholder="01XXXXXXXXX" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Payment Instructions</Label>
                  <Textarea value={paymentConfig.bkash_instructions} onChange={(e) => setPaymentConfig(prev => ({ ...prev, bkash_instructions: e.target.value }))} placeholder="e.g. Send payment to 01XXXXXXXXX and include your order number as reference" rows={3} />
                </div>
              </div>
            )}
          </div>

          {/* COD */}
          <div className="space-y-3 p-4 border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Cash on Delivery (COD)</p>
                <p className="text-xs text-muted-foreground">Customers pay when they receive their order</p>
              </div>
              <Switch checked={paymentConfig.cod_enabled} onCheckedChange={(v) => setPaymentConfig(prev => ({ ...prev, cod_enabled: v }))} />
            </div>
          </div>

          <Button onClick={handleSavePayment} disabled={savingPayment} className="w-full">
            {savingPayment ? "Saving..." : "Save Payment Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="h-5 w-5" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <Button onClick={handleChangePassword} disabled={changingPw || !newPw}>
            {changingPw ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Image className="h-5 w-5" /> Branding
          </CardTitle>
          <CardDescription>Customize your store name, logo and favicon</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Store Name</Label>
            <Input
              value={brandingForm.store_name}
              onChange={(e) => setBrandingForm(prev => ({ ...prev, store_name: e.target.value }))}
              placeholder="Your Store Name"
            />
          </div>
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input
              value={brandingForm.logo_url}
              onChange={(e) => setBrandingForm(prev => ({ ...prev, logo_url: e.target.value }))}
              placeholder="https://example.com/logo.png"
            />
            {brandingForm.logo_url && (
              <div className="mt-2 p-3 border border-border rounded-lg bg-muted/30 flex items-center gap-3">
                <img src={brandingForm.logo_url} alt="Logo preview" className="h-10 w-10 object-contain rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-xs text-muted-foreground">Logo preview</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Favicon URL</Label>
            <Input
              value={brandingForm.favicon_url}
              onChange={(e) => setBrandingForm(prev => ({ ...prev, favicon_url: e.target.value }))}
              placeholder="https://example.com/favicon.png"
            />
            {brandingForm.favicon_url && (
              <div className="mt-2 p-3 border border-border rounded-lg bg-muted/30 flex items-center gap-3">
                <img src={brandingForm.favicon_url} alt="Favicon preview" className="h-6 w-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-xs text-muted-foreground">Favicon preview</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Recommended: 32x32 or 64x64 PNG image</p>
          </div>
          <Button onClick={handleSaveBranding} disabled={savingBranding} className="w-full">
            {savingBranding ? "Saving..." : "Save Branding"}
          </Button>
        </CardContent>
      </Card>

      {/* Store Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" /> Store Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-border">
            <span className="text-sm text-muted-foreground">Store Name</span>
            <span className="text-sm font-medium">{brandingForm.store_name}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">Platform</span>
            <span className="text-sm">Lovable Cloud</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
