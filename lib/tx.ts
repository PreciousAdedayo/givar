import type { TxType } from "@prisma/client";
import { ArrowDownLeft, ArrowUpRight, Gift, UserPlus, Lock, Receipt, Ticket, Trophy, Undo2, type LucideIcon } from "lucide-react";
/** How each ledger entry is shown: label, icon, and whether it adds to (credit) or takes from the balance. */
export const txMeta: Record<TxType, { label: string; icon: LucideIcon; credit: boolean }> = {
  DEPOSIT: { label: "Money added", icon: ArrowDownLeft, credit: true },
  WITHDRAWAL: { label: "Withdrawal", icon: ArrowUpRight, credit: false },
  ESCROW_LOCK: { label: "Giveaway funded", icon: Lock, credit: false },
  ESCROW_RELEASE: { label: "Giveaway refund", icon: Undo2, credit: true },
  CLAIM_CREDIT: { label: "Giveaway won", icon: Gift, credit: true },
  CONTEST_ENTRY: { label: "Contest entry", icon: Ticket, credit: false },
  CONTEST_PRIZE: { label: "Contest prize", icon: Trophy, credit: true },
  FEE: { label: "Service fee", icon: Receipt, credit: false },
  REFERRAL_BONUS: { label: "Referral bonus", icon: UserPlus, credit: true },
};
const all = Object.keys(txMeta) as TxType[];
export const CREDIT_TYPES = all.filter((t) => txMeta[t].credit);
export const DEBIT_TYPES = all.filter((t) => !txMeta[t].credit);
