"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, WifiOff } from "lucide-react";
import { RATING_EMOJIS, RATING_LABELS, type RatingScore } from "@/types/models";
import { NEGATIVE_FEEDBACK_REASONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SCORES: RatingScore[] = [1, 2, 3, 4, 5];
const NEGATIVE_THRESHOLD = 2;
const THANK_YOU_DURATION_MS = 3000;
const SELECTION_ANIMATION_MS = 450;

type Step = "rating" | "reason" | "submitting" | "thankyou" | "error";

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
  // Generated once per flow and reused on every retry so a network retry can
  // never create a duplicate rating (the API enforces this too, idempotently).
  const [submissionReference, setSubmissionReference] = useState<string | null>(null);

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
    setSubmissionReference(null);
  }

  async function submitRating(score: RatingScore, reference: string, reasonCodes?: string[], finalComment?: string) {
    setStep("submitting");
    try {
      const res = await fetch("/api/device/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ratingScore: score,
          submissionReference: reference,
          reasonCodes: reasonCodes && reasonCodes.length > 0 ? reasonCodes : undefined,
          comment: finalComment ? finalComment.trim() || undefined : undefined,
        }),
      });

      if (!res.ok) {
        setStep("error");
        return;
      }

      setStep("thankyou");
      resetTimerRef.current = setTimeout(resetToRating, THANK_YOU_DURATION_MS);
    } catch {
      setStep("error");
    }
  }

  function handleSelectEmoji(score: RatingScore) {
    if (selectedScore !== null) return; // already mid-flow, ignore extra taps
    setSelectedScore(score);
    const reference = crypto.randomUUID();
    setSubmissionReference(reference);

    setTimeout(() => {
      if (score <= NEGATIVE_THRESHOLD) {
        setStep("reason");
      } else {
        void submitRating(score, reference);
      }
    }, SELECTION_ANIMATION_MS);
  }

  function toggleReason(code: string) {
    setSelectedReasons((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function handleSubmitReason() {
    if (!selectedScore || !submissionReference) return;
    void submitRating(selectedScore, submissionReference, selectedReasons, comment);
  }

  function handleSkipReason() {
    if (!selectedScore || !submissionReference) return;
    void submitRating(selectedScore, submissionReference);
  }

  function handleRetry() {
    if (!selectedScore || !submissionReference) return;
    void submitRating(selectedScore, submissionReference, selectedReasons, comment);
  }

  return (
    <div className="flex min-h-screen select-none flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4 sm:px-10">
        <Image src="/home-lands-logo.jpg" alt="Home Lands" width={160} height={48} className="h-9 w-auto" priority />
        <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700">
          {counterName}
        </span>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {step === "rating" && (
            <motion.div
              key="rating"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-4xl text-center"
            >
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
                    <motion.button
                      key={score}
                      type="button"
                      disabled={selectedScore !== null}
                      onClick={() => handleSelectEmoji(score)}
                      whileHover={selectedScore === null ? { scale: 1.04 } : undefined}
                      whileTap={selectedScore === null ? { scale: 0.96 } : undefined}
                      animate={{
                        scale: isSelected ? 1.12 : 1,
                        opacity: isDimmed ? 0.35 : 1,
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-8 shadow-sm",
                        isSelected && "border-primary shadow-lg ring-4 ring-primary/30",
                      )}
                    >
                      <span className="text-5xl sm:text-6xl">{RATING_EMOJIS[score]}</span>
                      <span className="text-sm font-semibold text-slate-700 sm:text-base">
                        {RATING_LABELS[score]}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === "reason" && selectedScore !== null && (
            <motion.div
              key="reason"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            >
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
                  onClick={handleSubmitReason}
                  className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Submit Feedback
                </button>
                <button
                  type="button"
                  onClick={handleSkipReason}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50"
                >
                  Skip
                </button>
              </div>
            </motion.div>
          )}

          {step === "submitting" && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center"
            >
              <Loader2 className="h-14 w-14 animate-spin text-primary" strokeWidth={1.5} />
              <p className="mt-4 text-base text-slate-500">Saving your feedback...</p>
            </motion.div>
          )}

          {step === "thankyou" && (
            <motion.div
              key="thankyou"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="flex flex-col items-center text-center"
            >
              {selectedScore && <span className="text-6xl">{RATING_EMOJIS[selectedScore]}</span>}
              <CheckCircle2 className="mt-4 h-16 w-16 text-emerald-500" strokeWidth={1.5} />
              <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
                THANK YOU FOR YOUR FEEDBACK!
              </h1>
              <p className="mt-2 text-base text-slate-500">Your opinion matters to us.</p>
            </motion.div>
          )}

          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center"
            >
              <WifiOff className="h-14 w-14 text-amber-500" strokeWidth={1.5} />
              <h2 className="mt-4 text-xl font-bold text-slate-900">
                We couldn&apos;t save your feedback
              </h2>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Please check the connection and try again. Your selection hasn&apos;t been lost.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={resetToRating}
                  className="rounded-xl px-5 py-3 text-sm font-medium text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-slate-900 py-3 text-center text-xs font-medium tracking-wide text-slate-300">
        CUSTOMER SATISFACTION SYSTEM
      </footer>
    </div>
  );
}
