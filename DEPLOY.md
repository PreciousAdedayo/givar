# Deploy checklist (Vercel + Postgres)

1. **Database**: create Postgres (Neon/Supabase/Vercel Postgres). Set `DATABASE_URL`. Run `npx prisma migrate dev --name init` locally, commit `prisma/migrations`, and deploy with `npx prisma migrate deploy` (add it to your build command).
2. **Env vars**: everything in `.env.example`. `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL=https://givar.app`, `CRON_SECRET`.
3. **Providers** (test mode first):
   - Flutterwave: secret key, set webhook URL `/api/webhooks/flutterwave` and the secret hash (`FLUTTERWAVE_SECRET_HASH`).
   - Paystack: secret key, webhook `/api/webhooks/paystack`.
   - Strowallet/Maplerad: implement `usdAccount()` in `lib/virtual-accounts.ts` and match `app/api/webhooks/strowallet` to their docs.
   - Resend (email) and Twilio (SMS). Without them, verification and password reset don't work in production.
4. **Google OAuth**: add `https://givar.app/api/auth/callback/google` as a redirect URI.
5. **First admin**: sign up, then `npm run make-admin -- you@email.com` against the production DB.
6. **Cron**: `vercel.json` runs the draw job daily (Hobby limit). Hourly needs Pro.
7. **Before real money**: run a test-mode deposit, claim, withdrawal (success AND failure), and each webhook end to end. Add error monitoring (Sentry) and DB backups. Confirm licensing/KYC requirements with your providers.

## Added in this version
- **Run `npx prisma validate` first.** Then `npx prisma migrate dev --name init` (new database) or `npx prisma migrate dev --name admin_seo_kyc` (existing). New tables: KycDocument, SeoPage, SeoSettings, Notification, NotificationPref, and new fields on KycSubmission.
- **KYC documents are stored in Postgres** (about 2 files of up to 1.8 MB per submission). Watch database size and back it up. Consider moving to private object storage later.
- **Request size**: KYC uploads are limited to 1.8 MB per file to stay under typical 4.5 MB request limits.
- After deploying: open Admin > SEO > Site settings, add your Search Console code, then submit `/sitemap.xml`.

## Added in v7
- New tables: PersonalCode, Broadcast, ChatMessage, ChatRead, SupportThread, LoginSession, CryptoDeposit, ReferralReward (and new fields on User, Giveaway, Contest, Notification). Run `npx prisma migrate dev --name v7`.
- New env vars: `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`. Register `/api/webhooks/crypto` as the provider's IPN URL.
- Existing signed-in users stay signed in; new sign-ins create tracked sessions.
