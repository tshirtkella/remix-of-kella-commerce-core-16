

## Issues Found

I audited dropdowns, navigation, and key actions across the site. Here are the real bugs:

### 1. "Shop by Category" mega menu — broken on touch & mobile
`src/components/storefront/StoreHeader.tsx` lines 253-310
- Uses **hover-only** triggers (`onMouseEnter`/`onMouseLeave`) → does not open on tap (touch devices, simulated mobile, trackpads without hover).
- The whole nav bar is hidden under `md:block` so on small screens there's no way at all to reach the mega menu.

### 2. Checkout — "change delivery address" missing for logged-in users
`src/pages/Checkout.tsx`
- Logged-in users have saved addresses in `shipping_addresses`, but the Checkout form never loads them. Every checkout forces re-typing name/address/city/phone — no picker, no "Use saved address", no edit/change link.

### 3. Search & profile dropdowns — minor click-out gap
`StoreHeader.tsx` search suggestions: closes on outside-click via `mousedown`, but on iOS Safari `mousedown` doesn't always fire from touchend on links. Low impact, will harden alongside #1.

### 4. (Cosmetic) MyOrders ref warning in console
`src/pages/MyOrders.tsx` — non-blocking React dev warning ("Function components cannot be given refs"). Will silence by wrapping the offending icon in a `<span>` so the parent's ref doesn't reach the lucide component.

Other items checked and working:
- Cart drawer open/close ✔
- Profile → Shipping Address navigation ✔ (route exists, dialog opens, save/edit/delete/default work)
- Add/Edit shipping address dialog ✔
- Categories grid → /shop?category= ✔
- Mobile hamburger menu ✔
- Login / sign-up links ✔

## Fix Plan

### A. `src/components/storefront/StoreHeader.tsx`
- Convert mega-menu trigger into a **click + hover** dropdown:
  - Wrap in a ref'd container; track `showCategories` via both hover (desktop) and click (touch).
  - Add `onClick` toggle on the button; add outside-click listener (mousedown + touchstart) to close.
  - Add `aria-expanded` / `aria-haspopup` for accessibility.
  - Add `onMouseLeave` with a short delay (150 ms) so users can move the cursor into the panel without it snapping shut.
- Tighten search-suggestions outside-close to also listen for `touchstart`.

### B. `src/pages/Checkout.tsx`
- For logged-in users, fetch `shipping_addresses` for `user.id`.
- Render an **"Use a saved address"** picker above the manual fields (radio cards + "Add new"). Selecting one prefills `firstName`, `lastName`, `address`, `city`, `zip`, `country`, `phone`.
- Keep manual edit fields visible so they can override per-order.
- Add a small "Manage addresses" link → `/shipping-address`.
- If no saved addresses, show nothing extra (current behavior preserved).

### C. `src/pages/MyOrders.tsx`
- Wrap the ArrowLeft inside `<Link to="/profile">` with a `<span>` (or convert link to `<button onClick={() => navigate(-1)}>`) so React doesn't try to forward a ref to the lucide function component. Removes the dev warning.

### Out of scope (ask if wanted)
- Replacing the custom mega menu with shadcn `NavigationMenu` (bigger refactor).
- Redesigning the checkout into multi-step layout.

