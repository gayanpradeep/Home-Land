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
import { Plus, MessageSquareWarning, Hash } from "lucide-react";

const NAVY = "#1b2a56";
const ORANGE = "#f47321";

const EMPTY_FORM = {
  code: "",
  label: "",
};

export function CreateFeedbackReasonDialog() {
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
      const res = await fetch("/api/admin/feedback-reasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: "ACTIVE" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to create feedback reason.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["admin", "feedbackReasons"] });
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
        Add Reason
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${ORANGE}1a`, color: ORANGE }}
          >
            <MessageSquareWarning className="h-5 w-5" />
          </div>
          <DialogTitle className="mt-3">Add Feedback Reason</DialogTitle>
          <DialogDescription>
            Add an option customers can pick on the kiosk&apos;s reason step after a negative rating.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="code" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Hash className="h-3.5 w-3.5" style={{ color: ORANGE }} />
              Code
            </Label>
            <Input
              id="code"
              required
              placeholder="e.g. LONG_WAIT"
              className="rounded-xl"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Internal identifier stored with each feedback submission. Letters, numbers, dots, dashes and
              underscores only.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="label" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <MessageSquareWarning className="h-3.5 w-3.5" style={{ color: NAVY }} />
              Label shown
            </Label>
            <Input
              id="label"
              required
              placeholder="e.g. Long waiting time"
              className="rounded-xl"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
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
              {isSubmitting ? "Creating..." : "Create Reason"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
