import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Upload, X } from "lucide-react";

interface VariantInput {
  size: string;
  color: string;
  sku: string;
  inventory_quantity: number;
  price_override: string;
}

const ProductForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantInput[]>([
    { size: "M", color: "Black", sku: "", inventory_quantity: 0, price_override: "" },
  ]);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  const addVariant = () => {
    setVariants([...variants, { size: "M", color: "", sku: "", inventory_quantity: 0, price_override: "" }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof VariantInput, value: string | number) => {
    const updated = [...variants];
    (updated[index] as any)[field] = value;
    setVariants(updated);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setImageFiles((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: product, error: pErr } = await supabase
        .from("products")
        .insert({
          name,
          slug,
          description: description || null,
          base_price: parseFloat(basePrice),
          category_id: categoryId || null,
        })
        .select()
        .single();

      if (pErr) throw pErr;

      if (variants.length > 0) {
        const variantRows = variants.map((v) => ({
          product_id: product.id,
          size: v.size,
          color: v.color,
          sku: v.sku,
          inventory_quantity: v.inventory_quantity,
          price_override: v.price_override ? parseFloat(v.price_override) : null,
        }));

        const { error: vErr } = await supabase.from("variants").insert(variantRows);
        if (vErr) throw vErr;
      }

      // Upload images
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const ext = file.name.split(".").pop();
        const path = `${product.id}/${Date.now()}-${i}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("product-images")
          .upload(path, file);
        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);

        await supabase.from("images").insert({
          product_id: product.id,
          url: urlData.publicUrl,
          alt_text: name,
          position: i,
        });
      }

      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product created!" });
      navigate("/admin");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-heading text-2xl font-bold">New Product</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Classic Logo Tee" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="classic-logo-tee" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Base Price ($)</Label>
              <Input type="number" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="29.99" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">No category</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {imagePreviews.map((src, i) => (
              <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border group">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="flex flex-col items-center justify-center w-24 h-24 rounded-lg border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-1">Upload</span>
              <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Variants</CardTitle>
          <Button variant="outline" size="sm" onClick={addVariant}>
            <Plus className="h-3 w-3 mr-1" /> Add Variant
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 items-end p-3 rounded-lg bg-muted/50">
              <div className="space-y-1">
                <Label className="text-xs">Size</Label>
                <select
                  value={v.size}
                  onChange={(e) => updateVariant(i, "size", e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Color</Label>
                <Input className="h-9" value={v.color} onChange={(e) => updateVariant(i, "color", e.target.value)} placeholder="Black" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">SKU</Label>
                <Input className="h-9" value={v.sku} onChange={(e) => updateVariant(i, "sku", e.target.value)} placeholder="CLT-BLK-M" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Stock</Label>
                <Input className="h-9" type="number" value={v.inventory_quantity} onChange={(e) => updateVariant(i, "inventory_quantity", parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Price Override</Label>
                <Input className="h-9" type="number" step="0.01" value={v.price_override} onChange={(e) => updateVariant(i, "price_override", e.target.value)} placeholder="—" />
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeVariant(i)} disabled={variants.length === 1}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={() => navigate("/admin")}>Cancel</Button>
        <Button onClick={() => createMutation.mutate()} disabled={!name || !slug || !basePrice || createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create Product"}
        </Button>
      </div>
    </div>
  );
};

export default ProductForm;
