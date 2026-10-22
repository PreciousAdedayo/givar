# Spacing audit: phone and desktop

**Method.** I searched every page and component for its container, padding and gap classes and compared them, then looked for layouts that break when content or screen size changes. This is a code review plus a real production build. I have **not** looked at the running app on a real phone or monitor, so use the checklist at the bottom before launch.

## Phone findings

| # | Problem | Where | Effect on screen | Fix | Status |
|---|---------|-------|------------------|-----|--------|
| P1 | Side padding was 16px on some pages and 20px on others | 9 pages used `px-4`, 10 used `px-5` (sign-in helpers, KYC, create, claim, contest pages, admin) | Content edge jumps 4px when you move between pages; looks sloppy | One shared `.page` class: 16px sides on every page | Fixed |
| P2 | Four different top and bottom gaps | Home `pt-4 pb-10`, others `py-6`, `py-8`, `py-10` | Page title sits at a different height on every page | `.page`: 24px top and bottom on phones | Fixed |
| P3 | A phantom 96px empty strip at the bottom of pages with no bottom bar | `body` had `pb-24` for the bottom bar, but sign-in and admin pages hide the bar | Blank space and a pointless scroll on sign-in and admin | The spacer now lives inside the bottom bar component, so it only exists when the bar does | Fixed |
| P4 | Cards padded 28px on 12 forms and panels | claim, create, sign-in, contests, KYC, phone, edit, security | On a 360px phone only about 264px was left for content; fields felt cramped | 20px on phones, 24px from 640px up | Fixed |
| P5 | Centred pages forced to full screen height plus the body padding | claim "not found", error pages | Short pages still scrolled | `min-h-[60vh]` inside the page container; the claim "not found" is now a proper 404 page | Fixed |
| P6 | The floating Create button overlaps the last card on short pages | bottom bar | Last button hidden behind the nav | Covered by the 96px spacer in P3 | Fixed |
| P7 | The balance card's header row could wrap awkwardly on 320px phones | home | "Transaction history" pushed under the label | Smaller text and `whitespace-nowrap` on that link (done earlier) | Fixed |

## Desktop findings

| # | Problem | Where | Effect on screen | Fix | Status |
|---|---------|-------|------------------|-----|--------|
| D1 | The top strip (claim box and avatar) was full width while page content was centred | desktop header vs pages on screens wider than about 1500px | Left edges do not line up | Strip content now sits in the same `max-w-6xl` container as the pages | Fixed |
| D2 | The sticky left column on the profile page was taller than short laptop screens | profile page on screens under about 800px tall | Bottom of the column (sign out) unreachable while scrolling | `max-height` of the viewport and its own scroll | Fixed |
| D3 | Pages mixed `px-4`, `px-5` and `lg:px-8` | all pages | Different margins on each page | Shared `.page`: 16px phones, 32px desktop | Fixed |
| D4 | The admin area was drawn inside the website frame, so it had two headers and two sidebars | admin | Doubled navigation, wrong spacing | Admin has its own layout with its own sidebar and no website chrome | Fixed |

## Not checked, still open
- 320px-wide phones (small Android devices) and 200% browser text zoom.
- Tablets between 768 and 1023px use the phone layout with wider containers. It should look fine, but it has not been reviewed.
- Phones in landscape.
- Long names, long email addresses and very large amounts (for example ₦10,000,000) in the balance card and tables.

## Manual test checklist (about 15 minutes)
Test at **360, 390, 768, 1024 and 1440 px** wide.
1. Home, Giveaways, Contests, Wallet, Transactions, Profile, Create, Claim, Sign-in. Check: side margins identical on every page, nothing touching the screen edge, no horizontal scrolling.
2. Phone: scroll each page to the bottom. The last item must be fully visible above the bottom bar. Sign-in and admin must have **no** blank strip at the bottom.
3. Desktop (1440px): the claim box in the top strip lines up with the page content's left edge.
4. Desktop on a short window (height 700px): scroll the profile page and reach Sign out.
5. Admin on phone and desktop: no website sidebar or bottom bar visible; tables scroll sideways inside their cards, not the whole page.
6. Put long text in: a 60-character giveaway title and a ₦10,000,000 amount.
