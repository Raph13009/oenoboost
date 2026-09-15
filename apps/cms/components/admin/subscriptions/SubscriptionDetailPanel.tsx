"use client";

import { useEffect, useState } from "react";
import type { SubscriptionWithUser } from "@/app/admin/(cms)/subscriptions/actions";
import {
  getSubscription,
  refreshSubscriptionStatus,
  cancelSubscription,
} from "@/app/admin/(cms)/subscriptions/actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

type Props = {
  subscriptionId: string;
  onClose: () => void;
};

const labelClass = "block text-[11px] text-slate-500 mb-0.5";
const valueClass = "text-sm text-slate-900";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">{title}</span>
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">{title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "" : "-rotate-90"}`}
          aria-hidden
        />
      </button>
      {open && <div className="p-3">{children}</div>}
    </section>
  );
}

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("fr-FR");
}

function fullName(u: SubscriptionWithUser["user"]) {
  if (!u) return "—";
  const first = (u.first_name ?? "").trim();
  const last = (u.last_name ?? "").trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;
  return u.email || "—";
}

export function SubscriptionDetailPanel({ subscriptionId, onClose }: Props) {
  const router = useRouter();
  const [sub, setSub] = useState<SubscriptionWithUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [systemOpen, setSystemOpen] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getSubscription(subscriptionId).then((data) => {
      if (!cancelled && data) setSub(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [subscriptionId]);

  const handleRefresh = async () => {
    setError(null);
    setRefreshLoading(true);
    try {
      const res = await refreshSubscriptionStatus(subscriptionId);
      if (res.error) setError(res.error);
      else {
        router.refresh();
        const updated = await getSubscription(subscriptionId);
        if (updated) setSub(updated);
      }
    } finally {
      setRefreshLoading(false);
    }
  };

  const handleCancel = async () => {
    setError(null);
    setActionLoading(true);
    try {
      const res = await cancelSubscription(subscriptionId);
      if (res.error) setError(res.error);
      else {
        router.refresh();
        onClose();
        setCancelModalOpen(false);
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white p-6 text-sm text-slate-500">
        Chargement…
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="flex h-full flex-col justify-center bg-white p-6 text-sm text-slate-500">
        Abonnement introuvable.
        <button type="button" onClick={onClose} className="mt-2 text-slate-700 underline">
          Fermer
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5">
        <h2 className="min-w-0 truncate text-base font-semibold text-slate-900">
          {sub.user?.email ?? sub.stripe_subscription_id ?? "Abonnement"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Fermer
        </button>
      </div>

      {error && (
        <div className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto p-3 space-y-3">
        <Section title="Utilisateur">
          <dl className="space-y-2">
            <div>
              <dt className={labelClass}>Nom</dt>
              <dd className={valueClass}>{fullName(sub.user)}</dd>
            </div>
            <div>
              <dt className={labelClass}>Email</dt>
              <dd className={valueClass}>{sub.user?.email ?? "—"}</dd>
            </div>
            {sub.user_id && (
              <div>
                <Link
                  href="/admin/users"
                  className="text-sm text-violet-600 hover:underline"
                >
                  Ouvrir la page Utilisateurs →
                </Link>
              </div>
            )}
          </dl>
        </Section>

        <Section title="Abonnement">
          <dl className="space-y-2">
            <div>
              <dt className={labelClass}>plan</dt>
              <dd className={valueClass}>{sub.plan}</dd>
            </div>
            <div>
              <dt className={labelClass}>status</dt>
              <dd className={valueClass}>{sub.status}</dd>
            </div>
            <div>
              <dt className={labelClass}>stripe_customer_id</dt>
              <dd className={`${valueClass} break-all font-mono text-xs`}>{sub.stripe_customer_id ?? "—"}</dd>
            </div>
            <div>
              <dt className={labelClass}>stripe_subscription_id</dt>
              <dd className={`${valueClass} break-all font-mono text-xs`}>{sub.stripe_subscription_id ?? "—"}</dd>
            </div>
            <div>
              <dt className={labelClass}>stripe_price_id</dt>
              <dd className={`${valueClass} break-all font-mono text-xs`}>{sub.stripe_price_id ?? "—"}</dd>
            </div>
          </dl>
        </Section>

        <Section title="Facturation">
          <dl className="space-y-2">
            <div>
              <dt className={labelClass}>current_period_start</dt>
              <dd className={valueClass}>{formatDate(sub.current_period_start)}</dd>
            </div>
            <div>
              <dt className={labelClass}>current_period_end</dt>
              <dd className={valueClass}>{formatDate(sub.current_period_end)}</dd>
            </div>
            <div>
              <dt className={labelClass}>canceled_at</dt>
              <dd className={valueClass}>{formatDate(sub.canceled_at)}</dd>
            </div>
          </dl>
        </Section>

        <CollapsibleSection title="Système" open={systemOpen} onToggle={() => setSystemOpen(!systemOpen)}>
          <dl className="space-y-1.5 text-xs">
            <div>
              <dt className={labelClass}>Créé le</dt>
              <dd className="text-slate-800">{formatDate(sub.created_at)}</dd>
            </div>
            <div>
              <dt className={labelClass}>Mis à jour le</dt>
              <dd className="text-slate-800">{formatDate(sub.updated_at)}</dd>
            </div>
          </dl>
        </CollapsibleSection>

        <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshLoading}
            className="rounded border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {refreshLoading ? "Synchronisation…" : "Rafraîchir le statut (sync Stripe)"}
          </button>
          {sub.status !== "canceled" && sub.status !== "cancelled" && (
            <button
              type="button"
              onClick={() => setCancelModalOpen(true)}
              disabled={actionLoading}
              className="rounded border border-amber-200 px-2.5 py-1.5 text-sm text-amber-800 hover:bg-amber-50 disabled:opacity-50"
            >
              Annuler l'abonnement
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Annuler l'abonnement"
        message="Cette action annulera l'abonnement dans Stripe et mettra à jour l'enregistrement. Continuer ?"
        confirmLabel="Annuler l'abonnement"
        onConfirm={handleCancel}
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
