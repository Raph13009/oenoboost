import type Stripe from "stripe";

import { isPremiumStatus } from "@/lib/billing/subscription-status";
import { getStripe } from "@/lib/stripe/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export type StoredSubscription = {
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string | null;
};

export type ReconciledSubscription = {
  isPremium: boolean;
  customerId: string | null;
  subscriptionId: string | null;
  status: string | null;
  /** True when a stored Stripe id was invalid for the current API keys/mode. */
  clearedStale: boolean;
};

function toIsoOrNull(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds || !Number.isFinite(unixSeconds)) return null;
  return new Date(unixSeconds * 1000).toISOString();
}

function isMissingStripeResource(error: unknown): boolean {
  const err = error as { code?: string; statusCode?: number; raw?: { code?: string } };
  return (
    err?.code === "resource_missing" ||
    err?.raw?.code === "resource_missing" ||
    err?.statusCode === 404
  );
}

/**
 * Align `users.plan` + `subscriptions` with Stripe for the current API keys.
 * Clears rows that point at live (or otherwise missing) objects when running in sandbox, and vice versa.
 */
export async function reconcileUserSubscription(
  userId: string,
  stored: StoredSubscription | null,
): Promise<ReconciledSubscription> {
  const empty: ReconciledSubscription = {
    isPremium: false,
    customerId: null,
    subscriptionId: null,
    status: null,
    clearedStale: false,
  };

  if (!stored?.stripe_subscription_id && !stored?.stripe_customer_id) {
    return empty;
  }

  const stripe = getStripe();
  const supabase = createServiceRoleClient();
  const nowIso = new Date().toISOString();

  let subscription: Stripe.Subscription | null = null;

  if (stored.stripe_subscription_id) {
    try {
      subscription = await stripe.subscriptions.retrieve(stored.stripe_subscription_id);
    } catch (error) {
      if (!isMissingStripeResource(error)) throw error;
      console.warn("[billing][reconcile] subscription missing in current Stripe mode", {
        userId,
        stripeSubscriptionId: stored.stripe_subscription_id,
      });
    }
  }

  if (!subscription && stored.stripe_customer_id) {
    try {
      await stripe.customers.retrieve(stored.stripe_customer_id);
      const list = await stripe.subscriptions.list({
        customer: stored.stripe_customer_id,
        status: "all",
        limit: 10,
      });
      subscription =
        list.data.find((s) => isPremiumStatus(s.status)) ??
        list.data[0] ??
        null;
    } catch (error) {
      if (!isMissingStripeResource(error)) throw error;
      console.warn("[billing][reconcile] customer missing in current Stripe mode", {
        userId,
        stripeCustomerId: stored.stripe_customer_id,
      });
    }
  }

  if (!subscription) {
    if (stored.stripe_subscription_id) {
      await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          canceled_at: nowIso,
          updated_at: nowIso,
        })
        .eq("stripe_subscription_id", stored.stripe_subscription_id);
    }
    await supabase
      .from("users")
      .update({ plan: "free", updated_at: nowIso })
      .eq("id", userId)
      .is("deleted_at", null);

    return { ...empty, clearedStale: true };
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const sub = subscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
    canceled_at?: number | null;
  };
  const nextPlan = isPremiumStatus(subscription.status) ? "premium" : "free";

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plan: "premium",
      status: subscription.status,
      current_period_start: toIsoOrNull(sub.current_period_start),
      current_period_end: toIsoOrNull(sub.current_period_end),
      canceled_at: toIsoOrNull(sub.canceled_at ?? null),
      updated_at: nowIso,
    },
    { onConflict: "stripe_subscription_id" },
  );

  await supabase
    .from("users")
    .update({ plan: nextPlan, updated_at: nowIso })
    .eq("id", userId)
    .is("deleted_at", null);

  return {
    isPremium: nextPlan === "premium",
    customerId,
    subscriptionId: subscription.id,
    status: subscription.status,
    clearedStale: false,
  };
}
