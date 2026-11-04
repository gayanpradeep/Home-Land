"use client";

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
import { CreateDeviceDialog } from "@/components/devices/create-device-dialog";
import { Trash2 } from "lucide-react";

interface DeviceRow {
  id: string;
  deviceCode: string;
  counterName: string;
  branchName: string;
  departmentName: string;
  status: "ACTIVE" | "INACTIVE";
  lastSeenAt: string | null;
}

export function DeviceManagement() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<DeviceRow[]>({
    queryKey: ["admin", "devices"],
    queryFn: async () => {
      const res = await fetch("/api/admin/devices");
      if (!res.ok) throw new Error("Failed to load devices");
      return res.json();
    },
  });

  async function toggleStatus(device: DeviceRow) {
    const nextStatus = device.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await fetch(`/api/admin/devices/${device.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    await queryClient.invalidateQueries({ queryKey: ["admin", "devices"] });
  }

  async function handleDelete(device: DeviceRow) {
    if (!confirm(`Delete device "${device.deviceCode}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/devices/${device.id}`, { method: "DELETE" });
    await queryClient.invalidateQueries({ queryKey: ["admin", "devices"] });
  }

  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Device Management</h1>
          <p className="text-sm text-muted-foreground">
            Register kiosk tablets and assign each to a branch, department and counter.
            Deactivating a device immediately blocks it from submitting ratings.
          </p>
        </div>
        <CreateDeviceDialog />
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device Code</TableHead>
              <TableHead>Counter</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  Loading devices...
                </TableCell>
              </TableRow>
            )}
            {error && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-destructive">
                  Unable to load devices.
                </TableCell>
              </TableRow>
            )}
            {data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  No devices yet. Click &quot;Register Device&quot; to add one.
                </TableCell>
              </TableRow>
            )}
            {data?.map((device) => (
              <TableRow key={device.id}>
                <TableCell className="font-mono text-sm font-medium">{device.deviceCode}</TableCell>
                <TableCell>{device.counterName}</TableCell>
                <TableCell>{device.branchName}</TableCell>
                <TableCell>{device.departmentName}</TableCell>
                <TableCell>
                  <Badge variant={device.status === "ACTIVE" ? "default" : "outline"}>
                    {device.status === "ACTIVE" ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "Never"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleStatus(device)}>
                      {device.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                    </Button>
                    {device.status === "INACTIVE" && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(device)}
                        aria-label={`Delete device ${device.deviceCode}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
