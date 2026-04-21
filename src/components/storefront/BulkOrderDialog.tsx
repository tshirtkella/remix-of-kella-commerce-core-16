import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
  productName?: string;
}

const QUANTITY_OPTIONS = ["20-50 pcs", "50-100 pcs", "100-200 pcs", "200-500 pcs", "500 pcs +"];
const CATEGORY_OPTIONS = [
  "Round Neck Half Sleeve",
  "POLO (Collared)",
  "Hoodies",
  "Drop Shoulder",
  "Other (Custom)",
];
const PURPOSE_OPTIONS = ["Corporate Event", "Reselling (Business)", "Family Event", "Other"];

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  full_name: z.string().trim().min(2, "Name required").max(100),
  contact_number: z.string().trim().min(7, "Phone required").max(25),
  quantity_range: z.string().min(1, "Select quantity"),
  product_categories: z.array(z.string()).min(1, "Select at least one category"),
  custom_print: z.boolean(),
  custom_print_details: z.string().max(500).optional(),
  custom_tag: z.boolean(),
  custom_tag_details: z.string().max(500).optional(),
  order_purpose: z.string().min(1, "Select purpose"),
  order_purpose_other: z.string().max(200).optional(),
  additional_notes: z.string().max(1000).optional(),
});

const BulkOrderDialog = ({ open, onOpenChange, productId, productName }: Props) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [quantity, setQuantity] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [customPrint, setCustomPrint] = useState<string>("no");
  const [printDetails, setPrintDetails] = useState("");
  const [customTag, setCustomTag] = useState<string>("no");
  const [tagDetails, setTagDetails] = useState("");
  const [purpose, setPurpose] = useState("");
  const [purposeOther, setPurposeOther] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setEmail(""); setFullName(""); setContact(""); setQuantity("");
    setCategories([]); setCustomPrint("no"); setPrintDetails("");
    setCustomTag("no"); setTagDetails(""); setPurpose(""); setPurposeOther(""); setNotes("");
    setSubmitted(false);
  };

  const toggleCategory = (cat: string) => {
    setCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      email, full_name: fullName, contact_number: contact,
      quantity_range: quantity, product_categories: categories,
      custom_print: customPrint === "yes", custom_print_details: printDetails,
      custom_tag: customTag === "yes", custom_tag_details: tagDetails,
      order_purpose: purpose, order_purpose_other: purposeOther,
      additional_notes: notes,
    };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.errors[0];
      toast({ title: first.message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase.from("bulk_orders") as any).insert({
      ...parsed.data,
      product_id: productId ?? null,
      product_name: productName ?? null,
    });

    if (error) {
      console.error(error);
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Fire email notification (non-blocking) — admin lookup happens server-side
    supabase.functions.invoke("notify-bulk-order", { body: { email: parsed.data.email, full_name: parsed.data.full_name } }).catch((err) => {
      console.warn("Email notify failed (non-blocking):", err);
    });

    setSubmitting(false);
    setSubmitted(true);
    toast({ title: "Bulk order request submitted!", description: "We'll contact you within 24 hours." });
  };

  const handleClose = (val: boolean) => {
    if (!val && submitted) reset();
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <div className="py-10 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-2xl font-bold">Thank You!</h3>
            <p className="text-muted-foreground">Your bulk order request has been received. Our team will contact you within 24 hours.</p>
            <Button onClick={() => handleClose(false)}>Close</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Bulk Order Form</DialogTitle>
              <DialogDescription>
                Quality that's accepted by thousands of customers can now be yours. Fill in the details and we'll get back to you with a custom quote.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 mt-2">
              {productName && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <span className="text-muted-foreground">Inquiry for: </span>
                  <span className="font-semibold">{productName}</span>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bo-name">Your Full Name *</Label>
                  <Input id="bo-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} />
                </div>
                <div>
                  <Label htmlFor="bo-phone">Contact Number *</Label>
                  <Input id="bo-phone" value={contact} onChange={(e) => setContact(e.target.value)} required maxLength={25} placeholder="+880..." />
                </div>
              </div>

              <div>
                <Label htmlFor="bo-email">Email *</Label>
                <Input id="bo-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
              </div>

              <div>
                <Label className="mb-2 block">Quantity you want to order *</Label>
                <RadioGroup value={quantity} onValueChange={setQuantity}>
                  {QUANTITY_OPTIONS.map((q) => (
                    <div key={q} className="flex items-center space-x-2">
                      <RadioGroupItem value={q} id={`q-${q}`} />
                      <Label htmlFor={`q-${q}`} className="font-normal cursor-pointer">{q}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label className="mb-2 block">Product categories you want *</Label>
                <div className="space-y-2">
                  {CATEGORY_OPTIONS.map((c) => (
                    <div key={c} className="flex items-center space-x-2">
                      <Checkbox id={`c-${c}`} checked={categories.includes(c)} onCheckedChange={() => toggleCategory(c)} />
                      <Label htmlFor={`c-${c}`} className="font-normal cursor-pointer">{c}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Want a custom print on your T-shirt? *</Label>
                <RadioGroup value={customPrint} onValueChange={setCustomPrint} className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="cp-yes" /><Label htmlFor="cp-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="cp-no" /><Label htmlFor="cp-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
                {customPrint === "yes" && (
                  <Textarea className="mt-2" placeholder="Describe your print design (or upload separately after we contact you)" value={printDetails} onChange={(e) => setPrintDetails(e.target.value)} maxLength={500} />
                )}
              </div>

              <div>
                <Label className="mb-2 block">Want a custom tag on the T-shirt? *</Label>
                <RadioGroup value={customTag} onValueChange={setCustomTag} className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="ct-yes" /><Label htmlFor="ct-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="ct-no" /><Label htmlFor="ct-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
                {customTag === "yes" && (
                  <Textarea className="mt-2" placeholder="Describe your tag (brand name, etc.)" value={tagDetails} onChange={(e) => setTagDetails(e.target.value)} maxLength={500} />
                )}
              </div>

              <div>
                <Label className="mb-2 block">What's the purpose of your order? *</Label>
                <RadioGroup value={purpose} onValueChange={setPurpose}>
                  {PURPOSE_OPTIONS.map((p) => (
                    <div key={p} className="flex items-center space-x-2">
                      <RadioGroupItem value={p} id={`p-${p}`} />
                      <Label htmlFor={`p-${p}`} className="font-normal cursor-pointer">{p}</Label>
                    </div>
                  ))}
                </RadioGroup>
                {purpose === "Other" && (
                  <Input className="mt-2" placeholder="Please specify" value={purposeOther} onChange={(e) => setPurposeOther(e.target.value)} maxLength={200} />
                )}
              </div>

              <div>
                <Label htmlFor="bo-notes">Additional Notes (optional)</Label>
                <Textarea id="bo-notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="Any other requirements..." />
              </div>

              <Button type="submit" disabled={submitting} className="w-full h-11">
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Bulk Order Request
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkOrderDialog;
