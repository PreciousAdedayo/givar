/** ADMIN_EMAILS="you@example.com, other@example.com" (comma separated). Pure, so it can be unit-tested. */
export const parseAdminEmails = (v?: string | null) => (v ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
export const isListedAdmin = (email: string | null | undefined, list: string[]) => !!email && list.includes(email.trim().toLowerCase());
