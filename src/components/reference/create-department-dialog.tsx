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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-1.5 h-4 w-4" />
        Add Department
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Department</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Branch</Label>
            <Select
              value={form.branchId}
              onValueChange={(v) => setForm((f) => ({ ...f, branchId: v ?? "" }))}
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
            <Label htmlFor="departmentCode">Department Code</Label>
            <Input
              id="departmentCode"
              required
              placeholder="e.g. IT"
              value={form.departmentCode}
              onChange={(e) => setForm((f) => ({ ...f, departmentCode: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="departmentName">Department Name</Label>
            <Input
              id="departmentName"
              required
              placeholder="e.g. Information Technology"
              value={form.departmentName}
              onChange={(e) => setForm((f) => ({ ...f, departmentName: e.target.value }))}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
