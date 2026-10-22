import "next-auth";
import "next-auth/jwt";
declare module "next-auth" { interface User { id: string } interface Session { user: { id: string; role: string; sid?: string; name?: string | null; email?: string | null } } }
declare module "next-auth/jwt" { interface JWT { id?: string; role?: string; sid?: string; invalid?: boolean } }
