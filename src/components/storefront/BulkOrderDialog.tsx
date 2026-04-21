import { useState, useRef, useEffect, useMemo } from "react";
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

const QUANTITY_OPTIONS = ["20-50 pcs", "50-100 pcs", "100-200 pcs", "200-500 pcs", "500 pcs +"] as const;
const CATEGORY_OPTIONS = [
  "Round Neck Half Sleeve",
  "POLO (Collared)",
  "Hoodies",
  "Drop Shoulder",
  "Other (Custom)",
] as const;
const PURPOSE_OPTIONS = ["Corporate Event", "Reselling (Business)", "Family Event", "Other"] as const;

// BD phone: 01XXXXXXXXX or +8801XXXXXXXXX or 008801XXXXXXXXX, operators 13-19
const BD_PHONE_REGEX = /^(?:\+?880|0)1[3-9]\d{8}$/;
const STRICT_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const NAME_REGEX = /^[\p{L}\s.'-]{3,60}$/u;
const BLOCKED_EMAIL_DOMAINS = [
  "test.com", "example.com", "example.org", "example.net",
  "mailinator.com", "tempmail.com", "10minutemail.com",
  "guerrillamail.com", "throwaway.email", "yopmail.com",
];

const normalizePhone = (raw: string) => raw.replace(/[\s\-()]/g, "");
const normalizeEmail = (raw: string) => raw.trim().toLowerCase();

const validateName = (name: string): string | null => {
  const trimmed = name.trim();
  if (trimmed.length < 3) return "Name must be at least 3 characters";
  if (trimmed.length > 60) return "Name too long (max 60)";
  if (/\d/.test(trimmed)) return "Name cannot contain numbers";
  if (!NAME_REGEX.test(trimmed)) return "Use letters only (spaces, . ' - allowed)";
  // all same char check
  if (/^(.)\1+$/.test(trimmed.replace(/\s/g, ""))) return "Please enter your real name";
  return null;
};

const validatePhone = (phone: string): string | null => {
  const normalized = normalizePhone(phone);
  if (!normalized) return "Phone number required";
  if (!BD_PHONE_REGEX.test(normalized)) {
    return "Enter a valid Bangladeshi number (e.g. 01XXXXXXXXX)";
  }
  return null;
};

const validateEmail = (email: string): string | null => {
  const normalized = normalizeEmail(email);
  if (!normalized) return "Email required";
  if (normalized.length > 255) return "Email too long";
  if (!STRICT_EMAIL_REGEX.test(normalized)) return "Enter a valid email address";
  const domain = normalized.split("@")[1] ?? "";
  if (BLOCKED_EMAIL_DOMAINS.includes(domain)) return "Please use a real email address";
  if (/tempmail|10minutemail|throwaway/i.test(domain)) return "Disposable emails are not allowed";
  const tld = domain.split(".").pop() ?? "";
  if (tld.length < 2) return "Invalid email domain";
  return null;
};

const BulkOrderDialog = ({ open, onOpenChange, productId, productName }: Props) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
  const [honeypot, setHoneypot] = useState("");

  const openedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (open) {
      openedAtRef.current = Date.now();
    }
  }, [open]);

  const reset = () => {
    setEmail(""); setFullName(""); setContact(""); setQuantity("");
    setCategories([]); setCustomPrint("no"); setPrintDetails("");
    setCustomTag("no"); setTagDetails(""); setPurpose(""); setPurposeOther(""); setNotes("");
    setHoneypot("");
    setSubmitted(false);
    setSubmitError(null);
    setErrors({});
  };

  const toggleCategory = (cat: string) => {
    setCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
    setErrors((e) => ({ ...e, categories: "" }));
  };

  const clearError = (field: string) => setErrors((e) => ({ ...e, [field]: "" }));

  // Lightweight enable check for the submit button
  const canAttemptSubmit = useMemo(() => {
    return (
      fullName.trim().length >= 3 &&
      contact.trim().length >= 7 &&
      email.trim().length >= 5 &&
      quantity !== "" &&
      categories.length > 0 &&
      purpose !== ""
    );
  }, [fullName, contact, email, quantity, categories, purpose]);

  const runValidation = (): Record<string, string> => {
    const next: Record<string, string> = {};

    const nameErr = validateName(fullName);
    if (nameErr) next.fullName = nameErr;

    const phoneErr = validatePhone(contact);
    if (phoneErr) next.contact = phoneErr;

    const emailErr = validateEmail(email);
    if (emailErr) next.email = emailErr;

    if (!QUANTITY_OPTIONS.includes(quantity as typeof QUANTITY_OPTIONS[number])) {
      next.quantity = "Select a quantity range";
    }

    if (categories.length === 0) {
      next.categories = "Select at least one category";
    } else {
      const invalid = categories.find((c) => !CATEGORY_OPTIONS.includes(c as typeof CATEGORY_OPTIONS[number]));
      if (invalid) next.categories = "Invalid category selected";
    }

    if (categories.includes("Other (Custom)") && notes.trim().length < 10) {
      next.notes = "Describe your custom requirement (min 10 chars) in notes";
    }

    if (customPrint === "yes") {
      const v = printDetails.trim();
      if (v.length < 10) next.printDetails = "Describe your print (min 10 chars)";
      else if (v.length > 500) next.printDetails = "Too long (max 500)";
    }

    if (customTag === "yes") {
      const v = tagDetails.trim();
      if (v.length < 10) next.tagDetails = "Describe your tag (min 10 chars)";
      else if (v.length > 500) next.tagDetails = "Too long (max 500)";
    }

    if (!PURPOSE_OPTIONS.includes(purpose as typeof PURPOSE_OPTIONS[number])) {
      next.purpose = "Select an order purpose";
    }
    if (purpose === "Other") {
      const v = purposeOther.trim();
      if (v.length < 5) next.purposeOther = "Please specify (min 5 chars)";
      else if (v.length > 200) next.purposeOther = "Too long (max 200)";
    }

    if (notes.length > 1000) next.notes = "Too long (max 1000)";

    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Honeypot — silent reject
    if (honeypot.trim() !== "") {
      setSubmitted(true);
      return;
    }

    // Min fill-time anti-bot
    const elapsed = Date.now() - openedAtRef.current;
    if (elapsed < 3000) {
      setSubmitError("Please take a moment to review your details before submitting.");
      return;
    }

    const fieldErrors = runValidation();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      const firstMsg = Object.values(fieldErrors)[0];
      toast({ title: "Please fix the highlighted fields", description: firstMsg, variant: "destructive" });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(contact);

    setSubmitting(true);
    try {
      const { error } = await (supabase.from("bulk_orders") as any).insert({
        email: normalizedEmail,
        full_name: fullName.trim(),
        contact_number: normalizedPhone,
        quantity_range: quantity,
        product_categories: categories,
        custom_print: customPrint === "yes",
        custom_print_details: customPrint === "yes" ? printDetails.trim() : null,
        custom_tag: customTag === "yes",
        custom_tag_details: customTag === "yes" ? tagDetails.trim() : null,
        order_purpose: purpose,
        order_purpose_other: purpose === "Other" ? purposeOther.trim() : null,
        additional_notes: notes.trim() || null,
        product_id: productId ?? null,
        product_name: productName ?? null,
      });

      if (error) {
        console.error(error);
        const msg = error.message || "Could not submit your request. Please try again.";
        setSubmitError(msg);
        toast({ title: "Submission failed", description: msg, variant: "destructive" });
        setSubmitting(false);
        return;
      }

      // Fire email notification (non-blocking)
      supabase.functions.invoke("notify-bulk-order", {
        body: { email: normalizedEmail, full_name: fullName.trim() },
      }).catch((err) => {
        console.warn("Email notify failed (non-blocking):", err);
      });

      setSubmitting(false);
      setSubmitted(true);
      toast({ title: "Bulk order request submitted!", description: "We'll contact you within 24 hours." });
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "Network error. Please check your connection and retry.";
      setSubmitError(msg);
      toast({ title: "Submission failed", description: msg, variant: "destructive" });
      setSubmitting(false);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val && submitted) reset();
    onOpenChange(val);
  };

  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? (
      <p className="text-xs text-destructive mt-1">{errors[name]}</p>
    ) : null;

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

            <form onSubmit={handleSubmit} className="space-y-5 mt-2" noValidate>
              {/* Honeypot — hidden from real users */}
              <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="bo-website">Website</label>
                <input
                  id="bo-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {productName && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <span className="text-muted-foreground">Inquiry for: </span>
                  <span className="font-semibold">{productName}</span>
                </div>
              )}

              {submitError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Submission failed</AlertTitle>
                  <AlertDescription className="break-words">{submitError}</AlertDescription>
                </Alert>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bo-name">Your Full Name *</Label>
                  <Input
                    id="bo-name"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); clearError("fullName"); }}
                    onBlur={() => {
                      const err = validateName(fullName);
                      if (err) setErrors((p) => ({ ...p, fullName: err }));
                    }}
                    required
                    maxLength={60}
                    aria-invalid={!!errors.fullName}
                  />
                  <FieldError name="fullName" />
                </div>
                <div>
                  <Label htmlFor="bo-phone">Contact Number *</Label>
                  <Input
                    id="bo-phone"
                    type="tel"
                    inputMode="tel"
                    value={contact}
                    onChange={(e) => { setContact(e.target.value); clearError("contact"); }}
                    onBlur={() => {
                      const err = validatePhone(contact);
                      if (err) setErrors((p) => ({ ...p, contact: err }));
                    }}
                    required
                    maxLength={25}
                    placeholder="01XXXXXXXXX or +8801XXXXXXXXX"
                    aria-invalid={!!errors.contact}
                  />
                  <FieldError name="contact" />
                </div>
              </div>

              <div>
                <Label htmlFor="bo-email">Email *</Label>
                <Input
                  id="bo-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
                  onBlur={() => {
                    setEmail((v) => normalizeEmail(v));
                    const err = validateEmail(email);
                    if (err) setErrors((p) => ({ ...p, email: err }));
                  }}
                  required
                  maxLength={255}
                  aria-invalid={!!errors.email}
                />
                <FieldError name="email" />
              </div>

              <div>
                <Label className="mb-2 block">Quantity you want to order *</Label>
                <RadioGroup value={quantity} onValueChange={(v) => { setQuantity(v); clearError("quantity"); }}>
                  {QUANTITY_OPTIONS.map((q) => (
                    <div key={q} className="flex items-center space-x-2">
                      <RadioGroupItem value={q} id={`q-${q}`} />
                      <Label htmlFor={`q-${q}`} className="font-normal cursor-pointer">{q}</Label>
                    </div>
                  ))}
                </RadioGroup>
                <FieldError name="quantity" />
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
                <FieldError name="categories" />
              </div>

              <div>
                <Label className="mb-2 block">Want a custom print on your T-shirt? *</Label>
                <RadioGroup value={customPrint} onValueChange={(v) => { setCustomPrint(v); clearError("printDetails"); }} className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="cp-yes" /><Label htmlFor="cp-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="cp-no" /><Label htmlFor="cp-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
                {customPrint === "yes" && (
                  <>
                    <Textarea
                      className="mt-2"
                      placeholder="Describe your print design (min 10 characters)"
                      value={printDetails}
                      onChange={(e) => { setPrintDetails(e.target.value); clearError("printDetails"); }}
                      maxLength={500}
                      aria-invalid={!!errors.printDetails}
                    />
                    <FieldError name="printDetails" />
                  </>
                )}
              </div>

              <div>
                <Label className="mb-2 block">Want a custom tag on the T-shirt? *</Label>
                <RadioGroup value={customTag} onValueChange={(v) => { setCustomTag(v); clearError("tagDetails"); }} className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="ct-yes" /><Label htmlFor="ct-yes" className="font-normal">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="ct-no" /><Label htmlFor="ct-no" className="font-normal">No</Label>
                  </div>
                </RadioGroup>
                {customTag === "yes" && (
                  <>
                    <Textarea
                      className="mt-2"
                      placeholder="Describe your tag (brand name, size, placement — min 10 chars)"
                      value={tagDetails}
                      onChange={(e) => { setTagDetails(e.target.value); clearError("tagDetails"); }}
                      maxLength={500}
                      aria-invalid={!!errors.tagDetails}
                    />
                    <FieldError name="tagDetails" />
                  </>
                )}
              </div>

              <div>
                <Label className="mb-2 block">What's the purpose of your order? *</Label>
                <RadioGroup value={purpose} onValueChange={(v) => { setPurpose(v); clearError("purpose"); }}>
                  {PURPOSE_OPTIONS.map((p) => (
                    <div key={p} className="flex items-center space-x-2">
                      <RadioGroupItem value={p} id={`p-${p}`} />
                      <Label htmlFor={`p-${p}`} className="font-normal cursor-pointer">{p}</Label>
                    </div>
                  ))}
                </RadioGroup>
                <FieldError name="purpose" />
                {purpose === "Other" && (
                  <>
                    <Input
                      className="mt-2"
                      placeholder="Please specify (min 5 chars)"
                      value={purposeOther}
                      onChange={(e) => { setPurposeOther(e.target.value); clearError("purposeOther"); }}
                      maxLength={200}
                      aria-invalid={!!errors.purposeOther}
                    />
                    <FieldError name="purposeOther" />
                  </>
                )}
              </div>

              <div>
                <Label htmlFor="bo-notes">
                  Additional Notes {categories.includes("Other (Custom)") ? "*" : "(optional)"}
                </Label>
                <Textarea
                  id="bo-notes"
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); clearError("notes"); }}
                  maxLength={1000}
                  placeholder={categories.includes("Other (Custom)")
                    ? "Describe your custom category requirement (min 10 chars)"
                    : "Any other requirements..."}
                  aria-invalid={!!errors.notes}
                />
                <FieldError name="notes" />
              </div>

              <Button type="submit" disabled={submitting || !canAttemptSubmit} className="w-full h-11">
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
