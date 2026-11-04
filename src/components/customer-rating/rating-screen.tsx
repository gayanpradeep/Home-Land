"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { RATING_EMOJIS, RATING_LABELS, type RatingScore } from "@/types/models";
import { NEGATIVE_FEEDBACK_REASONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SCORES: RatingScore[] = [1, 2, 3, 4, 5];
const NEGATIVE_THRESHOLD = 2;
const THANK_YOU_DURATION_MS = 3000;
const SELECTION_ANIMATION_MS = 450;

type Step = "rating" | "reason" | "thankyou";

interface RatingScreenProps {
  branchName: string;
  departmentName: string;
  counterName: string;
}

export function RatingScreen({ branchName, departmentName, counterName }: RatingScreenProps) {
  const [step, setStep] = useState<Step>("rating");
  const [selectedScore, setSelectedScore] = useState<RatingScore | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  function resetToRating() {
    setStep("rating");
    setSelectedScore(null);
    setSelectedReasons([]);
    setComment("");
  }

  async function submitRating(score: RatingScore, reasonCodes?: string[], finalComment?: string) {
    setIsSubmitting(true);
    try {
      await fetch("/api/device/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ratingScore: score,
          reasonCodes: reasonCodes && reasonCodes.length > 0 ? reasonCodes : undefined,
          comment: finalComment ? finalComment.trim() || undefined : undefined,
        }),
      });
    } catch {
      // A customer-facing kiosk must never show a technical error.
      // The thank-you screen proceeds regardless; failures are visible server-side.
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSelectEmoji(score: RatingScore) {
    if (selectedScore !== null) return; // already mid-flow, ignore extra taps
    setSelectedScore(score);

    setTimeout(() => {
      if (score <= NEGATIVE_THRESHOLD) {
        setStep("reason");
      } else {
        void submitRating(score);
        setStep("thankyou");
        resetTimerRef.current = setTimeout(resetToRating, THANK_YOU_DURATION_MS);
      }
    }, SELECTION_ANIMATION_MS);
  }

  function toggleReason(code: string) {
    setSelectedReasons((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function handleSubmitReason() {
    if (!selectedScore) return;
    void submitRating(selectedScore, selectedReasons, comment);
    setStep("thankyou");
    resetTimerRef.current = setTimeout(resetToRating, THANK_YOU_DURATION_MS);
  }

  function handleSkipReason() {
    if (!selectedScore) return;
    void submitRating(selectedScore);
    setStep("thankyou");
    resetTimerRef.current = setTimeout(resetToRating, THANK_YOU_DURATION_MS);
  }

  return (
    <div className="flex min-h-screen select-none flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4 sm:px-10">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-400">HOME LANDS</p>
          <h2 className="text-lg font-bold text-slate-900">CUSTOMER FEEDBACK</h2>
        </div>
        <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700">
          {counterName}
        </span>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        {step === "rating" && (
          <div className="w-full max-w-4xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              HOW WAS YOUR EXPERIENCE WITH US?
            </h1>
            <p className="mt-3 text-base text-slate-500 sm:text-lg">
              Your feedback helps us serve you better.
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {branchName} &middot; {departmentName}
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-5 sm:gap-5">
              {SCORES.map((score) => {
                const isSelected = selectedScore === score;
                const isDimmed = selectedScore !== null && !isSelected;
                return (
                  <button
                    key={score}
                    type="button"
                    disabled={selectedScore !== null}
                    onClick={() => handleSelectEmoji(score)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-8 shadow-sm transition-all duration-300 ease-out",
                      "active:scale-95",
                      isSelected && "scale-110 border-primary shadow-lg ring-4 ring-primary/30",
                      isDimmed && "opacity-40",
                    )}
                  >
                    <span className="text-5xl sm:text-6xl">{RATING_EMOJIS[score]}</span>
                    <span className="text-sm font-semibold text-slate-700 sm:text-base">
                      {RATING_LABELS[score]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === "reason" && selectedScore !== null && (
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="text-center">
              <span className="text-5xl">{RATING_EMOJIS[selectedScore]}</span>
              <h2 className="mt-4 text-xl font-bold text-slate-900">
                How can we improve your experience?
              </h2>
              <p className="mt-1 text-sm text-slate-400">This step is optional.</p>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              {NEGATIVE_FEEDBACK_REASONS.map((reason) => {
                const isActive = selectedReasons.includes(reason.code);
                return (
                  <button
                    key={reason.code}
                    type="button"
                    onClick={() => toggleReason(reason.code)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                      isActive
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    {reason.label}
                  </button>
                );
              })}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Additional comments (optional)..."
              rows={3}
              className="mt-4 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary"
            />

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitReason}
                className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
              >
                Submit Feedback
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSkipReason}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {step === "thankyou" && (
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="h-20 w-20 text-emerald-500" strokeWidth={1.5} />
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
              THANK YOU FOR YOUR FEEDBACK!
            </h1>
            <p className="mt-2 text-base text-slate-500">Your opinion matters to us.</p>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 py-3 text-center text-xs font-medium tracking-wide text-slate-300">
        CUSTOMER SATISFACTION SYSTEM
      </footer>
    </div>
  );
}
