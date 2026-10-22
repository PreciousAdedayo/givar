import Link from "next/link";
import { LifeBuoy, Mail, MessageCircle } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import HelpSearch from "./HelpSearch";

export const metadata = { title: "Help and support", description: "Get help with your Givar account, giveaways, withdrawals and verification.", robots: { index: false } };
const FAQ = [
  { cat: "Money", q: "How do I add money?", a: "Open Wallet, then Add money. Pay by card, bank transfer or USSD in naira, or deposit crypto to your dollar wallet. You can also send a transfer to your personal Givar account number from any bank." },
  { cat: "Money", q: "How long do withdrawals take?", a: "Naira withdrawals to Nigerian banks are usually instant. US dollar withdrawals are checked and sent by our team within 1 to 2 business days. You need a transaction PIN and verified identity." },
  { cat: "Money", q: "Which banks can I withdraw to?", a: "All major Nigerian banks and popular apps like Opay, Kuda, Moniepoint and PalmPay. In dollars we send to US banks (ACH), international banks (wire/SWIFT) and Nigerian domiciliary accounts." },
  { cat: "Money", q: "Which cryptocurrencies can I deposit?", a: "USDT (Tron, BNB Chain, Ethereum), USDC, Bitcoin and Ether. Always send the exact coin on the network shown, or the money can be lost. Deposits are credited to your dollar wallet when confirmed." },
  { cat: "Money", q: "A transaction is wrong or missing. What do I do?", a: "Open the transaction from your history and choose Report a problem. We get the reference automatically. You can also download a PDF receipt from the same page." },
  { cat: "Giveaways", q: "How does a giveaway work?", a: "You choose an amount and number of winners. The money is locked in escrow, you get a link and a code, and winners are paid the moment they claim. Unclaimed money returns to you when it ends." },
  { cat: "Giveaways", q: "Can I cancel or renew a giveaway?", a: "Yes. Open My giveaways. You can cancel one that is still running (unclaimed money comes back), and renew one that has ended with the same settings." },
  { cat: "Giveaways", q: "What is the community chat?", a: "Every giveaway and contest has a private chat for the host and the people who took part. Find it under Chats. Givar moderators can review chats to keep them safe." },
  { cat: "Contests", q: "How are contest winners chosen?", a: "A winner is drawn at random from all entries when the contest ends. The host and the winner can then contact each other from the contest page." },
  { cat: "Verification", q: "Why do I need to verify my identity?", a: "It keeps everyone safe and is required to withdraw. Go to Profile, then Identity verification, and upload your ID and a selfie. Reviews usually finish within a day." },
  { cat: "Verification", q: "My verification was rejected. What now?", a: "Open the verification page to see the reason, then submit again with clearer, uncropped photos where your name and photo are readable." },
  { cat: "Security", q: "How do I protect my account?", a: "Turn on two-factor authentication, set a transaction PIN, and use a password you don't use elsewhere. Check Security for devices signed in to your account and sign out any you don't know." },
  { cat: "Security", q: "I lost my phone with my authenticator app.", a: "Use one of your backup codes to sign in, then turn two-factor off and on again. If you have no backup codes, chat with us and we will verify you." },
  { cat: "Security", q: "I think someone else is using my account.", a: "Change your password now, then sign out all other devices from Security. Chat with us straight away and we will help secure it." },
];
export default async function Help() {
  const s = await getSession();
  const open = s ? await prisma.supportThread.findFirst({ where: { userId: s.user.id, status: "OPEN" }, select: { id: true } }) : null;
  return (
    <main className="page max-w-3xl space-y-6">
      <div><h1 className="text-3xl font-bold">How can we help?</h1><p className="mt-1 text-[var(--mut)]">Find an answer fast, or talk to a person.</p></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={s ? "/help/chat" : "/auth"} className="grad-brand shadow-glow flex items-center gap-4 rounded-2xl p-5"><MessageCircle size={28} aria-hidden /><span><b className="block text-lg">{open ? "Continue your chat" : "Chat with support"}</b><span className="text-sm">A real person replies, usually within a few hours.</span></span></Link>
        <a href="mailto:support@givar.app" className="glass flex items-center gap-4 rounded-2xl p-5"><Mail size={28} aria-hidden /><span><b className="block text-lg">Email us</b><span className="text-sm text-[var(--mut)]">support@givar.app</span></span></a>
      </div>
      <HelpSearch items={FAQ} />
      <p className="flex items-center gap-2 text-xs text-[var(--mut)]"><LifeBuoy size={14} aria-hidden />We are not online 24 hours a day. Leave a message and we will reply as soon as we can. Never share your password or PIN with anyone, including us.</p>
    </main>
  );
}
