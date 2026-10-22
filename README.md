# Givar.app — Give. Claim. Win.

Next.js 14 (App Router) · TypeScript · Tailwind · Prisma/PostgreSQL · NextAuth · Recharts · Framer Motion

## Run locally
```bash
npm install
cp .env.example .env        # set DATABASE_URL and NEXTAUTH_SECRET (openssl rand -base64 32)
npx prisma migrate dev --name init
npm run dev
npm run make-admin -- you@email.com   # after signing up
```
With no provider keys, everything runs in **dev mode**: test virtual accounts, instant fake deposits, codes/emails/SMS printed to the console. Dev shortcuts are disabled when `NODE_ENV=production`.

## Tests
```bash
npm test                                             # unit tests
TEST_DATABASE_URL=postgresql://... npx prisma db push && npm test   # + money-path integration tests (disposable DB only!)
```

## What changed in this version
- The Prisma schema had invalid one-line blocks (`enum X { A B }`). It is fixed and validates. Run `npx prisma validate` to confirm.
- `/admin` now has its own layout (route groups: `app/(site)` for the website, `app/admin` for admin).
- Notifications: bell, notifications page, email preferences, admin announcements. See `docs/NOTIFICATIONS.md`.
- Admin: analytics filters, user pages, KYC review pages, SEO tools. See `docs/`.

- Security center, chats, support, cancel/renew, personal codes, crypto and USD withdrawals: see `docs/NEW-FEATURES.md`.

## Layout
- `prisma/schema.prisma` – all models. Money is stored in minor units (kobo/cents).
- `lib/claim.ts` – atomic claim + escrow release (row-locked). `lib/refund.ts` – escrow refunds.
- `lib/payout.ts` – Flutterwave bank list, name lookup, transfers, settle/refund.
- `lib/virtual-accounts.ts` – NGN (Flutterwave) / USD (Strowallet, **stub**) account provisioning.
- `app/api/webhooks/*` – Flutterwave, Paystack, Strowallet (**field names guessed**).
- `app/api/cron/draw-contests` – contest draws, expired-giveaway refunds, cleanup (daily via `vercel.json`).
- `app/(site)` – the public website and user app. `app/admin` – the admin area (ADMIN role only), with its own layout.
- `lib/analytics.ts` – filterable analytics queries. `lib/seo.ts`, `lib/seo-audit.ts` – SEO helpers and the audit engine.
- `docs/` – ADMIN-GUIDE, SEO-GUIDE, NOTIFICATIONS, SPACING-AUDIT.
- `lib/notify.ts` – the one function that sends notifications (`notify()`); `lib/notify-rules.ts` – pure rules, unit-tested.
