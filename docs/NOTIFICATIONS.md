# Notifications

## What users see
- A **bell** with an unread count: top bar on desktop, home header on phones, and a "Notifications" item in the desktop sidebar and the profile page. The count refreshes every minute and whenever the tab is focused.
- **/notifications**: all or unread, grouped by day, tap one to mark it read and jump to the right page, "Mark all as read".
- **/notifications/settings**: choose which emails to receive (money, your giveaways, contests, news). KYC and security emails are always sent.

## What triggers one
| Event | Who is told | Email by default |
|-------|-------------|------------------|
| Giveaway claimed | The winner ("You won ₦2,000") | Yes (money) |
| Giveaway claimed | The creator, as ONE entry that updates ("12 of 50 claimed") | Only when fully claimed, and only if they opted in |
| Deposit by card or transfer, or money into a virtual account | The user | Yes (money) |
| Withdrawal sent or failed (money returned) | The user | Yes (money) |
| Unclaimed giveaway money returned | The creator | Only if they opted in |
| Contest drawn | The winner and the host | Yes (contests) |
| KYC documents received / approved / rejected (with reason) | The user | Approved and rejected: always |
| Password changed or reset | The user | Always |
| Welcome | New users | No |
| Admin announcement | Chosen group | No (in-app only) |

## Design notes
- A failed notification **never** breaks the real action: `notify()` swallows its own errors.
- Repeated events (many claims) update one row, so a popular giveaway doesn't bury the list or flood email.
- Links are checked to be paths on this site, so a notification can't redirect anywhere else.

## Not built
- **Push notifications** (phone lock screen) and **SMS**. These need a service worker plus keys, or an SMS provider.
- **Live updates** without waiting up to a minute. This would need websockets or server-sent events.
- Notifications are not deleted automatically. Add a clean-up (for example, delete read ones after 90 days) to the daily cron job when volume grows.
