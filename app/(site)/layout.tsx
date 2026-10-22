import AppShell from "@/components/AppShell";
import BottomNav from "@/components/BottomNav";
import DesktopHeader from "@/components/DesktopHeader";
import Sidebar from "@/components/Sidebar";
import Tracker from "@/components/Tracker";

/** The public website + user app. The admin area has its own separate layout (app/admin). */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell sidebar={<Sidebar />} header={<DesktopHeader />}>{children}</AppShell>
      <BottomNav />
      <Tracker />
    </>
  );
}
