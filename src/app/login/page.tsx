import { redirect } from "next/navigation";
import Image from "next/image";
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
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image
            src="/home-lands-logo-tagline.jpg"
            alt="Home Lands"
            width={260}
            height={130}
            priority
            className="h-auto w-56"
          />
          <h1 className="text-xl font-semibold">Admin Dashboard Login</h1>
        </div>
        <LoginForm nextPath={next} />
      </div>
    </div>
  );
}
