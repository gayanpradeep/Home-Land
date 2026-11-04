"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

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
          <h1 className="text-xl font-semibold">Activate This Device</h1>
          <p className="text-sm text-muted-foreground">
            Enter the device code and activation secret issued by your administrator.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="deviceCode">Device Code</Label>
                <Input
                  id="deviceCode"
                  autoComplete="off"
                  required
                  value={deviceCode}
                  onChange={(e) => setDeviceCode(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="activationSecret">Activation Secret</Label>
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
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={isSubmitting} className="mt-2">
                {isSubmitting ? "Activating..." : "Activate Device"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
