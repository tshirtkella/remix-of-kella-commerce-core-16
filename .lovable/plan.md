

## Goal
Add a polished, branded **"Redirecting to secure payment…"** overlay that appears the moment the customer clicks **Pay now** with an online payment method, and stays visible until SSLCOMMERZ takes over. This makes the jump to the gateway feel intentional, secure, and on-brand instead of a sudden white-page redirect.

## What changes

### 1. New component — `src/components/storefront/PaymentRedirectOverlay.tsx`
Full-screen fixed overlay (z-[100]) with a soft blurred backdrop. Centered card containing:
- Store logo (pulled from `useBranding`) at the top.
- Animated lock + spinner combo (lock icon inside a slowly rotating ring).
- Title: **"Redirecting to secure payment…"**
- Subtitle: **"Please don't close or refresh this page."**
- Small SSL trust row: 🔒 SSL Secured · 🛡 256-bit encryption · ✅ Verified gateway.
- "Powered by SSLCOMMERZ" line (small, muted).
- Indeterminate progress bar at the bottom of the card for visual progress feedback.

Props: `open: boolean`, `gatewayName?: string` (defaults to "SSLCOMMERZ"), so we can reuse it later for bKash / Nagad redirects.

Body scroll is locked while open. Overlay is non-dismissable (no close button) — it must stay until the actual redirect happens.

### 2. Wire it into `src/pages/Checkout.tsx`
- Add state `const [redirecting, setRedirecting] = useState(false);`
- In `handlePlaceOrder`, when `paymentMethod` is one of `sslcommerz` / `bkash` / `nagad` (i.e. any non-COD online method), set `setRedirecting(true)` **before** the order-create network calls, so the overlay appears the instant the user clicks Pay now.
- Keep the existing order-creation logic intact. Once the order is created and the redirect URL is available (currently the placeholder "coming soon" toast), the overlay stays mounted right up to `window.location.href = …`. If the flow falls back to COD (current behavior), still show the overlay for ~800 ms then hide it before the success toast — feels intentional, not jarring.
- On error: hide the overlay (`setRedirecting(false)`) so the user can retry.
- Render `<PaymentRedirectOverlay open={redirecting} />` at the bottom of the Checkout JSX.

### 3. Pay-now button micro-polish
- While `redirecting` is true, swap the button label to **"Securing your payment…"** with the spinner, and keep it disabled (in addition to the existing `isSubmitting`).

### Out of scope
- No backend / SSLCOMMERZ integration changes. The screenshot shows SSLCOMMERZ already working in your environment — we're only improving the UI on our side before the redirect.
- No changes to bKash / Nagad / COD logic.
- No styling changes to the SSLCOMMERZ hosted page itself (that page is owned by SSLCOMMERZ and cannot be restyled by us; it is customized via the SSLCOMMERZ merchant panel).

## Files
- `src/components/storefront/PaymentRedirectOverlay.tsx` (new)
- `src/pages/Checkout.tsx` (add state, trigger overlay, button label)

## Expected result
Clicking **Pay now** with an online method instantly shows a clean, branded "Redirecting to secure payment…" screen with your store logo, security badges, and an animated lock — then SSLCOMMERZ opens. The handoff feels professional and trustworthy instead of a blank flash.
