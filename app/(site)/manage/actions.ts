"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/session";
import { cancelContestAsHost, cancelGiveawayAsHost, type Outcome } from "@/lib/manage";

const done = (r: Outcome, back: string) => { revalidatePath("/manage"); revalidatePath(back); redirect(`/manage?${r.ok ? "ok" : "err"}=${encodeURIComponent(r.ok ? r.message : r.error)}`); };
export async function cancelGiveaway(id: string) { const u = await getUserId(); if (!u) redirect("/auth"); done(await cancelGiveawayAsHost(u, id), "/giveaways"); }
export async function cancelContest(id: string) { const u = await getUserId(); if (!u) redirect("/auth"); done(await cancelContestAsHost(u, id), "/contests"); }
