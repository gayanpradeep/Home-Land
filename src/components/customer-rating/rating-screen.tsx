"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, WifiOff } from "lucide-react";
import { RATING_EMOJIS, RATING_LABELS, type RatingScore } from "@/types/models";
import { NEGATIVE_FEEDBACK_REASONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SCORES: RatingScore[] = [1, 2, 3, 4, 5];
const NEGATIVE_THRESHOLD = 2;
const THANK_YOU_DURATION_MS = 3000;
const SELECTION_ANIMATION_MS = 450;

// Sampled from the Home Lands brand mark (public/home-lands-icon.png) so the
// kiosk matches the site's navy + orange identity exactly, not an approximation.
const NAVY = "#1b2a56";
const ORANGE = "#f47321";

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
    <div className="relative flex min-h-screen select-none flex-col overflow-hidden bg-[#FAF8F4]">
      {/* Decorative brand backdrop — soft navy/orange glows, no imagery needed */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-32 h-[32rem] w-[32rem] rounded-full opacity-[0.06] blur-3xl"
          style={{ background: NAVY }}
        />
        <div
          className="absolute -right-32 -bottom-40 h-[32rem] w-[32rem] rounded-full opacity-[0.08] blur-3xl"
          style={{ background: ORANGE }}
        />
      </div>

      <header className="relative z-10 flex items-center justify-between border-b border-black/5 bg-white/80 px-6 py-4 backdrop-blur-sm sm:px-10">
        <Image
          src="/home-lands-logo-tagline.jpg"
          alt="Home Lands"
          width={220}
          height={110}
          className="h-12 w-auto sm:h-14"
          priority
        />
        <span
          className="rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase sm:text-sm"
          style={{ backgroundColor: `${ORANGE}1a`, color: ORANGE }}
        >
          {counterName}
        </span>
      </header>
      <div
        className="relative z-10 h-[3px] w-full"
        style={{ background: `linear-gradient(90deg, ${NAVY}, ${ORANGE})` }}
      />

      <main className="relative z-10 flex flex-1 items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {step === "rating" && (
            <motion.div
              key="rating"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-5xl text-center"
            >
              <h1
                className="text-3xl font-extrabold tracking-tight uppercase sm:text-5xl"
                style={{ color: NAVY }}
              >
                How Was Your Experience?
              </h1>
              <div className="mx-auto mt-4 h-1 w-20 rounded-full" style={{ background: ORANGE }} />
              <p className="mt-5 text-base text-slate-500 sm:text-lg">
                Your feedback helps us build better communities.
              </p>

              <div
                className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide text-slate-600 uppercase sm:text-sm"
                style={{ borderColor: `${NAVY}22` }}
              >
                <span style={{ color: NAVY }}>{branchName}</span>
                <span className="text-slate-300">&bull;</span>
                <span style={{ color: ORANGE }}>{departmentName}</span>
              </div>

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
                      whileHover={selectedScore === null ? { scale: 1.04, y: -4 } : undefined}
                      whileTap={selectedScore === null ? { scale: 0.96 } : undefined}
                      animate={{
                        scale: isSelected ? 1.12 : 1,
                        opacity: isDimmed ? 0.35 : 1,
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={cn(
                        "flex flex-col items-center justify-center gap-3 rounded-[28px] border bg-white px-4 py-9 shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-colors",
                        isSelected ? "border-transparent" : "border-slate-200/80 hover:border-slate-300",
                      )}
                      style={
                        isSelected
                          ? { boxShadow: `0 0 0 4px ${ORANGE}33, 0 12px 30px rgba(0,0,0,0.08)` }
                          : undefined
                      }
                    >
                      <span className="text-5xl sm:text-6xl">{RATING_EMOJIS[score]}</span>
                      <span
                        className="text-xs font-bold tracking-wide uppercase sm:text-sm"
                        style={{ color: isSelected ? ORANGE : NAVY }}
                      >
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
              className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
            >
              <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${NAVY}, ${ORANGE})` }} />
              <div className="p-8">
                <div className="text-center">
                  <span className="text-5xl">{RATING_EMOJIS[selectedScore]}</span>
                  <h2 className="mt-4 text-xl font-bold" style={{ color: NAVY }}>
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
                        className="rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors"
                        style={
                          isActive
                            ? { borderColor: ORANGE, backgroundColor: `${ORANGE}0d`, color: ORANGE }
                            : { borderColor: "#e2e8f0", color: "#334155" }
                        }
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
                  className="mt-4 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                />

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleSubmitReason}
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98]"
                    style={{ backgroundColor: ORANGE }}
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
              <Loader2 className="h-14 w-14 animate-spin" style={{ color: ORANGE }} strokeWidth={1.5} />
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
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.1 }}
                className="mt-5 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: ORANGE }}
              >
                <Check className="h-8 w-8 text-white" strokeWidth={2.5} />
              </motion.div>
              <h1
                className="mt-6 text-3xl font-extrabold tracking-tight uppercase sm:text-4xl"
                style={{ color: NAVY }}
              >
                Thank You!
              </h1>
              <p className="mt-2 text-base text-slate-500">Your opinion matters to us.</p>
              <p className="mt-4 text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                Trust &middot; Innovation &middot; Excellence
              </p>
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
              <h2 className="mt-4 text-xl font-bold" style={{ color: NAVY }}>
                We couldn&apos;t save your feedback
              </h2>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Please check the connection and try again. Your selection hasn&apos;t been lost.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm"
                  style={{ backgroundColor: ORANGE }}
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

      <footer
        className="relative z-10 py-3.5 text-center text-xs font-semibold tracking-[0.3em] text-white uppercase"
        style={{ background: NAVY }}
      >
        Trust <span style={{ color: ORANGE }}>&middot;</span> Innovation{" "}
        <span style={{ color: ORANGE }}>&middot;</span> Excellence
      </footer>
    </div>
  );
}
