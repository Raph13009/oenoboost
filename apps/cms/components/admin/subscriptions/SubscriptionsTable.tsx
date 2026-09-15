"use client";

import { useEffect, useRef, useState } from "react";
import type { SubscriptionWithUser } from "@/app/admin/(cms)/subscriptions/actions";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  subscriptions: SubscriptionWithUser[];
  total: number;
  currentPage: number;
  searchQuery: string;
  planFilter: string;
  statusFilter: string;
  onSearchChange: (q: string) => void;
  onPlanFilterChange: (plan: string) => void;
  onStatusFilterChange: (status: string) => void;
  onPageChange: (page: number) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  isPending?: boolean;
};

const PAGE_SIZE = 25;

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatShortDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
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

function shortStripeId(id: string | null): string {
  if (!id) return "—";
  if (id.length <= 12) return id;
  return `${id.slice(0, 7)}…${id.slice(-4)}`;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800";
    case "canceled":
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "past_due":
      return "bg-amber-100 text-amber-800";
    case "incomplete":
    case "incomplete_expired":
    case "unpaid":
      return "bg-slate-100 text-slate-700";
    case "trialing":
      return "bg-sky-100 text-sky-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function SubscriptionsTable({
  subscriptions,
  total,
  currentPage,
  searchQuery,
  planFilter,
  statusFilter,
  onSearchChange,
  onPlanFilterChange,
  onStatusFilterChange,
  onPageChange,
  selectedId,
  onSelect,
  isPending,
}: Props) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchInput = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearchChange(value), 300);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
        <input
          type="search"
          placeholder="Rechercher par email ou ID client Stripe..."
          value={localSearch}
          onChange={(e) => handleSearchInput(e.target.value)}
          className="h-9 min-w-[200px] flex-1 rounded border border-slate-200 px-3 text-sm focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200"
        />
        <div className="relative flex items-center">
          <select
            value={planFilter}
            onChange={(e) => onPlanFilterChange(e.target.value)}
            className="h-9 appearance-none rounded border border-slate-200 bg-white pl-2.5 pr-8 text-sm text-slate-700 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200"
            aria-label="Filtrer par offre"
          >
            <option value="all">Toutes les offres</option>
            <option value="free">Gratuit</option>
            <option value="premium">Premium</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-400" aria-hidden />
        </div>
        <div className="relative flex items-center">
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="h-9 appearance-none rounded border border-slate-200 bg-white pl-2.5 pr-8 text-sm text-slate-700 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200"
            aria-label="Filtrer par statut"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="canceled">Annulé</option>
            <option value="past_due">Impayé</option>
            <option value="incomplete">Incomplet</option>
            <option value="trialing">Essai</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-400" aria-hidden />
        </div>
        {isPending && <span className="text-xs text-slate-500">Mise à jour…</span>}
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-500">
            <tr>
              <th className="p-3 font-medium">Utilisateur</th>
              <th className="w-24 p-3 font-medium">Offre</th>
              <th className="w-28 p-3 font-medium">Statut</th>
              <th className="w-40 p-3 font-medium">Période de facturation</th>
              <th className="w-28 p-3 font-medium">Renouvellement</th>
              <th className="w-28 p-3 font-medium">Stripe ID</th>
              <th className="w-28 p-3 font-medium text-right">Créé le</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s) => {
              const periodStart = formatShortDate(s.current_period_start);
              const periodEnd = formatShortDate(s.current_period_end);
              const renewalDate = s.current_period_end ? new Date(s.current_period_end) : null;
              const daysToRenewal = renewalDate
                ? Math.ceil((renewalDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
                : null;
              const renewalSoon = daysToRenewal !== null && daysToRenewal >= 0 && daysToRenewal <= 7;
              return (
                <tr
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                    selectedId === s.id ? "bg-slate-100" : ""
                  }`}
                >
                  <td className="p-3">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900">{fullName(s.user)}</div>
                      <div className="truncate text-xs text-slate-500">{s.user?.email ?? "—"}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.plan === "premium" ? "bg-violet-100 text-violet-800" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {s.plan}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(s.status)}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700">
                    {periodStart} → {periodEnd}
                  </td>
                  <td className="p-3">
                    <span className={renewalSoon ? "font-medium text-amber-700" : "text-slate-700"}>
                      {formatShortDate(s.current_period_end)}
                      {renewalSoon && daysToRenewal !== null && (
                        <span className="ml-1 text-xs">({daysToRenewal}d)</span>
                      )}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-slate-600">
                    {shortStripeId(s.stripe_subscription_id)}
                  </td>
                  <td className="p-3 text-right text-slate-500">{formatDate(s.created_at)}</td>
                </tr>
              );
            })}
            {subscriptions.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  Aucun abonnement ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 px-4 py-2">
          <span className="text-xs text-slate-500">
            {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)} sur {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex h-8 w-8 items-center justify-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="Page précédente"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs text-slate-600">
              Page {currentPage} sur {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="Page suivante"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
