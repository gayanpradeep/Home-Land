"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type TargetAndTransition, type Transition } from "framer-motion";
import { Check, Loader2, WifiOff } from "lucide-react";
import { RATING_EMOJIS, RATING_LABELS, type RatingScore } from "@/types/models";
import { NEGATIVE_FEEDBACK_REASONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SCORES: RatingScore[] = [1, 2, 3, 4, 5];
const NEGATIVE_THRESHOLD = 2;
// Google Review is only offered for Neutral, Satisfied and Very Satisfied
// (score > NEGATIVE_THRESHOLD) — a dissatisfied customer still sees a plain
// thank-you, no QR, and a much shorter hold since there's nothing to scan.
const GOOGLE_REVIEW_DURATION_SECONDS = 10;
const PLAIN_THANKYOU_DURATION_SECONDS = 8;
const SELECTION_ANIMATION_MS = 450;

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// The official four-color Google "G" mark, inlined so the review prompt reads
// as unmistakably "Google" without pulling in an external logo asset.
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

// Each idle animation echoes what that face is actually "doing" — the angry
// face shakes in short bursts, the sad face slowly droops, neutral barely
// breathes, satisfied bobs happily, and the loved-it face has the biggest,
// bounciest wiggle — rather than one generic float applied to every emoji.
const IDLE_EXPRESSION: Record<RatingScore, { animate: TargetAndTransition; transition: Transition }> = {
  1: {
    animate: { x: [0, -4, 4, -4, 4, 0], rotate: [0, -3, 3, -3, 0] },
    transition: { duration: 0.6, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" },
  },
  2: {
    animate: { rotate: [0, -6, 0], y: [0, 3, 0] },
    transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
  },
  3: {
    animate: { scale: [1, 1.04, 1] },
    transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
  },
  4: {
    animate: { y: [0, -8, 0] },
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
  5: {
    animate: { y: [0, -10, 0], scale: [1, 1.12, 1], rotate: [0, -6, 6, 0] },
    transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
  },
};

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
  const [secondsLeft, setSecondsLeft] = useState(PLAIN_THANKYOU_DURATION_SECONDS);

  const showGoogleReview = selectedScore !== null && selectedScore > NEGATIVE_THRESHOLD;
  const thankYouDurationSeconds = showGoogleReview
    ? GOOGLE_REVIEW_DURATION_SECONDS
    : PLAIN_THANKYOU_DURATION_SECONDS;

  // Each kiosk runs this component as its own independent instance (own tab,
  // own state) — this interval only ever touches this device's local state,
  // so one device's countdown/reset can never affect another's.
  useEffect(() => {
    if (step !== "thankyou") return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step === "thankyou" && secondsLeft === 0) {
      resetToRating();
    }
  }, [step, secondsLeft]);

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

      setSecondsLeft(score > NEGATIVE_THRESHOLD ? GOOGLE_REVIEW_DURATION_SECONDS : PLAIN_THANKYOU_DURATION_SECONDS);
      setStep("thankyou");
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

      {/* Ambient background video, only while the Google Review screen is up —
          muted, looped (the clip is ~10s, the screen holds for 60s) and kept
          low-opacity so it reads as motion in the background, never competing
          with the QR code or text sitting above it. */}
      {step === "thankyou" && showGoogleReview && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <video autoPlay muted loop playsInline className="h-full w-full object-cover opacity-[0.1]">
            <source src="/video/googleQR.webm" type="video/webm" />
          </video>
        </div>
      )}

      <header className="relative z-10 flex items-center justify-between border-b border-black/5 bg-white/80 px-6 py-4 backdrop-blur-sm sm:px-10">
        <Image
          src="/home-lands-logo-tagline.png"
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

      <main className="relative z-10 flex flex-1 items-start justify-center px-6 pt-8 pb-6 sm:pt-10">
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
              <video
                autoPlay
                muted
                loop
                playsInline
                width={760}
                height={428}
                className="mx-auto h-auto w-56 sm:w-72"
              >
                <source src="/video/animation.webm" type="video/webm" />
              </video>
              <h1
                className="-mt-2 text-3xl font-extrabold tracking-tight uppercase sm:text-5xl"
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
                      whileHover={selectedScore === null ? { scale: 1.06, y: -6 } : undefined}
                      whileTap={selectedScore === null ? { scale: 0.94 } : undefined}
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
                      <motion.span
                        className="text-5xl sm:text-6xl"
                        animate={
                          isSelected
                            ? { scale: [1, 1.4, 1.1], rotate: [0, -10, 10, 0], x: 0, y: 0 }
                            : isDimmed
                              ? { scale: 1, x: 0, y: 0, rotate: 0 }
                              : IDLE_EXPRESSION[score].animate
                        }
                        transition={
                          isSelected
                            ? { duration: 0.5, ease: "easeOut" }
                            : isDimmed
                              ? { duration: 0.2 }
                              : IDLE_EXPRESSION[score].transition
                        }
                      >
                        {RATING_EMOJIS[score]}
                      </motion.span>
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="flex w-full max-w-md flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.1 }}
                className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: ORANGE }}
              >
                <Check className="h-8 w-8 text-white" strokeWidth={2.5} />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="mt-5 text-3xl font-extrabold tracking-tight uppercase sm:text-4xl"
                style={{ color: NAVY }}
              >
                Thank You!
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="mt-2 text-base text-slate-500"
              >
                Your feedback matters to us.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="mt-1 text-sm text-slate-400"
              >
                We appreciate you choosing Home Lands.
              </motion.p>

              {/* Google Review is only offered for Neutral / Satisfied / Very
                  Satisfied (score > NEGATIVE_THRESHOLD) — a dissatisfied
                  customer sees the plain thank-you above with no QR prompt. */}
              {showGoogleReview && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
                  className="mt-8 flex w-80 flex-col items-center rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgb(0,0,0,0.08)]"
                >
                  <div className="flex items-center justify-center gap-2">
                    <GoogleLogo className="h-5 w-5 shrink-0" />
                    <span className="text-xs font-bold tracking-wide text-slate-600 uppercase">
                      Google Review
                    </span>
                  </div>

                  {/* unoptimized: the source file is only 132x132 — Next's image
                      optimizer would re-encode this small JPEG again on top of its
                      own lossy compression, softening the module edges further.
                      imageRendering: pixelated keeps edges crisp on the ~2x upscale
                      to the display size below instead of letting the browser blur
                      them smooth. Do not crop, round-clip, or animate/move it — a
                      camera needs a still, sharp target to scan reliably. */}
                  <div className="relative mt-4 h-64 w-64 shrink-0 bg-white">
                    <Image
                      src="/QR/HomelandQR.jpeg"
                      alt="Scan this QR code to leave a Google review for Home Lands"
                      fill
                      unoptimized
                      sizes="256px"
                      className="object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>

                  <p className="mt-4 max-w-[220px] text-center text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                    Scan to share your experience on Google
                  </p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-7 flex flex-col items-center gap-2"
              >
                <span className="text-2xl font-bold tabular-nums" style={{ color: NAVY }}>
                  {formatCountdown(secondsLeft)}
                </span>
                <div className="h-1 w-44 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full transition-[width] duration-1000 ease-linear"
                    style={{
                      width: `${(secondsLeft / thankYouDurationSeconds) * 100}%`,
                      background: ORANGE,
                    }}
                  />
                </div>
                <p className="text-[11px] font-semibold tracking-[0.15em] text-slate-400 uppercase">
                  Returning to rating screen
                </p>
              </motion.div>
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
