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
import { Plus, Copy, Check } from "lucide-react";

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
      <DialogTrigger render={<Button />}>
        <Plus className="mr-1.5 h-4 w-4" />
        Register Device
      </DialogTrigger>
      <DialogContent>
        {createdSecret ? (
          <>
            <DialogHeader>
              <DialogTitle>Device Registered</DialogTitle>
              <DialogDescription>
                Write this down now — the activation secret is shown only once and cannot be
                retrieved again.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <Label>Device Code</Label>
                <div className="rounded-lg border bg-muted px-3 py-2 font-mono text-sm">
                  {createdSecret.deviceCode}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label>Activation Secret</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 overflow-x-auto rounded-lg border bg-muted px-3 py-2 font-mono text-xs whitespace-nowrap">
                    {createdSecret.secret}
                  </div>
                  <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter this device code and secret on the kiosk&apos;s activation screen at{" "}
                <span className="font-mono">/rating</span>.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" onClick={resetAndClose}>
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Register Device</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="deviceCode">Device Code</Label>
                <Input
                  id="deviceCode"
                  required
                  autoComplete="off"
                  placeholder="e.g. KIOSK-05"
                  value={form.deviceCode}
                  onChange={(e) => setForm((f) => ({ ...f, deviceCode: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="counterName">Counter Name</Label>
                <Input
                  id="counterName"
                  required
                  placeholder="e.g. Service Counter 02"
                  value={form.counterName}
                  onChange={(e) => setForm((f) => ({ ...f, counterName: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Branch</Label>
                <Select
                  value={form.branchId}
                  onValueChange={(v) => setForm((f) => ({ ...f, branchId: v ?? "", departmentId: "" }))}
                >
                  <SelectTrigger className="w-full">
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
                <Label>Department</Label>
                <Select
                  value={form.departmentId}
                  onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v ?? "" }))}
                  disabled={!form.branchId}
                >
                  <SelectTrigger className="w-full">
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

              {error && <p className="text-sm text-destructive">{error}</p>}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={resetAndClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
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
