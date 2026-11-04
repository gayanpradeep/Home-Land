import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AdminHeader } from "@/components/layout/admin-header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/admin/dashboard");
  }

  if (user.userType !== "ADMIN") {
    redirect("/rating");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminHeader fullName={user.fullName} />
      {children}
    </div>
  );
}
