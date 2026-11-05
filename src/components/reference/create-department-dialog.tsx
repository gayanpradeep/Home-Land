"use client";

import { useState } from "react";
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
import { Plus, Users2, Building2, Hash } from "lucide-react";

const NAVY = "#1b2a56";
const ORANGE = "#f47321";

interface BranchOption {
  id: string;
  branchName: string;
}

const EMPTY_FORM = {
  branchId: "",
  departmentCode: "",
  departmentName: "",
};

export function CreateDepartmentDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: branches } = useQuery<BranchOption[]>({
    queryKey: ["admin", "branches"],
    queryFn: async () => {
      const res = await fetch("/api/admin/branches");
      if (!res.ok) throw new Error("Failed to load branches");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

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
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: "ACTIVE" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to create department.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["admin", "departments"] });
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
        Add Department
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${ORANGE}1a`, color: ORANGE }}
          >
            <Users2 className="h-5 w-5" />
          </div>
          <DialogTitle className="mt-3">Add Department</DialogTitle>
          <DialogDescription>
            Register a new department under a branch.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Building2 className="h-3.5 w-3.5" style={{ color: NAVY }} />
              Branch
            </Label>
            <Select
              value={form.branchId}
              onValueChange={(v) => setForm((f) => ({ ...f, branchId: v ?? "" }))}
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
            <Label htmlFor="departmentCode" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Hash className="h-3.5 w-3.5" style={{ color: ORANGE }} />
              Department Code
            </Label>
            <Input
              id="departmentCode"
              required
              placeholder="e.g. IT"
              className="rounded-xl"
              value={form.departmentCode}
              onChange={(e) => setForm((f) => ({ ...f, departmentCode: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="departmentName" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Users2 className="h-3.5 w-3.5" style={{ color: NAVY }} />
              Department Name
            </Label>
            <Input
              id="departmentName"
              required
              placeholder="e.g. Information Technology"
              className="rounded-xl"
              value={form.departmentName}
              onChange={(e) => setForm((f) => ({ ...f, departmentName: e.target.value }))}
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
              {isSubmitting ? "Creating..." : "Create Department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
