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
      className="quiz-daily-bubble group relative isolate inline-flex max-w-[11.5rem] shrink-0 items-center gap-2 rounded-[999px] border border-white/70 bg-[linear-gradient(145deg,rgba(124,39,54,0.96),rgba(94,29,41,0.94))] px-3 py-2 text-left shadow-[0_12px_28px_rgba(124,39,54,0.28)] transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.97] sm:max-w-[13.5rem] sm:px-3.5 sm:py-2.5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -left-1.5 -top-1.5 h-5 w-5 rounded-full bg-white/25 blur-[1px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-1 -right-1 h-4 w-6 rounded-full bg-white/20 blur-[1px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 top-0 h-3.5 w-3.5 rounded-full bg-cream/35"
      />

      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-cream ring-1 ring-white/30 sm:h-8 sm:w-8">
        <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
      </span>
      <span className="relative min-w-0">
        <span className="block truncate font-heading text-[0.78rem] font-semibold leading-tight tracking-tight text-cream sm:text-[0.85rem]">
          {title}
        </span>
      </span>
    </DailyQuestionCta>
  );
}
