import { createHash } from "crypto";
export const hashCode = (code: string, userId: string) => createHash("sha256").update(`${code}:${userId}`).digest("hex");
