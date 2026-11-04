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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CreateBranchDialog } from "@/components/reference/create-branch-dialog";
import { CreateDepartmentDialog } from "@/components/reference/create-department-dialog";

interface BranchRow {
  id: string;
  branchCode: string;
  branchName: string;
  address: string;
  status: "ACTIVE" | "INACTIVE";
}

interface DepartmentRow {
  id: string;
  branchId: string;
  departmentCode: string;
  departmentName: string;
  status: "ACTIVE" | "INACTIVE";
}

export function ReferenceManagement() {
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

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchesQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      Loading branches...
                    </TableCell>
                  </TableRow>
                )}
                {branchesQuery.error && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-destructive">
                      Unable to load branches.
                    </TableCell>
                  </TableRow>
                )}
                {branchesQuery.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentsQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                      Loading departments...
                    </TableCell>
                  </TableRow>
                )}
                {departmentsQuery.error && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-destructive">
                      Unable to load departments.
                    </TableCell>
                  </TableRow>
                )}
                {departmentsQuery.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
