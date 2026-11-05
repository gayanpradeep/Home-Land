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
import { Pencil, Hash, MessageSquareWarning } from "lucide-react";

const NAVY = "#1b2a56";
const ORANGE = "#f47321";

export interface FeedbackReasonRow {
  id: string;
  code: string;
  label: string;
  status: "ACTIVE" | "INACTIVE";
}

function EditFeedbackReasonForm({
  reason,
  onClose,
}: {
  reason: FeedbackReasonRow;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    code: reason.code,
    label: reason.label,
    status: reason.status,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/feedback-reasons/${reason.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to update feedback reason.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["admin", "feedbackReasons"] });
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
        <Label htmlFor="edit-reasonCode" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <Hash className="h-3.5 w-3.5" style={{ color: ORANGE }} />
          Code
        </Label>
        <Input
          id="edit-reasonCode"
          required
          className="rounded-xl"
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-reasonLabel" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <MessageSquareWarning className="h-3.5 w-3.5" style={{ color: NAVY }} />
          Label shown on kiosk
        </Label>
        <Input
          id="edit-reasonLabel"
          required
          className="rounded-xl"
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="edit-reason-status" className="text-xs font-semibold text-slate-600">
          Status
        </Label>
        <select
          id="edit-reason-status"
          className="h-9 rounded-xl border border-input bg-transparent px-3 text-sm"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "ACTIVE" | "INACTIVE" }))}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Inactive reasons stop appearing on the kiosk but stay on past feedback.
        </p>
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

export function EditFeedbackReasonDialog({
  reason,
  onClose,
}: {
  reason: FeedbackReasonRow | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={reason !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${ORANGE}1a`, color: ORANGE }}
          >
            <Pencil className="h-5 w-5" />
          </div>
          <DialogTitle className="mt-3">Edit Feedback Reason</DialogTitle>
          <DialogDescription>Update this reason&apos;s code, label or status.</DialogDescription>
        </DialogHeader>
        {reason && <EditFeedbackReasonForm key={reason.id} reason={reason} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
