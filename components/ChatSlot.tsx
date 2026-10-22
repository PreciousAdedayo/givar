import { getUserId } from "@/lib/session";
import { unreadChatCount } from "@/lib/chat";
import ChatIcon from "./ChatIcon";
/** Server wrapper: renders nothing for visitors who are not signed in. */
export default async function ChatSlot() {
  const userId = await getUserId(); if (!userId) return null;
  return <ChatIcon initial={await unreadChatCount(userId).catch(() => 0)} />;
}
