"use client";

import { Sparkles } from "lucide-react";

import type { FavoritesAuthModalCopy } from "@/components/shared/favorites-auth-modal";
import { DailyQuestionCta } from "@/features/quiz/components/daily-question-cta";

type Props = {
  href?: string;
  isLoggedIn: boolean;
  title: string;
  authCopy: FavoritesAuthModalCopy;
};

/**
 * Small floating “cloud” entry point for Question of the Day,
 * meant to sit beside the Quiz section title on the home page.
 */
export function DailyQuestionBubble({
  href = "/quiz/daily",
  isLoggedIn,
  title,
  authCopy,
}: Props) {
  return (
    <DailyQuestionCta
      href={href}
      isLoggedIn={isLoggedIn}
      label={title}
      authCopy={authCopy}
      className="quiz-daily-bubble group relative inline-flex h-10 items-center gap-2 overflow-hidden rounded-full border border-white/70 bg-[linear-gradient(145deg,rgba(124,39,54,0.96),rgba(94,29,41,0.94))] px-3 shadow-[0_12px_28px_rgba(124,39,54,0.28)] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.97] sm:h-11 sm:gap-2.5 sm:px-3.5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-white/15"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-3 top-0 h-7 w-7 rounded-full bg-cream/20"
      />

      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-cream ring-1 ring-white/30 sm:h-7 sm:w-7">
        <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
      </span>
      <span className="relative truncate font-heading text-[0.8rem] font-semibold leading-none tracking-tight text-cream sm:text-[0.88rem]">
        {title}
      </span>
    </DailyQuestionCta>
  );
}
