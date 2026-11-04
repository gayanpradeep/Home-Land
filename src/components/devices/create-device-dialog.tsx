"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Copy, Check, Smartphone, Building2, Users2, KeyRound, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const NAVY = "#1b2a56";
const ORANGE = "#f47321";

interface BranchOption {
  id: string;
  branchName: string;
}

interface DepartmentOption {
  id: string;
  branchId: string;
  departmentName: string;
}

const EMPTY_FORM = {
  deviceCode: "",
  counterName: "",
  branchId: "",
  departmentId: "",
};

export function CreateDeviceDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<{ deviceCode: string; secret: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: branches } = useQuery<BranchOption[]>({
    queryKey: ["admin", "branches"],
    queryFn: async () => {
      const res = await fetch("/api/admin/branches");
      if (!res.ok) throw new Error("Failed to load branches");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: departments } = useQuery<DepartmentOption[]>({
    queryKey: ["admin", "departments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/departments");
      if (!res.ok) throw new Error("Failed to load departments");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredDepartments = useMemo(
    () => (departments ?? []).filter((d) => d.branchId === form.branchId),
    [departments, form.branchId],
  );

  function resetAndClose() {
    setForm(EMPTY_FORM);
    setError(null);
    setCreatedSecret(null);
    setCopied(false);
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to register device.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["admin", "devices"] });
      setCreatedSecret({ deviceCode: data.device.deviceCode, secret: data.activationSecret });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!createdSecret) return;
    await navigator.clipboard.writeText(createdSecret.secret);
    setCopied(true);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetAndClose();
        else setOpen(true);
      }}
    >
      <DialogTrigger render={<Button className="shadow-sm" />}>
        <Plus className="mr-1.5 h-4 w-4" />
        Register Device
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {createdSecret ? (
          <>
            <DialogHeader>
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${ORANGE}1a`, color: ORANGE }}
              >
                <ShieldCheck className="h-5 w-5" />
              </div>
              <DialogTitle className="mt-3">Device Registered</DialogTitle>
              <DialogDescription>
                Write this down now — the activation secret is shown only once and cannot be
                retrieved again.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Device Code
                </Label>
                <div
                  className="rounded-xl border px-3.5 py-2.5 font-mono text-sm font-medium"
                  style={{ borderColor: `${NAVY}1f`, color: NAVY, backgroundColor: `${NAVY}08` }}
                >
                  {createdSecret.deviceCode}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Activation Secret
                </Label>
                <div className="flex items-start gap-2">
                  <div
                    className="min-w-0 flex-1 rounded-xl border px-3.5 py-2.5 font-mono text-xs break-all"
                    style={{ borderColor: `${NAVY}1f`, color: NAVY, backgroundColor: `${NAVY}08` }}
                  >
                    {createdSecret.secret}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 rounded-xl"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <p className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
                Enter this device code and secret on the kiosk&apos;s activation screen at{" "}
                <span className="font-mono font-medium text-slate-700">/rating</span>.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                onClick={resetAndClose}
                className="w-full text-white sm:w-auto"
                style={{ backgroundColor: NAVY }}
              >
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${NAVY}0f`, color: NAVY }}
              >
                <Smartphone className="h-5 w-5" />
              </div>
              <DialogTitle className="mt-3">Register Device</DialogTitle>
              <DialogDescription>
                Assign a kiosk tablet to a branch, department and counter.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="deviceCode" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <KeyRound className="h-3.5 w-3.5" style={{ color: ORANGE }} />
                    Device Code
                  </Label>
                  <Input
                    id="deviceCode"
                    required
                    autoComplete="off"
                    placeholder="KIOSK-05"
                    className="rounded-xl"
                    value={form.deviceCode}
                    onChange={(e) => setForm((f) => ({ ...f, deviceCode: e.target.value }))}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="counterName" className="text-xs font-semibold text-slate-600">
                    Counter Name
                  </Label>
                  <Input
                    id="counterName"
                    required
                    placeholder="Counter 02"
                    className="rounded-xl"
                    value={form.counterName}
                    onChange={(e) => setForm((f) => ({ ...f, counterName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Building2 className="h-3.5 w-3.5" style={{ color: NAVY }} />
                  Branch
                </Label>
                <Select
                  value={form.branchId}
                  onValueChange={(v) => setForm((f) => ({ ...f, branchId: v ?? "", departmentId: "" }))}
                >
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue>
                      {form.branchId
                        ? (branches?.find((b) => b.id === form.branchId)?.branchName ?? "Select a branch")
                        : "Select a branch"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold",
                    form.branchId ? "text-slate-600" : "text-slate-400",
                  )}
                >
                  <Users2 className="h-3.5 w-3.5" style={{ color: form.branchId ? ORANGE : "#94a3b8" }} />
                  Department
                </Label>
                <Select
                  value={form.departmentId}
                  onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v ?? "" }))}
                  disabled={!form.branchId}
                >
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue>
                      {form.departmentId
                        ? (filteredDepartments.find((d) => d.id === form.departmentId)?.departmentName ??
                          "Select a department")
                        : form.branchId
                          ? "Select a department"
                          : "Select a branch first"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDepartments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.departmentName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
                  {error}
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" className="rounded-xl" onClick={resetAndClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl text-white shadow-sm"
                  style={{ backgroundColor: NAVY }}
                >
                  {isSubmitting ? "Registering..." : "Register Device"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
