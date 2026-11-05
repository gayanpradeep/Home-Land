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
import { Plus, UserPlus, User, KeyRound, Lock } from "lucide-react";

const NAVY = "#1b2a56";
const ORANGE = "#f47321";

const EMPTY_FORM = {
  fullName: "",
  username: "",
  password: "",
};

export function CreateUserDialog() {
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
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: "ACTIVE" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to create user.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
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
        Add User
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${NAVY}0f`, color: NAVY }}
          >
            <UserPlus className="h-5 w-5" />
          </div>
          <DialogTitle className="mt-3">Create Admin User</DialogTitle>
          <DialogDescription>
            Add a new account with access to the admin dashboard.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <User className="h-3.5 w-3.5" style={{ color: NAVY }} />
              Full Name
            </Label>
            <Input
              id="fullName"
              required
              autoComplete="off"
              placeholder="e.g. Nimal Perera"
              className="rounded-xl"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="username" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <KeyRound className="h-3.5 w-3.5" style={{ color: ORANGE }} />
              Username
            </Label>
            <Input
              id="username"
              required
              autoComplete="off"
              placeholder="e.g. nimal.perera"
              className="rounded-xl"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Lock className="h-3.5 w-3.5" style={{ color: ORANGE }} />
              Temporary Password
            </Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="rounded-xl"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              At least 8 characters. The user must change it on first login.
            </p>
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
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
