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

interface DepartmentOption {
  id: string;
  branchId: string;
  departmentName: string;
}

const EMPTY_FORM = {
  fullName: "",
  username: "",
  password: "",
  userType: "BRANCH" as "ADMIN" | "BRANCH",
  branchId: "",
  departmentId: "",
};

export function CreateUserDialog() {
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
        body: JSON.stringify({
          fullName: form.fullName,
          username: form.username,
          password: form.password,
          userType: form.userType,
          branchId: form.userType === "BRANCH" ? form.branchId : undefined,
          departmentId: form.userType === "BRANCH" ? form.departmentId : undefined,
          status: "ACTIVE",
        }),
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-1.5 h-4 w-4" />
        Add User
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              required
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              required
              autoComplete="off"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Temporary Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              At least 8 characters. The user must change it on first login.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Account Type</Label>
            <Select
              value={form.userType}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, userType: v as "ADMIN" | "BRANCH", branchId: "", departmentId: "" }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>{form.userType === "ADMIN" ? "Admin (Head Office)" : "Branch User"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin (Head Office)</SelectItem>
                <SelectItem value="BRANCH">Branch User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.userType === "BRANCH" && (
            <>
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
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
