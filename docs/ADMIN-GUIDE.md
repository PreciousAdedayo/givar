# Admin guide

Make yourself an admin: sign up, then run `npm run make-admin -- you@email.com` against your database and sign in again. Admin lives at `/admin` and has its **own** layout. It does not show the website's navigation. Use "View website" in the sidebar to go back.

| Section | What it does |
|---------|--------------|
| Overview | What needs attention (pending KYC, pending withdrawals, failed webhooks, flagged giveaways), headline numbers, 14-day trend |
| Analytics | Filters: date range (7 days to 12 months, month-to-date, custom), group by day, week or month, traffic source, country, currency. Compares with the previous period |
| Users | Search and filter, then open any user for profile, wallets, KYC history, transactions; ban or unban |
| KYC reviews | Queue with tabs. Open a submission to see the documents, the details, automatic checks, and **Approve** or **Reject with a reason** (the user is emailed) |
| Giveaways, Contests, Transactions | Searchable lists with filters and paging. Flag or cancel and refund a giveaway |
| Notifications | Send an in-app announcement to everyone, verified users, users not yet verified, or one person. See what the system sent this week |
| SEO tools | See `SEO-GUIDE.md` |
| Logs | System events (failed webhooks, errors) and the audit log of everything admins did |

## KYC review workflow
1. Open **KYC reviews**. The oldest pending case is first.
2. Open the case. Check the ID photo and the selfie, then the automatic checks (name matches account, over 18, both documents present, ID not used on another account, phone verified).
3. **Approve**: the user becomes verified and can withdraw. **Reject**: pick a reason (and add details); the user sees it and can resubmit. Mistakes can be undone with **Re-open**.
4. Only the first decision counts, so two admins cannot overwrite each other.
5. Every approval, rejection and every time a document is opened is written to the audit log.

## Things to know
- **The full BVN, NIN or ID number is never stored**, only the last four digits and a one-way hash. Admins review the photo and the details, not a provider lookup. Checking BVNs against a provider is not built.
- **ID photos are kept in your database** (private, never public, served to admins only, never cached). That is sensitive personal data. Before launch: encrypt database backups, decide how long to keep rejected and approved documents, restrict who gets admin, and check your data-protection duties (NDPR in Nigeria, GDPR/UK GDPR if you serve people there).
- **Analytics times are UTC.** Visits are counted by our own tracker and are indicative.
- Large exports (CSV) are not built yet.
