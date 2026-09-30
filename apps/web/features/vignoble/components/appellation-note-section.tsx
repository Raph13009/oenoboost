"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { FavoritesAuthModal } from "@/components/shared/favorites-auth-modal";
import { PaywallModal } from "@/components/shared/paywall-modal";
import { SimpleToast } from "@/components/shared/simple-toast";
import { Button } from "@/components/ui/button";
import { saveAopNoteAction } from "@/features/vignoble/actions/aop-note-actions";
import { buildAopDetailHref } from "@/features/vignoble/lib/aop-slug";

export type AppellationNoteLabels = {
  title: string;
  placeholder: string;
  save: string;
  savedToast: string;
  emptyHint: string;
  lockedAuthTitle: string;
  lockedAuthBody: string;
  lockedPremiumTitle: string;
  lockedPremiumBody: string;
  unlockCta: string;
  authModal: {
    title: string;
    body: string;
    login: string;
    register: string;
  };
};

type Props = {
  aopId: number;
  regionSlug: string;
  aopSlug: string;
  subregionSlug: string;
  initialBody: string;
  isLoggedIn: boolean;
  userPlan: "free" | "premium";
  labels: AppellationNoteLabels;
};

export function AppellationNoteSection({
  aopId,
  regionSlug,
  aopSlug,
  subregionSlug,
  initialBody,
  isLoggedIn,
  userPlan,
  labels,
}: Props) {
  const canEdit = isLoggedIn && userPlan === "premium";
  const [body, setBody] = useState(initialBody);
  const [seenInitial, setSeenInitial] = useState(initialBody);
  if (initialBody !== seenInitial) {
    setSeenInitial(initialBody);
    setBody(initialBody);
  }

  const [authOpen, setAuthOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDirty(body.trim() !== initialBody.trim());
  }, [body, initialBody]);

  const returnPath = useMemo(
    () =>
      buildAopDetailHref(regionSlug, aopSlug, {
        from: "map",
        subregion: subregionSlug || undefined,
      }),
    [regionSlug, aopSlug, subregionSlug],
  );

  const loginHref = `/login?next=${encodeURIComponent(returnPath)}`;
  const registerHref = `/signup?next=${encodeURIComponent(returnPath)}`;

  const handleLockedClick = () => {
    if (!isLoggedIn) {
      setAuthOpen(true);
      return;
    }
    setPaywallOpen(true);
  };

  const handleSave = () => {
    if (!canEdit) {
      handleLockedClick();
      return;
    }

    startTransition(async () => {
      const res = await saveAopNoteAction(aopId, body, [
        `/vignoble/${regionSlug}/${aopSlug}`,
      ]);
      if (!res.ok) {
        if (res.code === "unauthorized") setAuthOpen(true);
        else if (res.code === "premium_required") setPaywallOpen(true);
        else setToast(res.error);
        return;
      }
      setBody(res.body);
      setSeenInitial(res.body);
      setDirty(false);
      setToast(labels.savedToast);
    });
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 md:p-5">
      <h2 className="font-heading text-xl font-semibold">{labels.title}</h2>

      {canEdit ? (
        <div className="mt-3 flex flex-col gap-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={labels.placeholder}
            rows={4}
            maxLength={5000}
            className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-wine/30 focus:outline-none focus:ring-1 focus:ring-wine/20"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            {!body.trim() && !dirty ? (
              <p className="text-xs text-muted-foreground">{labels.emptyHint}</p>
            ) : (
              <span className="text-xs text-muted-foreground" />
            )}
            <Button
              type="button"
              size="sm"
              disabled={isPending || !dirty}
              onClick={handleSave}
            >
              {labels.save}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-4">
          <p className="font-heading text-sm font-semibold text-foreground">
            {!isLoggedIn ? labels.lockedAuthTitle : labels.lockedPremiumTitle}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {!isLoggedIn ? labels.lockedAuthBody : labels.lockedPremiumBody}
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-3"
            onClick={handleLockedClick}
          >
            {labels.unlockCta}
          </Button>
        </div>
      )}

      <FavoritesAuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        copy={labels.authModal}
        loginHref={loginHref}
        registerHref={registerHref}
      />
      <PaywallModal open={paywallOpen} onOpenChange={setPaywallOpen} />
      <SimpleToast message={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}
