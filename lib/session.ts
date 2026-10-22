import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
/** The ONE way to read who is signed in. A revoked, banned or signed-out-everywhere session returns null. */
export async function getSession() {
  const s = await getServerSession(authOptions);
  return s?.user?.id ? s : null;
}
export const getUserId = async () => (await getSession())?.user.id ?? null;
