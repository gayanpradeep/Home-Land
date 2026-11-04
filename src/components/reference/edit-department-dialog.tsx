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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DepartmentRow {
  id: string;
  branchId: string;
  departmentCode: string;
  departmentName: string;
  status: "ACTIVE" | "INACTIVE";
}

interface BranchOption {
  id: string;
  branchName: string;
}

function EditDepartmentForm({
  department,
  onClose,
}: {
  department: DepartmentRow;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    branchId: department.branchId,
    departmentCode: department.departmentCode,
    departmentName: department.departmentName,
    status: department.status,
  });
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/departments/${department.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to update department.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["admin", "departments"] });
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Branch</Label>
        <Select value={form.branchId} onValueChange={(v) => setForm((f) => ({ ...f, branchId: v ?? "" }))}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {branches?.find((b) => b.id === form.branchId)?.branchName ?? "Select a branch"}
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
        <Label htmlFor="edit-departmentCode">Department Code</Label>
        <Input
          id="edit-departmentCode"
          required
          value={form.departmentCode}
          onChange={(e) => setForm((f) => ({ ...f, departmentCode: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-departmentName">Department Name</Label>
        <Input
          id="edit-departmentName"
          required
          value={form.departmentName}
          onChange={(e) => setForm((f) => ({ ...f, departmentName: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-department-status">Status</Label>
        <select
          id="edit-department-status"
          className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "ACTIVE" | "INACTIVE" }))}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditDepartmentDialog({
  department,
  onClose,
}: {
  department: DepartmentRow | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={department !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
        </DialogHeader>
        {department && <EditDepartmentForm key={department.id} department={department} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
