# What's new (this version)

## For users
- **Personal one-time codes.** When creating a giveaway, choose *One person* or *Multiple people* (and how many), then choose *One shared link or code* or *A unique code for each person*. With unique codes, Givar creates one random code per winner (like `GV-7K2M-QX9P`). Each works once. The host copies, shares (WhatsApp) or downloads the list, and sees which are used under **My giveaways > View codes**. Unused money returns when the giveaway ends.
- **Transactions are clickable.** Tap one for the full detail, **download a PDF receipt**, or *Report a problem* (opens support chat with the reference).
- **Help center + live support chat** (`/help`, `/help/chat`), a real person replies. Chats are near-live (checked every 4 seconds).
- **Community chat** for every giveaway and contest: only the host and the people who claimed/entered. The **Chats** icon sits beside the bell (top bar, phone home header, desktop sidebar). Members are told moderators can review chats.
- **Cancel or renew.** Hosts can cancel a running giveaway (unclaimed money returns; the 5% fee does not) or a contest with no paid entries, and **renew / run again** one that is over. See **My giveaways and contests** (`/manage`).
- **Security center** (`/account/security`): security checkup score, two-factor authentication with an authenticator app and backup codes, a 4-digit **transaction PIN** (required to withdraw; 5 wrong tries lock it 30 minutes), **signed-in devices** with remote sign-out, sign out all other devices, new-device sign-in alerts, other devices signed out after a password change or reset.
- **Withdraw to every Nigerian bank** (searchable list; uses your provider's live list when configured) and **withdraw in US dollars** (US ACH, international wire/SWIFT, or a Nigerian domiciliary account). USD payouts are reviewed and sent by your team.
- **Crypto deposits** (USDT on Tron/BNB/Ethereum, USDC, BTC, ETH) to the dollar wallet, with QR code and network warnings.
- **Invite friends** (`/referrals`): ₦500 bonus to the referrer when a friend makes a first deposit of ₦1,000 or more. Amounts are constants in `lib/referral.ts`.
- **Step-by-step identity verification** with a status timeline.

## For admins
- **Notification analytics:** every announcement records how many users *saw* it and how many *opened* it, with an opens-per-hour chart and lists of who opened, who saw it, and who hasn't.
- **Support inbox** (reply, canned replies, close/reopen) and **Community chats** (read every giveaway/contest chat live, remove messages, mute users, post as Givar Team).
- **Withdrawals** queue for USD (and any pending) payouts: mark as paid, or reject and refund.

## Set up before using
- `npx prisma migrate dev` (new tables and fields).
- Crypto: `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET` (the integration is written from the provider's public docs: test it in their sandbox). Without a key, dev mode shows a fake address and a "simulate payment" button.
- Nigerian payouts: `FLUTTERWAVE_SECRET` (live bank list and transfers).
- The built-in bank list is a fallback. Check bank codes against your provider before going live.

## Honest limits
- Chats update every few seconds by polling, not instantly.
- Two-factor authentication applies to email/phone + password sign-in. Google sign-in relies on Google's own security.
- Contests with paid entries can't be cancelled automatically (entrants must be refunded): the host is sent to support.
- Moderators can read community chats. Users are told so inside every chat. Check local privacy law and mention it in your terms.
- Nothing here has been run against live providers or a real database.
