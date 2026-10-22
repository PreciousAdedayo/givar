import { getUserId } from "@/lib/session";
import { unreadCount } from "@/lib/notify";
import NotificationBell from "./NotificationBell";
/** Server wrapper: renders nothing for visitors who are not signed in. */
export default async function BellSlot() {
  const userId = await getUserId();
  if (!userId) return null;
  return <NotificationBell initial={await unreadCount(userId).catch(() => 0)} />;
}
