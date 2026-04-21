

## Root Cause: White Screen on Profile / MyOrders / etc.

The auth hook (`src/hooks/useAuth.tsx`) gets stuck in `loading: true` after Supabase fires post-mount auth events (e.g. `TOKEN_REFRESHED`, `SIGNED_IN`, `USER_UPDATED`).

Sequence that breaks:
1. Page mounts → `getSession()` resolves → `applySession()` sets `rolesLoading=true`, then the roles `useEffect` runs and flips it to `false`. ✅
2. User navigates to `/profile`. Supabase fires `TOKEN_REFRESHED` (or `SIGNED_IN`) → `applySession()` runs again → **`rolesLoading` reset to `true`**.
3. Roles `useEffect` depends on `[authReady, user?.id]`. Neither changed, so it **does not re-run**. → `rolesLoading` stays `true` forever → `loading` stays `true` → spinner forever = the white/loading screen.

Pages that gate with `if (loading) return <Spinner/>` (Profile, MyOrders, ShippingAddress, UserSettings, etc.) all hit this.

A secondary symptom is the `QuickViewDialog` "function components cannot be given refs" console warning — non-blocking but noisy.

## Fix Plan

### A. `src/hooks/useAuth.tsx` — make auth state resilient
1. **Stop resetting `rolesLoading` on every session event.** Only set it `true` when the user **id actually changes** (initial sign-in, sign-out, account switch). Token refresh / metadata update must not toggle the spinner.
2. Track the previous user id in a ref; compare before deciding whether to mark roles as loading again.
3. Add a **safety timeout** (e.g., 5 s) on the roles fetch — if the network query hangs, default to non-staff and clear loading rather than stalling the whole UI.
4. Stop ignoring `INITIAL_SESSION` — let it flow through `applySession` consistently (but still avoid the reset described in #1).
5. Add `console.warn` on roles fetch error so future stalls are visible during dev.

### B. `src/pages/Profile.tsx` — don't block UI on auth roles
- Keep gating on `if (!user)` redirect, but stop using the broad `loading` flag from `useAuth` to render a full-screen spinner. Show the page shell immediately and only spin inside the profile-data block (`profileLoading`). This way even if roles stall, the page still appears.
- Same treatment for `src/pages/MyOrders.tsx`, `src/pages/ShippingAddress.tsx`, `src/pages/UserSettings.tsx`: render the layout, spin only inside the data area.

### C. `src/components/storefront/QuickViewDialog.tsx` — silence ref warning
- The warning points to `Dialog`/`DialogContent`. Wrap the offending child in a `<span>` or ensure no ref is forwarded to a non-forwardRef element (likely an icon used as `asChild` trigger). Quick targeted fix; keeps console clean.

### Out of scope
- No backend / RLS changes — policies are already correct.
- No redesign of the profile / orders UI.

## Files to edit
- `src/hooks/useAuth.tsx`
- `src/pages/Profile.tsx`
- `src/pages/MyOrders.tsx`
- `src/pages/ShippingAddress.tsx`
- `src/pages/UserSettings.tsx`
- `src/components/storefront/QuickViewDialog.tsx`

## Expected result
Clicking Profile, My Orders, Shipping Address, or Settings loads the page immediately. The brief spinner only appears in the data card while it fetches, and it always resolves — no more permanent loading / white screen after token refresh or returning to the tab.

