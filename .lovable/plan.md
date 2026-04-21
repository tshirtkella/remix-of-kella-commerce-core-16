

## Goal
Strengthen validation on the **Bulk Order Form** so users cannot submit fake/invalid information. Apply Bangladeshi phone format, strict email format, and stricter rules for names, quantities, categories, custom-print/tag details, and purpose.

## Validation Rules

**Phone (Bangladeshi)**
- Accepted formats: `01XXXXXXXXX` (11 digits) or `+8801XXXXXXXXX` / `008801XXXXXXXXX`
- Operator prefix must be valid: `013`–`019` (i.e., second digit 3–9)
- Regex: `/^(?:\+?880|0)1[3-9]\d{8}$/`
- Auto-strip spaces/dashes before validation; show example "01XXXXXXXXX or +8801XXXXXXXXX"

**Email**
- Strict RFC-ish regex (not just zod's loose check): `/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/`
- Lowercase + trim
- Block obvious throwaway/typo domains: `test.com`, `example.com`, `mailinator.com`, `tempmail`, `10minutemail`, plus reject if domain has no dot or TLD < 2 chars

**Full name**
- Min 3 chars, max 60
- Letters/spaces/`.`/`'`/`-` only (supports Bangla unicode range too): `/^[\p{L}\s.'-]{3,60}$/u`
- Reject if all same character (e.g. "aaaa") or contains digits

**Quantity range** — must be one of the 5 predefined options (already enforced).

**Product categories** — at least 1 required; if "Other (Custom)" selected, additional notes must be ≥10 chars.

**Custom print / tag**
- If "Yes" selected → details textarea becomes required, min 10 chars, max 500.

**Purpose**
- One of 4 options required.
- If "Other" → `purpose_other` required, min 5 chars, max 200.

**Additional notes** — optional, max 1000 chars.

**Anti-spam**
- Honeypot hidden field `website` — if filled, silently reject.
- Min form fill time: reject submissions completed in < 3 seconds (timestamp captured on dialog open).

## UX Changes
- Inline field-level error messages (red text under each input) instead of only a top alert + toast.
- Phone input gets `inputMode="tel"` and a placeholder `01XXXXXXXXX`.
- Email input lowercases on blur.
- Submit button stays disabled until required fields pass basic shape checks.
- Top-level Alert kept for server/network errors only.

## Files to Edit
- `src/components/storefront/BulkOrderDialog.tsx`
  - Replace the single zod schema with a stricter schema using the regexes above.
  - Track per-field errors in a `Record<string, string>` state; clear on change.
  - Add honeypot input + open-timestamp ref.
  - Render inline errors beneath each control.
  - Normalize phone (strip non-digits except leading `+`) and email (trim+lowercase) before validation.

## Backend
- No schema changes needed — `bulk_orders` columns already accept these fields.
- Optional hardening (defer unless requested): add a Postgres CHECK constraint or trigger validating phone regex and email format server-side. **Skipping** for this iteration since RLS already gates writes and validation lives client-side; can add later if spam appears.

## Out of Scope
- OTP phone verification before submit (heavier flow; ask separately if wanted).
- CAPTCHA integration.

