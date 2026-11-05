"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Smartphone, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const NAVY = "#1b2a56";
const ORANGE = "#f47321";

export function DeviceActivation() {
  const router = useRouter();
  const [deviceCode, setDeviceCode] = useState("");
  const [activationSecret, setActivationSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/device/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceCode, activationSecret }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to activate this device.");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
          <h2 className="text-3xl font-bold tracking-tight">Device Setup</h2>
          <p className="mt-3 max-w-md text-sm text-white/80">
            Activate this tablet once to link it to its branch, department and counter —
            it will then stay signed in to collect customer ratings.
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
            <h1 className="text-xl font-semibold">Activate This Device</h1>
            <p className="text-sm text-muted-foreground">
              Enter the device code and activation secret issued by your administrator.
            </p>
          </div>

          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="deviceCode"
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"
                  >
                    <Smartphone className="h-3.5 w-3.5" style={{ color: NAVY }} />
                    Device Code
                  </Label>
                  <Input
                    id="deviceCode"
                    autoComplete="off"
                    required
                    value={deviceCode}
                    onChange={(e) => setDeviceCode(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="activationSecret"
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"
                  >
                    <KeyRound className="h-3.5 w-3.5" style={{ color: ORANGE }} />
                    Activation Secret
                  </Label>
                  <div className="relative">
                    <Input
                      id="activationSecret"
                      type={showSecret ? "text" : "password"}
                      autoComplete="off"
                      required
                      value={activationSecret}
                      onChange={(e) => setActivationSecret(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((v) => !v)}
                      className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label={showSecret ? "Hide activation secret" : "Show activation secret"}
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {error && (
                  <p className="border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 text-white shadow-sm"
                  style={{ backgroundColor: NAVY }}
                >
                  {isSubmitting ? "Activating..." : "Activate Device"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
