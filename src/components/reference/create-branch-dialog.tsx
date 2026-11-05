"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Plus, Building2, Hash, MapPin, Phone } from "lucide-react";

const NAVY = "#1b2a56";
const ORANGE = "#f47321";

const EMPTY_FORM = {
  branchCode: "",
  branchName: "",
  address: "",
  contactPhone: "",
};

export function CreateBranchDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetAndClose() {
    setForm(EMPTY_FORM);
    setError(null);
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: "ACTIVE" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to create branch.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["admin", "branches"] });
      resetAndClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
        Add Branch
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${NAVY}0f`, color: NAVY }}
          >
            <Building2 className="h-5 w-5" />
          </div>
          <DialogTitle className="mt-3">Add Branch</DialogTitle>
          <DialogDescription>
            Register a new branch to the reference list used across the system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="branchCode" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Hash className="h-3.5 w-3.5" style={{ color: ORANGE }} />
                Branch Code
              </Label>
              <Input
                id="branchCode"
                required
                placeholder="e.g. BR21"
                className="rounded-xl"
                value={form.branchCode}
                onChange={(e) => setForm((f) => ({ ...f, branchCode: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="branchName" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                <Building2 className="h-3.5 w-3.5" style={{ color: NAVY }} />
                Branch Name
              </Label>
              <Input
                id="branchName"
                required
                placeholder="e.g. Matale Branch"
                className="rounded-xl"
                value={form.branchName}
                onChange={(e) => setForm((f) => ({ ...f, branchName: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="address" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <MapPin className="h-3.5 w-3.5" style={{ color: NAVY }} />
              Address
            </Label>
            <Input
              id="address"
              required
              placeholder="e.g. 45 Main Street, Matale"
              className="rounded-xl"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contactPhone" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Phone className="h-3.5 w-3.5" style={{ color: ORANGE }} />
              Contact Phone (optional)
            </Label>
            <Input
              id="contactPhone"
              placeholder="e.g. 066 222 3344"
              className="rounded-xl"
              value={form.contactPhone}
              onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
            />
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
              {isSubmitting ? "Creating..." : "Create Branch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
