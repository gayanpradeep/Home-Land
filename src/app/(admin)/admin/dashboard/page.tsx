import { getCurrentUser } from "@/lib/session";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Head Office Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Signed in as {user?.fullName} ({user?.email}).
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        KPI cards, charts and filters land in Phase 4.
      </p>
    </div>
  );
}
