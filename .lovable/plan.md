

## Goal
Add a **Share** feature on product pages so customers can recommend products on social media (Facebook, WhatsApp, Messenger, X/Twitter, etc.) — matching what Daraz, Amazon, Shopify stores do.

## What customers will see

On the **Product Detail page** (`/product/:slug`), next to the existing Wishlist button, a new **Share** button. Clicking it opens a clean popover with:

- **Native share** (mobile) — uses the phone's built-in share sheet (`navigator.share`) when available, so users can share to any installed app (Instagram, Telegram, etc.).
- **Quick share buttons** (desktop + fallback):
  - Facebook
  - WhatsApp
  - Messenger
  - X (Twitter)
  - LinkedIn
  - Telegram
  - Email
- **Copy link** button — copies the product URL to clipboard with a "Copied!" toast.
- **Preview line** showing what gets shared: product name + price + short link.

The share content auto-includes:
- Product name
- Price (with discount if any)
- Product URL (canonical, e.g. `https://yourstore.com/product/<slug>`)
- A short pitch line: *"Check out this <product name> on <store name>!"*

Also add a smaller **Share** icon button on the **ProductCard** hover overlay (next to Quick View / Add to Cart), so users can share directly from listing pages too.

## Social preview (Open Graph)

When the link is pasted on Facebook / WhatsApp / Messenger, it should show the product image, name, and price as a rich preview card. To make this work, the `ProductDetail` page will set per-product meta tags on mount:

- `<title>` — product name + store name
- `og:title`, `og:description`, `og:image` (first product image), `og:url`, `og:type=product`
- `twitter:card=summary_large_image`, `twitter:image`

Cleaned up on unmount so other pages aren't affected.

## Files

**New**
- `src/components/storefront/ShareButton.tsx` — reusable share button + popover. Props: `url`, `title`, `description`, `image`, `variant` (`"full" | "icon"`), optional `className`.
- `src/hooks/useProductMeta.ts` — small hook to set/cleanup OG meta tags for a product.

**Edited**
- `src/pages/ProductDetail.tsx` — render `<ShareButton variant="full" …/>` next to Wishlist; call `useProductMeta(product)`.
- `src/components/storefront/ProductCard.tsx` — add `<ShareButton variant="icon" …/>` to the hover action row (Eye / ShoppingCart / Share).
- `src/components/storefront/QuickViewDialog.tsx` — add the same share button in the dialog footer (small touch, since the dialog already shows product info).

## Technical notes

- Uses existing shadcn `Popover`, `Button`, `useToast` — no new dependencies.
- Social URLs use the standard share endpoints:
  - Facebook: `https://www.facebook.com/sharer/sharer.php?u=<url>`
  - WhatsApp: `https://wa.me/?text=<text>`
  - Messenger: `https://www.facebook.com/dialog/send?link=<url>&app_id=…&redirect_uri=<url>` (fallback to `fb-messenger://share?link=<url>` on mobile)
  - X: `https://twitter.com/intent/tweet?url=<url>&text=<text>`
  - LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=<url>`
  - Telegram: `https://t.me/share/url?url=<url>&text=<text>`
  - Email: `mailto:?subject=<title>&body=<text>%20<url>`
- All open in `window.open(..., '_blank', 'noopener,noreferrer,width=600,height=600')`.
- `navigator.share` used when supported, with graceful fallback to the popover.
- Copy uses `navigator.clipboard.writeText` with a toast.
- URL is built from `window.location.origin + /product/<slug>` so it always points to the live domain.

## Out of scope
- No backend changes, no share-tracking analytics (can be added later).
- No "share to Instagram Story" deep link (Instagram doesn't allow web link shares — native share sheet on mobile already covers it).
- No referral / rewards program (that's a separate feature).

## Expected result
Customers can recommend any product to friends in two clicks — from the product page, product cards, or quick-view dialog — and the shared link shows a proper rich preview on Facebook / WhatsApp / Messenger with the product image, name, and price.

