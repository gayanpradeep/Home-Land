"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CreateBranchDialog } from "@/components/reference/create-branch-dialog";
import { CreateDepartmentDialog } from "@/components/reference/create-department-dialog";
import { EditBranchDialog, type BranchRow } from "@/components/reference/edit-branch-dialog";
import { EditDepartmentDialog, type DepartmentRow } from "@/components/reference/edit-department-dialog";
import { Pencil, Trash2 } from "lucide-react";

type DeleteTarget =
  | { kind: "branch"; id: string; label: string }
  | { kind: "department"; id: string; label: string };

export function ReferenceManagement() {
  const queryClient = useQueryClient();
  const [editBranch, setEditBranch] = useState<BranchRow | null>(null);
  const [editDepartment, setEditDepartment] = useState<DepartmentRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const branchesQuery = useQuery<BranchRow[]>({
    queryKey: ["admin", "branches"],
    queryFn: async () => {
      const res = await fetch("/api/admin/branches");
      if (!res.ok) throw new Error("Failed to load branches");
      return res.json();
    },
  });

  const departmentsQuery = useQuery<DepartmentRow[]>({
    queryKey: ["admin", "departments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/departments");
      if (!res.ok) throw new Error("Failed to load departments");
      return res.json();
    },
  });

  const branchNameById = new Map((branchesQuery.data ?? []).map((b) => [b.id, b.branchName]));

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const url =
        deleteTarget.kind === "branch"
          ? `/api/admin/branches/${deleteTarget.id}`
          : `/api/admin/departments/${deleteTarget.id}`;
      const res = await fetch(url, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error ?? "Unable to delete.");
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["admin", deleteTarget.kind === "branch" ? "branches" : "departments"],
      });
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reference Data</h1>
        <p className="text-sm text-muted-foreground">
          Manage the branch and department master list used throughout the system.
        </p>
      </div>

      <Tabs defaultValue="branches">
        <TabsList>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="branches" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <CreateBranchDialog />
          </div>
          <div className="rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Branch Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchesQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      Loading branches...
                    </TableCell>
                  </TableRow>
                )}
                {branchesQuery.error && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-destructive">
                      Unable to load branches.
                    </TableCell>
                  </TableRow>
                )}
                {branchesQuery.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      No branches yet. Click &quot;Add Branch&quot; to create one.
                    </TableCell>
                  </TableRow>
                )}
                {branchesQuery.data?.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-mono text-sm font-medium">{branch.branchCode}</TableCell>
                    <TableCell>{branch.branchName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{branch.address}</TableCell>
                    <TableCell>
                      <Badge variant={branch.status === "ACTIVE" ? "default" : "outline"}>
                        {branch.status === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setEditBranch(branch)}
                          aria-label={`Edit branch ${branch.branchCode}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget({ kind: "branch", id: branch.id, label: branch.branchName });
                          }}
                          aria-label={`Delete branch ${branch.branchCode}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <CreateDepartmentDialog />
          </div>
          <div className="rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentsQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      Loading departments...
                    </TableCell>
                  </TableRow>
                )}
                {departmentsQuery.error && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-destructive">
                      Unable to load departments.
                    </TableCell>
                  </TableRow>
                )}
                {departmentsQuery.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      No departments yet. Click &quot;Add Department&quot; to create one.
                    </TableCell>
                  </TableRow>
                )}
                {departmentsQuery.data?.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-mono text-sm font-medium">
                      {department.departmentCode}
                    </TableCell>
                    <TableCell>{department.departmentName}</TableCell>
                    <TableCell>{branchNameById.get(department.branchId) ?? "Unknown"}</TableCell>
                    <TableCell>
                      <Badge variant={department.status === "ACTIVE" ? "default" : "outline"}>
                        {department.status === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setEditDepartment(department)}
                          aria-label={`Edit department ${department.departmentCode}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleteTarget({
                              kind: "department",
                              id: department.id,
                              label: department.departmentName,
                            });
                          }}
                          aria-label={`Delete department ${department.departmentCode}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <EditBranchDialog branch={editBranch} onClose={() => setEditBranch(null)} />
      <EditDepartmentDialog department={editDepartment} onClose={() => setEditDepartment(null)} />

      <Dialog open={deleteTarget !== null} onOpenChange={(next) => !next && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="mt-3">
              Delete {deleteTarget?.kind === "branch" ? "Branch" : "Department"}
            </DialogTitle>
            <DialogDescription>
              Delete <span className="font-medium text-foreground">{deleteTarget?.label}</span>? This
              cannot be undone.
              {deleteTarget?.kind === "branch" && " Any departments or devices still assigned to it must be removed first."}
              {deleteTarget?.kind === "department" && " Any devices still assigned to it must be removed first."}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
              {deleteError}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" className="rounded-xl" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
