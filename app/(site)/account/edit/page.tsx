import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import EditForm from "./EditForm";
export const metadata = { title: "Personal information", robots: { index: false } };
export default async function Edit() {
  const userId = await getUserId(); if (!userId) redirect("/auth");
  const me = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return <EditForm name={me.name ?? ""} country={me.country ?? ""} contact={me.email ?? me.phone ?? ""} />;
}
