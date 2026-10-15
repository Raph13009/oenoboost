"use client";

import { useMemo, useState, useTransition } from "react";
import { Star } from "lucide-react";
import { FavoritesAuthModal } from "@/components/shared/favorites-auth-modal";
import { FavoritesPremiumLimitModal } from "@/components/shared/favorites-premium-limit-modal";
import { SimpleToast } from "@/components/shared/simple-toast";
import { cn } from "@/lib/utils";
import { toggleClimateFavoriteAction } from "../actions/climate-favorite-actions";

export type ClimateFavoriteLabels = {
  favoriteAria: string;
  unfavoriteAria: string;
  addedToast: string;
  removedToast: string;
  authModal: {
    title: string;
    body: string;
    login: string;
    register: string;
  };
  premiumLimit: {
    title: string;
    body: string;
    acknowledge: string;
  };
};

type Props = {
  climateId: string;
  climateSlug: string;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  labels: ClimateFavoriteLabels;
};

export function ClimateFavoriteButton({
  climateId,
  climateSlug,
  initialFavorited,
  isLoggedIn,
  labels,
}: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [seenInitial, setSeenInitial] = useState(initialFavorited);
  if (initialFavorited !== seenInitial) {
    setSeenInitial(initialFavorited);
    setFavorited(initialFavorited);
  }
  const [authOpen, setAuthOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const returnPath = useMemo(
    () => `/climat/${encodeURIComponent(climateSlug)}`,
    [climateSlug],
  );
  const loginHref = useMemo(
    () => `/login?next=${encodeURIComponent(returnPath)}`,
    [returnPath],
  );
  const registerHref = useMemo(
    () => `/signup?next=${encodeURIComponent(returnPath)}`,
    [returnPath],
  );

  const handleClick = () => {
    if (!isLoggedIn) {
      setAuthOpen(true);
      return;
    }

    const next = !favorited;
    setFavorited(next);

    startTransition(async () => {
      const result = await toggleClimateFavoriteAction(climateId, climateSlug);
      if (!result.ok) {
        setFavorited((value) => !value);
        if (result.code === "limit_reached") setPremiumOpen(true);
        return;
      }
      setToast(result.favorited ? labels.addedToast : labels.removedToast);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={favorited ? labels.unfavoriteAria : labels.favoriteAria}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-wine/30 hover:text-wine",
          favorited && "border-wine/40 bg-wine/5 text-wine",
        )}
      >
        <Star
          className="h-5 w-5"
          fill={favorited ? "currentColor" : "none"}
          strokeWidth={1.75}
        />
      </button>

      <FavoritesAuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        copy={labels.authModal}
        loginHref={loginHref}
        registerHref={registerHref}
      />
      <FavoritesPremiumLimitModal
        open={premiumOpen}
        onOpenChange={setPremiumOpen}
        copy={labels.premiumLimit}
      />
      <SimpleToast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
