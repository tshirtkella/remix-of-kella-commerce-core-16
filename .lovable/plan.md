

## Goal
Redesign the **Payment** section on `/checkout` to look professional and trustworthy — proper logos, clear hierarchy, secure-payment badge, and consistent card styling. No backend / logic changes.

## What changes (visual only)

### `src/pages/Checkout.tsx` — Payment section (lines ~550-642)

**1. Section header**
- Title "Payment" + small lock icon and the line "All transactions are secure and encrypted" moved beside the title in a single header row.
- Add a small "SSL Secured" badge (lock icon + text) on the right.

**2. Each payment option becomes a polished card row**
Replace the current single bordered list with separate cards (rounded-xl, subtle shadow, 1px border, hover lift). Selected card: 2px primary border + soft primary tint + check icon on the right.

Layout per row (left → right):
```text
[ radio ] [ logo box 56x40, white bg, border ] [ Title + subtitle ]      [ method badges ] [ check ]
```

**3. Brand-correct logos (inline SVG, no external assets)**
- **SSLCOMMERZ** → SSLCOMMERZ wordmark in brand navy.
- **bKash** → pink (#E2136E) rounded badge with white "bKash" wordmark.
- **Nagad** → orange (#F6921E) rounded badge with white "Nagad" wordmark.
- **COD** → wallet/cash icon in a neutral square.

**4. Method badges (right side, only for SSLCOMMERZ)**
Replace the current colored "VISA / MC / AMEX / +2" pill chips with proper mini card-brand SVG logos in white pill containers with subtle border (Visa, Mastercard, Amex, Nexus, bKash). Keeps consistent height (h-5).

**5. Expanded details panel (when selected)**
- SSLCOMMERZ: light info banner with shield icon — "You'll be securely redirected to SSLCOMMERZ to complete payment."
- COD: info banner — "Pay in cash when your order is delivered. Available across Bangladesh."
- bKash / Nagad: keep admin-configured instructions but render them inside a clean info card with the brand color as a left accent bar (no account number / instructions for bKash if memory rule says hide — keep the existing conditional, just style it).

**6. Trust strip below the payment list**
Small horizontal row of three icon+text items:
- 🔒 SSL Secured
- 🛡️ Buyer Protection
- ✅ Verified Gateway

**7. "Pay now" button polish (line 687-699)**
- Add a lock icon before the label when method is online.
- Subtitle below button: "Your payment info is encrypted and never stored." (text-xs muted-foreground, centered).

### Out of scope
- No changes to payment processing logic, admin settings, or DB.
- No new payment methods.
- No changes outside the Payment section + Pay-now button.

## File touched
- `src/pages/Checkout.tsx` (only the Payment `<section>` and the Pay-now button block)

## Expected result
Professional, trust-building payment UI with real-looking gateway logos, clear selection states, secure-checkout cues, and a consistent card-based layout that matches modern e-commerce checkouts (Daraz / Shopify style).

