import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./login-form";

const NAVY = "#1b2a56";

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
    <div className="login-shell flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden md:block">
        <Image
          src="/login/login2.webp"
          alt="Home Lands Holding development"
          fill
          priority
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${NAVY}cc 0%, ${NAVY}66 45%, ${NAVY}e6 100%)`,
          }}
        />
        <div className="relative z-10 flex h-full flex-col justify-end p-12 text-white">
          <h2 className="text-3xl font-bold tracking-tight">
            Centralized Customer Rating Management
          </h2>
          <p className="mt-3 max-w-md text-sm text-white/80">
            One place to track customer satisfaction across every branch, department and
            service counter at Home Lands Holding.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-muted/30 p-6 md:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <Image
              src="/home-lands-logo-tagline.png"
              alt="Home Lands"
              width={320}
              height={160}
              priority
              className="h-auto w-72"
            />
            <h1 className="text-xl font-semibold">Admin Dashboard Login</h1>
          </div>
          <LoginForm nextPath={next} />
        </div>
      </div>
    </div>
  );
}
