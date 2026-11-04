"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DateRangePreset } from "@/lib/date-range";

const PRESET_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 days" },
  { value: "last30days", label: "Last 30 days" },
  { value: "thisMonth", label: "This month" },
  { value: "previousMonth", label: "Previous month" },
];

interface BranchOption {
  id: string;
  branchName: string;
}

interface FiltersBarProps {
  preset: DateRangePreset;
  onPresetChange: (preset: DateRangePreset) => void;
  branchId: string;
  onBranchChange: (branchId: string) => void;
}

export function FiltersBar({ preset, onPresetChange, branchId, onBranchChange }: FiltersBarProps) {
  const { data: branches } = useQuery<BranchOption[]>({
    queryKey: ["admin", "branches"],
    queryFn: async () => {
      const res = await fetch("/api/admin/branches");
      if (!res.ok) throw new Error("Failed to load branches");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Select value={preset} onValueChange={(v) => onPresetChange(v as DateRangePreset)}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue>
            {PRESET_OPTIONS.find((opt) => opt.value === preset)?.label ?? "Select range"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PRESET_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={branchId} onValueChange={(v) => onBranchChange(v ?? "all")}>
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue>
            {branchId === "all"
              ? "All Branches"
              : (branches?.find((b) => b.id === branchId)?.branchName ?? "All Branches")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Branches</SelectItem>
          {branches?.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.branchName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
