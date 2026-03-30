import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, LayoutGrid, Pencil, Trash2, Package, Upload, X, ImageIcon } from "lucide-react";

const Categories = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewCat, setViewCat] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: catProducts } = useQuery({
    queryKey: ["category-products", viewCat?.id],
    enabled: !!viewCat,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, base_price, is_active, images(url)")
        .eq("category_id", viewCat!.id)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const fileName = `category-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(`categories/${fileName}`, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(`categories/${fileName}`);
    return urlData.publicUrl;
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let image_url: string | null = null;
      if (imageFile) image_url = await uploadImage(imageFile);
      const { error } = await supabase.from("categories").insert({
        name, slug, description: description || null, image_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      resetForm();
      toast({ title: "Category created!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    onSettled: () => setUploading(false),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let image_url = editingCat.image_url;
      if (imageFile) image_url = await uploadImage(imageFile);
      if (imagePreview === null && !imageFile) image_url = null;
      const { error } = await supabase
        .from("categories")
        .update({ name, slug, description: description || null, image_url })
        .eq("id", editingCat.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      resetForm();
      toast({ title: "Category updated!" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    onSettled: () => setUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Category deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingCat(null);
    setName("");
    setSlug("");
    setDescription("");
    setImageFile(null);
    setImagePreview(null);
  };

  const startEdit = (cat: any) => {
    setEditingCat(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description ?? "");
    setImageFile(null);
    setImagePreview(cat.image_url || null);
    setShowForm(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCat) setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Organize your products</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{editingCat ? "Edit Category" : "New Category"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Men's Tees" />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional description" />
            </div>
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Category Image</Label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
              {imagePreview ? (
                <div className="relative w-32 h-32 rounded-lg border border-border overflow-hidden group">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-32 h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors bg-muted/30"
                >
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                </button>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button
                onClick={() => editingCat ? updateMutation.mutate() : createMutation.mutate()}
                disabled={!name || !slug || uploading || createMutation.isPending || updateMutation.isPending}
              >
                {uploading ? "Uploading..." : (createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingCat ? "Update" : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : !categories?.length ? (
        <div className="flex flex-col items-center py-16">
          <LayoutGrid className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No categories yet</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Image</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c: any) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setViewCat(c)}
                >
                  <td className="px-4 py-3">
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[200px]">{c.description || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteMutation.mutate(c.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!viewCat} onOpenChange={(open) => !open && setViewCat(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{viewCat?.name} — Products</DialogTitle>
          </DialogHeader>
          {catProducts?.length ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {catProducts.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">${Number(p.base_price).toFixed(2)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {p.is_active ? "Active" : "Draft"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No products in this category</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
