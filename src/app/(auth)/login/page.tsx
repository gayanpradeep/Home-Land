import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const { next } = await searchParams;

  if (user) {
    redirect(user.role === "HEAD_OFFICE_ADMIN" ? "/admin/dashboard" : "/rate");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
            HL
          </div>
          <h1 className="text-xl font-semibold">Home Lands</h1>
          <p className="text-sm text-muted-foreground">Customer Rating Management System</p>
        </div>
        <LoginForm nextPath={next} />
      </div>
    </div>
  );
}
