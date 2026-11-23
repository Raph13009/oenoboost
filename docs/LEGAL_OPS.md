# Legal / RGPD — operational checklist (OenoBoost)

Internal guide for handling access, export and account-deletion requests.
Not legal advice. Contact for requests is hardcoded: `chevalier.ho48@gmail.com`
(`apps/web/content/legal/constants.ts` — no Vercel env required).

## When a request arrives

1. Confirm the request email matches (or clearly owns) the OenoBoost account email.
2. Ask for account email + nature of request if unclear: **access**, **export**, or **deletion**.
3. Log the request date (for the 30 business-day target on personal data in OenoBoost).
4. Never promise erasure of Stripe accounting / payment archives.

## Personal data locations (app)

| Store | What to handle on deletion |
| --- | --- |
| Supabase Auth (`auth.users`) | Delete auth user after app data purge |
| `public.users` | Profile row (email, name, plan, XP…) |
| `public.tasting_sheets` | Tasting records |
| `public.favorites` | Favourites |
| `public.quiz_sessions` / `public.quiz_answers` | Quiz history |
| `public.user_daily_question_log` | Daily quiz log |
| `public.user_aop_notes` | Private AOP notes |
| `public.subscriptions` | Keep Stripe IDs / status as needed for billing history; do not claim Stripe records are wiped |
| Stripe Dashboard | Customer / invoices remain under Stripe retention; cancel active subscription if still open |

Browser-only: tasting draft in `sessionStorage` (`oenoboost-tasting-draft-v1`) disappears with the session; no server action required.

## Suggested deletion order

1. Cancel active Stripe subscription if any.
2. Delete child rows by `user_id` (tasting, favorites, quiz, daily log, AOP notes).
3. Soft-handle or retain `subscriptions` row for reconciliation if useful; anonymise `user_id` link only if safe for your process.
4. Delete `public.users` row.
5. Delete Supabase Auth user (`auth.admin.deleteUser`).
6. Confirm to the requester: personal data in OenoBoost removed; Stripe billing records may remain as required by law / Stripe.

CMS helpers: `apps/cms` user delete/deactivate do **not** fully sync Auth + all child tables — prefer an explicit checklist or scripted admin procedure until automated wipe exists.

## Access / export

Until self-serve export exists, compile a reasonable export (profile fields + tasting sheets + favourites summary) from Supabase and send securely to the verified email.

## Contact email

Hardcoded in the app as `LEGAL_PUBLISHER.email` / `getAccountDeleteEmail()`.
Change that constant if Hortense’s contact address changes — no dashboard step.
