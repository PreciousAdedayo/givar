import { redirect } from "next/navigation";
// The home page is now the dashboard. This keeps old links and redirects working.
export default function Dashboard() { redirect("/"); }
