import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      <Sidebar workspaceName={session.name ?? session.email} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar
          userName={session.name ?? session.email}
          workspaceId={session.workspaceId}
        />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
