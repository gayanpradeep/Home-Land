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
} from "@/components/ui/dialog";
import { Pencil, Hash, Building2, MapPin } from "lucide-react";

const NAVY = "#1b2a56";
const ORANGE = "#f47321";

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
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-branchCode" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Hash className="h-3.5 w-3.5" style={{ color: ORANGE }} />
            Branch Code
          </Label>
          <Input
            id="edit-branchCode"
            required
            className="rounded-xl"
            value={form.branchCode}
            onChange={(e) => setForm((f) => ({ ...f, branchCode: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-branchName" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Building2 className="h-3.5 w-3.5" style={{ color: NAVY }} />
            Branch Name
          </Label>
          <Input
            id="edit-branchName"
            required
            className="rounded-xl"
            value={form.branchName}
            onChange={(e) => setForm((f) => ({ ...f, branchName: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-address" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <MapPin className="h-3.5 w-3.5" style={{ color: NAVY }} />
          Address
        </Label>
        <Input
          id="edit-address"
          required
          className="rounded-xl"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-branch-status" className="text-xs font-semibold text-slate-600">
          Status
        </Label>
        <select
          id="edit-branch-status"
          className="h-9 rounded-xl border border-input bg-transparent px-3 text-sm"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "ACTIVE" | "INACTIVE" }))}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl text-white shadow-sm"
          style={{ backgroundColor: NAVY }}
        >
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${NAVY}0f`, color: NAVY }}
          >
            <Pencil className="h-5 w-5" />
          </div>
          <DialogTitle className="mt-3">Edit Branch</DialogTitle>
          <DialogDescription>Update this branch&apos;s details.</DialogDescription>
        </DialogHeader>
        {branch && <EditBranchForm key={branch.id} branch={branch} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
