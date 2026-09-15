import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { Sidebar } from "@/components/admin/Sidebar";
import { TopBar } from "@/components/admin/TopBar";
import { LockBodyScroll } from "@/components/admin/LockBodyScroll";

export default async function CmsLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  if (!user) redirect("/admin");

  return (
    <>
      <LockBodyScroll />
      <TopBar />
      <Sidebar userEmail={user.email} />
      <div className="fixed left-16 top-12 right-0 bottom-0 z-0 flex flex-col overflow-hidden bg-slate-50">
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </>
  );
}
