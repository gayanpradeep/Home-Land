"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateUserDialog } from "@/components/users/create-user-dialog";

interface UserRow {
  id: string;
  fullName: string;
  username: string;
  userType: "ADMIN" | "BRANCH";
  branchName: string | null;
  departmentName: string | null;
  status: "ACTIVE" | "INACTIVE";
  lastLoginAt: string | null;
}

export function UserManagement() {
  const { data, isLoading, error } = useQuery<UserRow[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to load users");
      return res.json();
    },
  });

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage Admin and Branch user accounts.
          </p>
        </div>
        <CreateUserDialog />
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  Loading users...
                </TableCell>
              </TableRow>
            )}
            {error && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-destructive">
                  Unable to load users.
                </TableCell>
              </TableRow>
            )}
            {data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  No users yet. Click &quot;Add User&quot; to create one.
                </TableCell>
              </TableRow>
            )}
            {data?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.fullName}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <Badge variant={user.userType === "ADMIN" ? "default" : "secondary"}>
                    {user.userType === "ADMIN" ? "Admin" : "Branch"}
                  </Badge>
                </TableCell>
                <TableCell>{user.branchName ?? "—"}</TableCell>
                <TableCell>{user.departmentName ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={user.status === "ACTIVE" ? "default" : "outline"}>
                    {user.status === "ACTIVE" ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
