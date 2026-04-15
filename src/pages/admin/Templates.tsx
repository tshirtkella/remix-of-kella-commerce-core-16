import { useState } from "react";
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
import { FileText, Mail, Pencil, Save, Layout, Eye } from "lucide-react";

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
  login: "Login Page",
  footer: "Footer",
};

const Templates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPage, setEditingPage] = useState<PageTemplate | null>(null);
  const [editingEmail, setEditingEmail] = useState<EmailTemplate | null>(null);
  const [pageForm, setPageForm] = useState<Record<string, any>>({});
  const [emailForm, setEmailForm] = useState<Partial<EmailTemplate>>({});

  // Fetch page templates
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

  // Fetch email templates
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

  // Update page template
  const updatePage = useMutation({
    mutationFn: async (template: PageTemplate) => {
      const { error } = await supabase
        .from("page_templates")
        .update({
          content: template.content,
          is_active: template.is_active,
          title: template.title,
          updated_at: new Date().toISOString(),
        })
        .eq("id", template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-templates"] });
      queryClient.invalidateQueries({ queryKey: ["page-templates"] });
      setEditingPage(null);
      toast({ title: "Template updated!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Update email template
  const updateEmail = useMutation({
    mutationFn: async (template: Partial<EmailTemplate> & { id: string }) => {
      const { error } = await supabase
        .from("email_templates")
        .update({
          subject: template.subject,
          heading: template.heading,
          body_text: template.body_text,
          button_text: template.button_text,
          footer_text: template.footer_text,
          is_active: template.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-email-templates"] });
      setEditingEmail(null);
      toast({ title: "Email template updated!" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openPageEditor = (t: PageTemplate) => {
    setEditingPage(t);
    setPageForm(t.content);
  };

  const openEmailEditor = (t: EmailTemplate) => {
    setEditingEmail(t);
    setEmailForm(t);
  };

  const groupedPages = pageTemplates.reduce<Record<string, PageTemplate[]>>((acc, t) => {
    (acc[t.page_key] ??= []).push(t);
    return acc;
  }, {});

  const formatKey = (key: string) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage storefront page content and email templates
        </p>
      </div>

      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages" className="gap-2">
            <Layout className="h-4 w-4" />
            Page Templates
          </TabsTrigger>
          <TabsTrigger value="emails" className="gap-2">
            <Mail className="h-4 w-4" />
            Email Templates
          </TabsTrigger>
        </TabsList>

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
                    {sections.length} editable section{sections.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={section.is_active ? "default" : "secondary"} className="text-[10px]">
                          {section.is_active ? "Active" : "Hidden"}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{section.title || formatKey(section.section_key)}</p>
                          <p className="text-xs text-muted-foreground">
                            {Object.keys(section.content).length} field{Object.keys(section.content).length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => openPageEditor(section)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

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
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingPage} onOpenChange={() => setEditingPage(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Edit: {editingPage?.title || "Section"}
            </DialogTitle>
          </DialogHeader>
          {editingPage && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={editingPage.is_active}
                  onCheckedChange={(v) => setEditingPage({ ...editingPage, is_active: v })}
                />
                <Label className="text-sm">{editingPage.is_active ? "Visible on storefront" : "Hidden from storefront"}</Label>
              </div>

              {Object.entries(pageForm).map(([key, value]) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-sm font-medium">{formatKey(key)}</Label>
                  {typeof value === "string" ? (
                    value.length > 80 ? (
                      <Textarea
                        value={value}
                        onChange={(e) => setPageForm({ ...pageForm, [key]: e.target.value })}
                        rows={4}
                      />
                    ) : (
                      <Input
                        value={value}
                        onChange={(e) => setPageForm({ ...pageForm, [key]: e.target.value })}
                      />
                    )
                  ) : (
                    <Textarea
                      value={JSON.stringify(value, null, 2)}
                      onChange={(e) => {
                        try {
                          setPageForm({ ...pageForm, [key]: JSON.parse(e.target.value) });
                        } catch {
                          // keep raw for now
                        }
                      }}
                      rows={6}
                      className="font-mono text-xs"
                    />
                  )}
                </div>
              ))}

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
                <Switch
                  checked={emailForm.is_active ?? true}
                  onCheckedChange={(v) => setEmailForm({ ...emailForm, is_active: v })}
                />
                <Label className="text-sm">{emailForm.is_active ? "Active" : "Disabled"}</Label>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Subject Line</Label>
                <Input
                  value={emailForm.subject || ""}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Heading</Label>
                <Input
                  value={emailForm.heading || ""}
                  onChange={(e) => setEmailForm({ ...emailForm, heading: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Body Text</Label>
                <Textarea
                  value={emailForm.body_text || ""}
                  onChange={(e) => setEmailForm({ ...emailForm, body_text: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Button Text</Label>
                <Input
                  value={emailForm.button_text || ""}
                  onChange={(e) => setEmailForm({ ...emailForm, button_text: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Footer Text</Label>
                <Textarea
                  value={emailForm.footer_text || ""}
                  onChange={(e) => setEmailForm({ ...emailForm, footer_text: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Eye className="h-3 w-3" /> Preview
                </div>
                <div className="p-4 bg-card space-y-3">
                  <h3 className="text-lg font-bold">{emailForm.heading || "Heading"}</h3>
                  <p className="text-sm text-muted-foreground">{emailForm.body_text || "Body text..."}</p>
                  {emailForm.button_text && (
                    <div className="pt-1">
                      <span className="inline-block bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-md">
                        {emailForm.button_text}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground/70 pt-2 border-t border-border">
                    {emailForm.footer_text || "Footer text..."}
                  </p>
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
