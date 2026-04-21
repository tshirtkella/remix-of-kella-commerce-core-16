

## Goal
1. Remove **Shop by Category**, **Shop All**, **About Us**, **Support** from the desktop secondary nav bar.
2. Make the whole site comfortably usable on small phones (down to 320 px), with proper tap targets and no horizontal scroll.

## Changes

### A. Header cleanup — `src/components/storefront/StoreHeader.tsx`
- In the desktop secondary nav (lines 266–348), remove these links: **Shop by Category** (mega menu block), **Shop All**, **About Us**, **Support**. Keep: **Home**, **New Arrivals**, **SALE 🔥**.
- Drop the now-unused state/refs: `showCategories`, `megaMenuRef`, `closeTimerRef`, `openMega`, `scheduleCloseMega`, `catCol1`, `catCol2`, `half`, `ChevronDown` import.
- The mega-menu outside-click effect collapses to only handle search suggestions.
- Mobile hamburger menu keeps the same items it has today (Home, Shop All, SALE, All Categories + category list, Support, About Us) so nothing becomes unreachable on phones.
- Top-bar tweaks for tiny screens: shrink the right-side links gap (`gap-2 sm:gap-4`), let "Login / Sign Up" wrap to a single "Login" pill on `<360px` to avoid overflow.
- Make the search bar honor small screens: `min-w-0` on the wrapper so flexbox can shrink it, and reduce its right padding on mobile.

### B. Mobile responsiveness sweep
Targeted, low-risk fixes — no visual redesign on desktop.

1. **`src/index.css`** — add a global guard:
   - `html, body { overflow-x: hidden; }`
   - `img, video { max-width: 100%; height: auto; }`
   - Bump default tap target: `button, a { touch-action: manipulation; }`

2. **`src/pages/Storefront.tsx`** — verify all section paddings use `px-4 sm:px-6 lg:px-8` and stacks use `flex-col md:flex-row` (spot-fix any section that overflows on 360 px).

3. **`src/components/storefront/HeroSlider.tsx`** — cap height with `h-[280px] sm:h-[380px] md:h-[480px]`, ensure text uses `text-2xl sm:text-4xl` and CTA buttons are full-width on mobile.

4. **`src/components/storefront/CategoryCarousel.tsx` / `CategoriesGrid.tsx` / `JustForYou.tsx` / `FlashSale.tsx`** — ensure grids use `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5` and card text is `text-xs sm:text-sm` to avoid truncation.

5. **`src/components/storefront/ProductCard.tsx`** — make price/title not overflow: add `min-w-0`, `truncate` on name, wrap action row with `flex-wrap gap-1`.

6. **`src/pages/ProductDetail.tsx`** — switch image+info from `grid-cols-2` to `grid-cols-1 md:grid-cols-2`; size/color buttons `flex-wrap`; sticky "Add to Cart" bar full-width on mobile.

7. **`src/pages/Checkout.tsx`** — main grid `grid-cols-1 lg:grid-cols-3`; saved-address picker cards stack full width on mobile; form inputs `h-11` for easier tapping.

8. **`src/pages/Shop.tsx`** — sidebar filters become a `Sheet` (drawer) on mobile via a "Filters" button; product grid `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.

9. **`src/components/storefront/StoreFooter.tsx`** — columns `grid-cols-2 md:grid-cols-4`, reduce font to `text-xs sm:text-sm`, center social icons on mobile.

10. **`src/components/storefront/CartDrawer.tsx`** — drawer width `w-full sm:max-w-md`; line items use `flex-col sm:flex-row` so qty controls don't squash the title.

### Out of scope
- No changes to admin pages (desktop-only by design).
- No new pages or feature work — purely layout/CSS and the menubar removals.

