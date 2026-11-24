"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import {
  createPremiumCheckoutSession,
  openBillingPortalAction,
} from "@/features/billing/actions/billing-actions";
import enDict from "@/lib/i18n/dictionaries/en";
import frDict from "@/lib/i18n/dictionaries/fr";
import { useLocale } from "@/lib/i18n/locale-context";

import { SimpleToast } from "./simple-toast";

type Props = {
  isPremium: boolean;
};

const buttonClassName =
  "inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-70";

export function ProfileBillingCta({ isPremium }: Props) {
  const router = useRouter();
  const { locale } = useLocale();
  const profile = locale === "en" ? enDict.profile : frDict.profile;
  const paywall = locale === "en" ? enDict.paywall : frDict.paywall;
  const common = locale === "en" ? enDict.common : frDict.common;

  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpgrade = useCallback(() => {
    startTransition(async () => {
      const result = await createPremiumCheckoutSession("/profil");
      if (result.ok) {
        window.location.assign(result.url);
        return;
      }
      switch (result.code) {
        case "AUTH_REQUIRED":
          router.push("/login?next=%2Fprofil");
          setToast(paywall.checkoutLoginRequired);
          break;
        case "ALREADY_PREMIUM":
        case "ALREADY_SUBSCRIBED":
          setToast(paywall.checkoutAlreadyPremium);
          router.refresh();
          break;
        case "CONFIG":
          setToast(paywall.checkoutConfig);
          break;
        default:
          setToast(paywall.checkoutError);
      }
    });
  }, [paywall, router]);

  if (isPremium) {
    return (
      <form action={openBillingPortalAction}>
        <button type="submit" className={buttonClassName}>
          {profile.manageSubscription}
        </button>
      </form>
    );
  }

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        disabled={isPending}
        onClick={handleUpgrade}
      >
        {isPending ? common.loading : profile.upgradeToPremium}
      </button>
      <SimpleToast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
