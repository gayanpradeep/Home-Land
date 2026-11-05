"use client";

import { useEffect, useState } from "react";
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
import { CreateDeviceDialog } from "@/components/devices/create-device-dialog";
import { Trash2, Smartphone, Inbox, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAVY = "#1b2a56";
const ORANGE = "#f47321";

// The kiosk screen pings /api/device/heartbeat roughly every 25s while it's
// sitting on the rating page (see rating-screen.tsx), so anything seen more
// recently than this is still genuinely open on that device, not just a
// leftover timestamp from its last rating submission or page load.
const ONLINE_THRESHOLD_MS = 60_000;
const PRESENCE_POLL_MS = 15_000;

interface DeviceRow {
  id: string;
  deviceCode: string;
  counterName: string;
  branchName: string;
  departmentName: string;
  status: "ACTIVE" | "INACTIVE";
  lastSeenAt: string | null;
}

function isDeviceOnline(device: DeviceRow, now: number): boolean {
  if (device.status !== "ACTIVE" || !device.lastSeenAt) return false;
  return now - new Date(device.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}

export function DeviceManagement() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<DeviceRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const { data, isLoading, error } = useQuery<DeviceRow[]>({
    queryKey: ["admin", "devices"],
    queryFn: async () => {
      const res = await fetch("/api/admin/devices");
      if (!res.ok) throw new Error("Failed to load devices");
      return res.json();
    },
    refetchInterval: PRESENCE_POLL_MS,
  });

  // Re-render on the same cadence as the refetch so a device that goes quiet
  // flips to Offline in the UI even between fetches, not just when new data
  // happens to arrive.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), PRESENCE_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  async function toggleStatus(device: DeviceRow) {
    const nextStatus = device.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await fetch(`/api/admin/devices/${device.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    await queryClient.invalidateQueries({ queryKey: ["admin", "devices"] });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/devices/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error ?? "Unable to delete device.");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["admin", "devices"] });
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const activeCount = data?.filter((d) => d.status === "ACTIVE").length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${NAVY}0f`, color: NAVY }}
          >
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Device Management</h1>
              {data && data.length > 0 && (
                <span
                  className="px-2.5 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: `${ORANGE}1a`, color: ORANGE }}
                >
                  {activeCount} active
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Register kiosk tablets and assign each to a branch, department and counter.
              Deactivating a device immediately blocks it from submitting ratings.
            </p>
          </div>
        </div>
        <CreateDeviceDialog />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="bg-slate-50/80 font-semibold text-slate-600">Device</TableHead>
              <TableHead className="bg-slate-50/80 font-semibold text-slate-600">Branch / Department</TableHead>
              <TableHead className="bg-slate-50/80 font-semibold text-slate-600">Status</TableHead>
              <TableHead className="bg-slate-50/80 font-semibold text-slate-600">Online</TableHead>
              <TableHead className="bg-slate-50/80 font-semibold text-slate-600">Last Seen</TableHead>
              <TableHead className="bg-slate-50/80 text-right font-semibold text-slate-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" style={{ color: ORANGE }} />
                  Loading devices...
                </TableCell>
              </TableRow>
            )}
            {error && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-destructive">
                  <AlertTriangle className="mx-auto mb-2 h-5 w-5" />
                  Unable to load devices.
                </TableCell>
              </TableRow>
            )}
            {data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  <Inbox className="mx-auto mb-2 h-6 w-6 text-slate-300" />
                  No devices yet. Click &quot;Register Device&quot; to add one.
                </TableCell>
              </TableRow>
            )}
            {data?.map((device) => (
              <TableRow key={device.id} className="hover:bg-slate-50/60">
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="w-fit rounded-md px-2 py-0.5 font-mono text-xs font-bold"
                      style={{ backgroundColor: `${NAVY}0d`, color: NAVY }}
                    >
                      {device.deviceCode}
                    </span>
                    <span className="text-xs text-slate-500">{device.counterName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-slate-800">{device.branchName}</span>
                    <span className="text-xs" style={{ color: ORANGE }}>
                      {device.departmentName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "gap-1.5 border-0 font-medium",
                      device.status === "ACTIVE" ? "" : "bg-slate-100 text-slate-500",
                    )}
                    style={
                      device.status === "ACTIVE"
                        ? { backgroundColor: `${ORANGE}1a`, color: ORANGE }
                        : undefined
                    }
                  >
                    <span
                      className={cn("h-1.5 w-1.5", device.status === "ACTIVE" ? "" : "bg-slate-400")}
                      style={device.status === "ACTIVE" ? { backgroundColor: ORANGE } : undefined}
                    />
                    {device.status === "ACTIVE" ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {device.status === "ACTIVE" ? (
                    <Badge
                      className={cn(
                        "gap-1.5 border-0 font-medium",
                        isDeviceOnline(device, now) ? "" : "bg-slate-100 text-slate-500",
                      )}
                      style={
                        isDeviceOnline(device, now)
                          ? { backgroundColor: "#0ca30c1a", color: "#0ca30c" }
                          : undefined
                      }
                    >
                      <span
                        className={cn("h-1.5 w-1.5", isDeviceOnline(device, now) ? "" : "bg-slate-400")}
                        style={isDeviceOnline(device, now) ? { backgroundColor: "#0ca30c" } : undefined}
                      />
                      {isDeviceOnline(device, now) ? "Online" : "Offline"}
                    </Badge>
                  ) : (
                    <span className="text-sm text-slate-400">&mdash;</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : "Never"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => toggleStatus(device)}
                    >
                      {device.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                    </Button>
                    {device.status === "INACTIVE" && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-lg text-destructive hover:text-destructive"
                        onClick={() => {
                          setDeleteError(null);
                          setDeleteTarget(device);
                        }}
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

      <Dialog open={deleteTarget !== null} onOpenChange={(next) => !next && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="mt-3">Delete Device</DialogTitle>
            <DialogDescription>
              {deleteTarget && (
                <>
                  Delete <span className="font-mono font-medium text-foreground">{deleteTarget.deviceCode}</span>{" "}
                  ({deleteTarget.counterName})? This cannot be undone — the kiosk will need to be
                  re-registered and re-activated to submit ratings again.
                </>
              )}
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
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Device"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
