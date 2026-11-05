"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { StatTile } from "@/components/dashboard/stat-tile";
import { FiltersBar } from "@/components/dashboard/filters-bar";
import { EmojiDistributionChart } from "@/components/dashboard/emoji-distribution-chart";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { PerformanceBarChart } from "@/components/dashboard/performance-bar-chart";
import { NegativeFeedbackList, type FeedbackRow } from "@/components/dashboard/negative-feedback-list";
import type { DateRangePreset } from "@/lib/date-range";
import type { DashboardSummary, TrendPoint, EntityPerformance } from "@/services/dashboard.service";

const REFRESH_INTERVAL_MS = 15000;

function buildQuery(preset: DateRangePreset, branchId: string): string {
  const params = new URLSearchParams({ preset });
  if (branchId !== "all") params.set("branchId", branchId);
  return params.toString();
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export function DashboardView() {
  const router = useRouter();
  const [preset, setPreset] = useState<DateRangePreset>("last7days");
  const [branchId, setBranchId] = useState("all");

  const query = buildQuery(preset, branchId);

  const summaryQuery = useQuery<DashboardSummary>({
    queryKey: ["dashboard", "summary", query],
    queryFn: () => fetchJson(`/api/admin/dashboard/summary?${query}`),
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const trendQuery = useQuery<TrendPoint[]>({
    queryKey: ["dashboard", "trends", query],
    queryFn: () => fetchJson(`/api/admin/dashboard/trends?${query}`),
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const branchPerfQuery = useQuery<EntityPerformance[]>({
    queryKey: ["dashboard", "branches", query],
    queryFn: () => fetchJson(`/api/admin/dashboard/branches?${query}`),
    refetchInterval: REFRESH_INTERVAL_MS,
    enabled: branchId === "all",
  });

  const departmentPerfQuery = useQuery<EntityPerformance[]>({
    queryKey: ["dashboard", "departments", query],
    queryFn: () => fetchJson(`/api/admin/dashboard/departments?${query}`),
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const feedbackQuery = useQuery<FeedbackRow[]>({
    queryKey: ["dashboard", "feedback", query],
    queryFn: () => fetchJson(`/api/admin/dashboard/feedback?${query}`),
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const sessionExpired = [summaryQuery, trendQuery, branchPerfQuery, departmentPerfQuery].some(
    (q) => q.error instanceof ApiError && q.error.status === 401,
  );

  useEffect(() => {
    if (sessionExpired) {
      router.push("/login?next=/admin/dashboard");
    }
  }, [sessionExpired, router]);

  const summary = summaryQuery.data;

  if (sessionExpired) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-center text-muted-foreground">
        Your session has expired. Redirecting to login...
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard - Home Land</h1>
          <p className="text-sm text-muted-foreground">Auto-refreshes every 15 seconds.</p>
        </div>
        <FiltersBar
          preset={preset}
          onPresetChange={setPreset}
          branchId={branchId}
          onBranchChange={setBranchId}
        />
      </div>

      {summaryQuery.error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Unable to load dashboard data: {summaryQuery.error.message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Total Ratings" value={summary ? summary.totalRatings.toLocaleString() : "..."} />
        <StatTile label="Average Rating" value={summary ? summary.averageRating.toFixed(2) : "..."} />
        <StatTile
          label="Satisfaction Rate"
          value={summary ? `${summary.satisfactionRate.toFixed(1)}%` : "..."}
          tone="good"
        />
        <StatTile
          label="Negative Rate"
          value={summary ? `${summary.negativeRate.toFixed(1)}%` : "..."}
          tone="critical"
        />
        <StatTile label="Active Branches" value={summary ? String(summary.activeBranches) : "..."} />
        <StatTile label="Active Devices" value={summary ? String(summary.activeDevices) : "..."} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Emoji Rating Distribution</h2>
          {summary && <EmojiDistributionChart data={summary.emojiDistribution} />}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Daily Rating Trend</h2>
          {trendQuery.data && (
            <TrendChart
              data={trendQuery.data.map((p) => ({ date: p.date.slice(5), value: p.totalRatings }))}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {branchId === "all" && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Branch Performance (Avg. Rating)</h2>
            {branchPerfQuery.data && <PerformanceBarChart data={branchPerfQuery.data} />}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Department Performance (Avg. Rating)</h2>
          {departmentPerfQuery.data && <PerformanceBarChart data={departmentPerfQuery.data} />}
        </div>
      </div>

      <NegativeFeedbackList items={feedbackQuery.data} isLoading={feedbackQuery.isLoading} />
    </div>
  );
}
