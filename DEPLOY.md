# Givar v8 deployment checklist (existing Supabase + Vercel)

## Preserve the existing project
- Keep the existing GitHub repository, Vercel project, Supabase project, `.env`, and `.git` directory. This source archive intentionally excludes secrets, `.git`, `node_modules`, and `.next`.
- Do not create a new database. Do not run `prisma migrate reset`.

## Environment variables
- Keep `DATABASE_URL` pointed at the existing Supabase Session Pooler (port 6543, with `pgbouncer=true` and a suitable `connection_limit`).
- Set `DIRECT_URL` to the existing Supabase direct connection or Session Pooler on port 5432, using the current database password.
- Configure `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, Google OAuth credentials, `ADMIN_EMAILS`, payment-provider secrets, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` as applicable. Never expose the service-role key with a `NEXT_PUBLIC_` prefix.

## Database changes — review before applying
The Prisma schema includes additive v8 additions: three SEO branding URL columns, `CryptoDeposit.payAmount`, two broadcast email counters, and the `AppRelease` and `EmailJob` tables. The project has no committed Prisma migration history and the existing database is not currently managed by Prisma Migrate.

1. From the existing project folder, run `npx prisma validate` and `npx prisma generate`.
2. Generate a SQL diff against the existing database and review it before applying anything:
   `npx prisma migrate diff --from-url "$env:DIRECT_URL" --to-schema-datamodel prisma/schema.prisma --script > prisma-v8-review.sql`
3. Confirm the SQL only adds the intended v8 columns/tables/indexes and does not drop or rename existing objects. If it contains destructive statements or unexpected changes, stop and reconcile the schema first.
4. Only after the diff is confirmed additive, run `npx prisma db push` against the EXISTING Supabase database, then `npx prisma generate`. Never use `--force-reset` or `migrate reset`.

## Supabase Storage
- Create a public bucket named `givar-public`. Set its file-size limit to at least 150 MB.
- Allow `image/jpeg`, `image/png`, `image/webp`, and `application/vnd.android.package-archive`.
- Configure Storage CORS for the production Givar domain.
- Keep the Supabase service-role key server-only.

## Email queue
- Keep `RESEND_API_KEY`, `EMAIL_FROM`, and `CRON_SECRET` configured in Vercel.
- Add GitHub Actions secrets `GIVAR_SITE_URL` (production URL without trailing slash) and `GIVAR_CRON_SECRET` (same value as Vercel `CRON_SECRET`). The included workflow calls `/api/cron/send-emails` every five minutes.

## Payment scope and safeguards
- Paystack handles NGN deposits; Flutterwave handles supported NGN virtual-account/payout flows.
- NOWPayments handles supported USDT/USDC deposits on the networks configured in `lib/crypto.ts`. Only signed, matched, fully paid orders should be credited.
- Strowallet USD virtual-account provisioning is disabled. There is no active Stripe checkout/webhook integration in this source. Do not advertise either as active.
- Test provider sandbox/live webhooks and reconcile wallet ledger entries before accepting real funds.

## APK releases
- APK files are uploaded directly to Supabase Storage using a short-lived signed upload URL.
- Keep the Android application ID and signing certificate identical to the currently distributed app. This code does not automatically verify either value; verify them before publishing.

## Final checks
Run `npx prisma validate`, `npx prisma generate`, `npm test`, and `npm run build` on the Windows development machine. Do not push or deploy if any check fails.
