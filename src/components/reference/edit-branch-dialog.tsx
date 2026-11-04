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
} from "@/components/ui/dialog";

export interface BranchRow {
  id: string;
  branchCode: string;
  branchName: string;
  address: string;
  status: "ACTIVE" | "INACTIVE";
}

function EditBranchForm({ branch, onClose }: { branch: BranchRow; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    branchCode: branch.branchCode,
    branchName: branch.branchName,
    address: branch.address,
    status: branch.status,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/branches/${branch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to update branch.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["admin", "branches"] });
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
        <Label htmlFor="edit-branchCode">Branch Code</Label>
        <Input
          id="edit-branchCode"
          required
          value={form.branchCode}
          onChange={(e) => setForm((f) => ({ ...f, branchCode: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-branchName">Branch Name</Label>
        <Input
          id="edit-branchName"
          required
          value={form.branchName}
          onChange={(e) => setForm((f) => ({ ...f, branchName: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-address">Address</Label>
        <Input
          id="edit-address"
          required
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-branch-status">Status</Label>
        <select
          id="edit-branch-status"
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

export function EditBranchDialog({
  branch,
  onClose,
}: {
  branch: BranchRow | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={branch !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Branch</DialogTitle>
        </DialogHeader>
        {branch && <EditBranchForm key={branch.id} branch={branch} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
