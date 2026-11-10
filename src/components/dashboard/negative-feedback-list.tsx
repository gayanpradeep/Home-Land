"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareWarning, Inbox, ChevronLeft, ChevronRight, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NEGATIVE_FEEDBACK_REASONS, BAD_REVIEW_STATUSES, BAD_REVIEW_STATUS_LABELS } from "@/lib/constants";
import type { BadReviewStatus } from "@/types/models";
import type { NegativeFeedbackItem } from "@/services/dashboard.service";

const PAGE_SIZE = 5;

const STATUS_BADGE_CLASS: Record<BadReviewStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  CLOSED: "bg-emerald-100 text-emerald-700",
};

const STATIC_REASON_LABEL_BY_CODE = new Map<string, string>(
  NEGATIVE_FEEDBACK_REASONS.map((r) => [r.code, r.label]),
);

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// The API response is JSON, so submittedAt arrives as an ISO string, not the
// Date instance the server-side NegativeFeedbackItem type declares.
export type FeedbackRow = Omit<NegativeFeedbackItem, "submittedAt"> & { submittedAt: string };

interface NegativeFeedbackListProps {
  items: FeedbackRow[] | undefined;
  isLoading: boolean;
}

export function NegativeFeedbackList({ items, isLoading }: NegativeFeedbackListProps) {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  // Updating a status is rare and the list already refetches on its own
  // interval, so a quick local override (keyed by feedback id) is enough to
  // make the change feel instant without needing optimistic cache surgery.
  const [statusOverrides, setStatusOverrides] = useState<Record<string, BadReviewStatus>>({});

  async function handleStatusChange(id: string, status: BadReviewStatus) {
    setStatusOverrides((prev) => ({ ...prev, [id]: status }));
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "feedback"] });
    } catch {
      setStatusOverrides((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  // Live admin-managed labels (Reference > Feedback Reasons) take priority so
  // a renamed/edited reason shows its current label here, not the built-in
  // default; the static map is only a fallback for codes no longer present.
  const reasonsQuery = useQuery<{ code: string; label: string }[]>({
    queryKey: ["admin", "feedbackReasons"],
    queryFn: async () => {
      const res = await fetch("/api/admin/feedback-reasons");
      if (!res.ok) throw new Error("Failed to load feedback reasons");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
  const reasonLabelByCode = new Map<string, string>([
    ...STATIC_REASON_LABEL_BY_CODE,
    ...(reasonsQuery.data ?? []).map((r) => [r.code, r.label] as const),
  ]);

  // Service already returns newest-first (sorted by createdAt descending), so
  // the most recent submission is always item 0 / top of page 1 — pagination
  // here is purely client-side slicing of that already-sorted list.
  const totalPages = items && items.length > 0 ? Math.ceil(items.length / PAGE_SIZE) : 1;
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pageItems = items?.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <MessageSquareWarning className="h-4 w-4 text-destructive" />
        <h2 className="text-sm font-semibold text-slate-900">Negative Feedback Comments</h2>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Comments and reasons left by customers who rated Dissatisfied or Very Dissatisfied, newest first.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {isLoading && (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading feedback...</p>
        )}

        {!isLoading && items?.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <Inbox className="h-6 w-6 text-slate-300" />
            No negative feedback in this date range.
          </div>
        )}

        {pageItems?.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{item.emoji}</span>
                <span className="text-xs font-bold tracking-wide text-destructive uppercase">
                  {item.ratingLabel}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{formatRelativeTime(item.submittedAt)}</span>
            </div>

            <p className="mt-1 text-xs font-medium text-slate-600">
              {item.branchName} <span className="text-slate-300">&bull;</span> {item.departmentName}
            </p>

            {(item.customerName || item.customerContactNumber) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                {item.customerName && (
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3 w-3 text-slate-400" />
                    {item.customerName}
                  </span>
                )}
                {item.customerContactNumber && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3 text-slate-400" />
                    {item.customerContactNumber}
                  </span>
                )}
              </div>
            )}

            {item.reasonCodes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.reasonCodes.map((code) => (
                  <span
                    key={code}
                    className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-medium text-destructive"
                  >
                    {reasonLabelByCode.get(code) ?? code}
                  </span>
                ))}
              </div>
            )}

            {item.comment && (
              <p className="mt-2 text-sm text-slate-700">&ldquo;{item.comment}&rdquo;</p>
            )}

            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
              {(() => {
                const status = statusOverrides[item.id] ?? item.status;
                return (
                  <>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE_CLASS[status]}`}
                    >
                      {BAD_REVIEW_STATUS_LABELS[status]}
                    </span>
                    <select
                      value={status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value as BadReviewStatus)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 outline-none"
                    >
                      {BAD_REVIEW_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {BAD_REVIEW_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </>
                );
              })()}
            </div>
          </div>
        ))}
      </div>

      {items && items.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs text-muted-foreground">
            Page {safePage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
