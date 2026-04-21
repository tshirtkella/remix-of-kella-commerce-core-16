import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Mail, Pencil, Save, Layout, Eye, Plus, Trash2,
  Upload, Image as ImageIcon, Link, Type, AlignLeft, Loader2,
} from "lucide-react";

interface PageTemplate {
  id: string;
  page_key: string;
  section_key: string;
  title: string | null;
  content: Record<string, any>;
  is_active: boolean;
  sort_order: number;
}

interface EmailTemplate {
  id: string;
  template_key: string;
  subject: string;
  heading: string | null;
  body_text: string | null;
  button_text: string | null;
  footer_text: string | null;
  is_active: boolean;
}

const PAGE_LABELS: Record<string, string> = {
  home: "Homepage",
  about: "About Us",
  login: "Login / Auth",
  footer: "Footer",
  shop: "Shop Page",
  product: "Product Detail",
  checkout: "Checkout",
  support: "Support Page",
  categories: "Categories Page",
  profile: "Profile Page",
  my_orders: "My Orders Page",
  not_found: "404 Page",
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  shipping: "Shipping Policy",
  refund: "Refund Policy",
};

const IMAGE_FIELD_HINTS = ["image", "banner", "logo", "icon", "avatar", "photo", "thumbnail", "bg", "background", "hero_image"];

const isImageField = (key: string) =>
  IMAGE_FIELD_HINTS.some((h) => key.toLowerCase().includes(h));

const isUrlField = (key: string, value: string) =>
  key.toLowerCase().includes("url") || key.toLowerCase().includes("link") ||
  (typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://")));

const isLongText = (value: string) => typeof value === "string" && value.length > 100;

const FieldIcon = ({ fieldKey, value }: { fieldKey: string; value: any }) => {
  if (isImageField(fieldKey)) return <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />;
  if (isUrlField(fieldKey, value)) return <Link className="h-3.5 w-3.5 text-blue-500" />;
  if (isLongText(value)) return <AlignLeft className="h-3.5 w-3.5 text-amber-500" />;
  return <Type className="h-3.5 w-3.5 text-muted-foreground" />;
};

/* ─── Image Upload Component ─── */
const ImageFieldUpload = ({
  value,
  onChange,
  fieldKey,
}: {
  value: string;
  onChange: (url: string) => void;
  fieldKey: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `templates/${Date.now()}_${fieldKey}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      onChange(urlData.publicUrl);
      toast({ title: "Image uploaded!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative rounded-lg overflow-hidden border border-border bg-muted/30 max-h-40">
          <img src={value} alt={fieldKey} className="w-full h-32 object-cover" />
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL or upload..."
          className="flex-1 text-sm"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>
    </div>
  );
};

/* ─── Smart Field Renderer ─── */
const SmartField = ({
  fieldKey,
  value,
  onChange,
  onRemove,
}: {
  fieldKey: string;
  value: any;
  onChange: (val: any) => void;
  onRemove: () => void;
}) => {
  const formatKey = (key: string) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    // JSON object/array
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5 text-muted-foreground" />
            {formatKey(fieldKey)}
            <Badge variant="outline" className="text-[9px] ml-1">JSON</Badge>
          </Label>
          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-destructive hover:text-destructive" onClick={onRemove}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        <Textarea
          value={JSON.stringify(value, null, 2)}
          onChange={(e) => {
            try { onChange(JSON.parse(e.target.value)); } catch {}
          }}
          rows={6}
          className="font-mono text-xs"
        />
      </div>
    );
  }

  const strVal = String(value ?? "");

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <FieldIcon fieldKey={fieldKey} value={value} />
          {formatKey(fieldKey)}
          {isImageField(fieldKey) && <Badge variant="outline" className="text-[9px] ml-1 text-emerald-600">Image</Badge>}
        </Label>
        <Button variant="ghost" size="sm" className="h-6 px-1.5 text-destructive hover:text-destructive" onClick={onRemove}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      {isImageField(fieldKey) ? (
        <ImageFieldUpload value={strVal} onChange={onChange} fieldKey={fieldKey} />
      ) : isLongText(strVal) ? (
        <Textarea value={strVal} onChange={(e) => onChange(e.target.value)} rows={4} />
      ) : (
        <Input value={strVal} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
};

/* ─── Main Component ─── */
const Templates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPage, setEditingPage] = useState<PageTemplate | null>(null);
  const [editingEmail, setEditingEmail] = useState<EmailTemplate | null>(null);
  const [pageForm, setPageForm] = useState<Record<string, any>>({});
  const [emailForm, setEmailForm] = useState<Partial<EmailTemplate>>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSection, setNewSection] = useState({
    page_key: "",
    section_key: "",
    title: "",
    fields: [{ key: "", value: "" }],
  });

  const { data: pageTemplates = [], isLoading: loadingPages } = useQuery({
    queryKey: ["admin-page-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_templates")
        .select("*")
        .order("page_key")
        .order("sort_order");
      if (error) throw error;
      return data as PageTemplate[];
    },
  });

  const { data: emailTemplates = [], isLoading: loadingEmails } = useQuery({
    queryKey: ["admin-email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("template_key");
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  const updatePage = useMutation({
    mutationFn: async (template: PageTemplate) => {
      const { error } = await supabase
        .from("page_templates")
        .update({ content: template.content, is_active: template.is_active, title: template.title, updated_at: new Date().toISOString() })
        .eq("id", template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-templates"] });
      queryClient.invalidateQueries({ queryKey: ["page-templates"] });
      setEditingPage(null);
      toast({ title: "Template updated!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const createPage = useMutation({
    mutationFn: async () => {
      const content: Record<string, any> = {};
      newSection.fields.forEach((f) => { if (f.key.trim()) content[f.key.trim()] = f.value; });
      const maxSort = pageTemplates.filter((t) => t.page_key === newSection.page_key).reduce((max, t) => Math.max(max, t.sort_order), -1);
      const { error } = await supabase.from("page_templates").insert({
        page_key: newSection.page_key, section_key: newSection.section_key,
        title: newSection.title || null, content, sort_order: maxSort + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-templates"] });
      queryClient.invalidateQueries({ queryKey: ["page-templates"] });
      setShowCreateDialog(false);
      setNewSection({ page_key: "", section_key: "", title: "", fields: [{ key: "", value: "" }] });
      toast({ title: "Section created!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deletePage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("page_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-templates"] });
      queryClient.invalidateQueries({ queryKey: ["page-templates"] });
      toast({ title: "Section deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateEmail = useMutation({
    mutationFn: async (template: Partial<EmailTemplate> & { id: string }) => {
      const { error } = await supabase
        .from("email_templates")
        .update({
          subject: template.subject, heading: template.heading, body_text: template.body_text,
          button_text: template.button_text, footer_text: template.footer_text,
          is_active: template.is_active, updated_at: new Date().toISOString(),
        })
        .eq("id", template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-email-templates"] });
      setEditingEmail(null);
      toast({ title: "Email template updated!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const openPageEditor = (t: PageTemplate) => { setEditingPage(t); setPageForm(t.content); };
  const openEmailEditor = (t: EmailTemplate) => { setEditingEmail(t); setEmailForm(t); };

  const [newFieldKey, setNewFieldKey] = useState("");
  
  const addFieldToExisting = () => {
    if (newFieldKey.trim() && !pageForm[newFieldKey.trim()]) {
      setPageForm({ ...pageForm, [newFieldKey.trim()]: "" });
      setNewFieldKey("");
    }
  };
  const removeFieldFromExisting = (key: string) => {
    const updated = { ...pageForm }; delete updated[key]; setPageForm(updated);
  };

  const addFieldToNew = () => setNewSection({ ...newSection, fields: [...newSection.fields, { key: "", value: "" }] });
  const updateNewField = (i: number, field: "key" | "value", val: string) => {
    const fields = [...newSection.fields]; fields[i] = { ...fields[i], [field]: val };
    setNewSection({ ...newSection, fields });
  };
  const removeNewField = (i: number) => {
    const fields = newSection.fields.filter((_, idx) => idx !== i);
    setNewSection({ ...newSection, fields: fields.length ? fields : [{ key: "", value: "" }] });
  };

  const groupedPages = pageTemplates.reduce<Record<string, PageTemplate[]>>((acc, t) => {
    (acc[t.page_key] ??= []).push(t); return acc;
  }, {});

  const formatKey = (key: string) => key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const canCreate = newSection.page_key.trim() && newSection.section_key.trim() && newSection.fields.some((f) => f.key.trim());

  const getFieldSummary = (content: Record<string, any>) => {
    const keys = Object.keys(content);
    const imgCount = keys.filter(isImageField).length;
    const textCount = keys.length - imgCount;
    const parts: string[] = [];
    if (textCount > 0) parts.push(`${textCount} text`);
    if (imgCount > 0) parts.push(`${imgCount} image`);
    return parts.join(", ") + " field" + (keys.length !== 1 ? "s" : "");
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage storefront content, images & email templates</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4" /> New Section
        </Button>
      </div>

      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages" className="gap-2"><Layout className="h-4 w-4" /> Page Templates</TabsTrigger>
          <TabsTrigger value="emails" className="gap-2"><Mail className="h-4 w-4" /> Email Templates</TabsTrigger>
        </TabsList>

        {/* ─── PAGE TEMPLATES ─── */}
        <TabsContent value="pages" className="space-y-6">
          {loadingPages ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            Object.entries(groupedPages).map(([pageKey, sections]) => (
              <Card key={pageKey}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {PAGE_LABELS[pageKey] || formatKey(pageKey)}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {sections.length} section{sections.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sections.map((section) => {
                    const imgKeys = Object.entries(section.content).filter(([k]) => isImageField(k));
                    return (
                      <div
                        key={section.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {imgKeys.length > 0 && imgKeys[0][1] ? (
                            <div className="h-10 w-14 rounded border border-border overflow-hidden bg-muted shrink-0">
                              <img src={String(imgKeys[0][1])} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : null}
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant={section.is_active ? "default" : "secondary"} className="text-[10px]">
                                {section.is_active ? "Active" : "Hidden"}
                              </Badge>
                              <p className="text-sm font-medium">{section.title || formatKey(section.section_key)}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">{getFieldSummary(section.content)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => openPageEditor(section)}>
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Button>
                          <Button
                            variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                            onClick={() => { if (confirm("Delete this section?")) deletePage.mutate(section.id); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ─── EMAIL TEMPLATES ─── */}
        <TabsContent value="emails" className="space-y-3">
          {loadingEmails ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            emailTemplates.map((et) => (
              <Card key={et.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{formatKey(et.template_key)}</p>
                      <p className="text-xs text-muted-foreground">Subject: {et.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={et.is_active ? "default" : "secondary"} className="text-[10px]">
                      {et.is_active ? "Active" : "Disabled"}
                    </Badge>
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => openEmailEditor(et)}>
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* ─── EDIT PAGE TEMPLATE DIALOG ─── */}
      <Dialog open={!!editingPage} onOpenChange={() => setEditingPage(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Edit: {editingPage?.title || "Section"}
            </DialogTitle>
          </DialogHeader>
          {editingPage && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Switch
                  checked={editingPage.is_active}
                  onCheckedChange={(v) => setEditingPage({ ...editingPage, is_active: v })}
                />
                <Label className="text-sm">{editingPage.is_active ? "Visible on storefront" : "Hidden from storefront"}</Label>
              </div>

              <div className="space-y-4">
                {Object.entries(pageForm).map(([key, value]) => (
                  <SmartField
                    key={key}
                    fieldKey={key}
                    value={value}
                    onChange={(val) => setPageForm({ ...pageForm, [key]: val })}
                    onRemove={() => removeFieldFromExisting(key)}
                  />
                ))}
              </div>

              {/* Add new field */}
              <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
                <Label className="text-xs text-muted-foreground">Add New Field</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="field_name (e.g. hero_image, subtitle)"
                    value={newFieldKey}
                    onChange={(e) => setNewFieldKey(e.target.value)}
                    className="text-sm flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={addFieldToExisting} disabled={!newFieldKey.trim()}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Tip: Use names like <code className="bg-muted px-1 rounded">hero_image</code>, <code className="bg-muted px-1 rounded">banner_image</code> to auto-enable image upload
                </p>
              </div>

              <Button
                className="w-full gap-2"
                onClick={() => updatePage.mutate({ ...editingPage, content: pageForm })}
                disabled={updatePage.isPending}
              >
                <Save className="h-4 w-4" />
                {updatePage.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── CREATE NEW SECTION DIALOG ─── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create New Section
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Page Key</Label>
                <Input
                  placeholder="e.g. home, about, shop"
                  value={newSection.page_key}
                  onChange={(e) => setNewSection({ ...newSection, page_key: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground">
                  Existing: {Object.keys(groupedPages).join(", ") || "none"}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Section Key</Label>
                <Input
                  placeholder="e.g. hero, banner"
                  value={newSection.section_key}
                  onChange={(e) => setNewSection({ ...newSection, section_key: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Display Title</Label>
              <Input
                placeholder="e.g. Homepage Hero Banner"
                value={newSection.title}
                onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Content Fields</Label>
              {newSection.fields.map((f, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input placeholder="field_key" value={f.key} onChange={(e) => updateNewField(i, "key", e.target.value)} className="w-1/3 text-sm" />
                  <Input placeholder="value" value={f.value} onChange={(e) => updateNewField(i, "value", e.target.value)} className="flex-1 text-sm" />
                  <Button variant="ghost" size="sm" className="px-1.5 text-destructive" onClick={() => removeNewField(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="gap-1.5" onClick={addFieldToNew}>
                <Plus className="h-3.5 w-3.5" /> Add Field
              </Button>
            </div>

            <Button className="w-full gap-2" onClick={() => createPage.mutate()} disabled={createPage.isPending || !canCreate}>
              <Save className="h-4 w-4" />
              {createPage.isPending ? "Creating..." : "Create Section"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── EDIT EMAIL TEMPLATE DIALOG ─── */}
      <Dialog open={!!editingEmail} onOpenChange={() => setEditingEmail(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Edit: {editingEmail ? formatKey(editingEmail.template_key) : ""}
            </DialogTitle>
          </DialogHeader>
          {editingEmail && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={emailForm.is_active ?? true} onCheckedChange={(v) => setEmailForm({ ...emailForm, is_active: v })} />
                <Label className="text-sm">{emailForm.is_active ? "Active" : "Disabled"}</Label>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Subject Line</Label>
                <Input value={emailForm.subject || ""} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Heading</Label>
                <Input value={emailForm.heading || ""} onChange={(e) => setEmailForm({ ...emailForm, heading: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Body Text</Label>
                <Textarea value={emailForm.body_text || ""} onChange={(e) => setEmailForm({ ...emailForm, body_text: e.target.value })} rows={4} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Button Text</Label>
                <Input value={emailForm.button_text || ""} onChange={(e) => setEmailForm({ ...emailForm, button_text: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Footer Text</Label>
                <Textarea value={emailForm.footer_text || ""} onChange={(e) => setEmailForm({ ...emailForm, footer_text: e.target.value })} rows={2} />
              </div>

              {/* Email Preview */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Eye className="h-3 w-3" /> Live Preview
                </div>
                <div className="p-4 bg-card space-y-3">
                  <h3 className="text-lg font-bold">{emailForm.heading || "Heading"}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{emailForm.body_text || "Body text..."}</p>
                  {emailForm.button_text && (
                    <div className="pt-1">
                      <span className="inline-block bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md">
                        {emailForm.button_text}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground/70 pt-2 border-t border-border">{emailForm.footer_text || "Footer text..."}</p>
                </div>
              </div>

              <Button
                className="w-full gap-2"
                onClick={() => updateEmail.mutate({ ...emailForm, id: editingEmail.id } as any)}
                disabled={updateEmail.isPending}
              >
                <Save className="h-4 w-4" />
                {updateEmail.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;
