"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@/app/admin/(cms)/users/actions";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  users: User[];
  total: number;
  currentPage: number;
  searchQuery: string;
  planFilter: string;
  levelFilter: string;
  onSearchChange: (q: string) => void;
  onPlanFilterChange: (plan: string) => void;
  onLevelFilterChange: (level: string) => void;
  onPageChange: (page: number) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  isPending?: boolean;
};

const PAGE_SIZE = 25;

function formatDate(s: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fullName(u: User): string {
  const first = (u.first_name ?? "").trim();
  const last = (u.last_name ?? "").trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;
  return "—";
}

export function UsersTable({
  users,
  total,
  currentPage,
  searchQuery,
  planFilter,
  levelFilter,
  onSearchChange,
  onPlanFilterChange,
  onLevelFilterChange,
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
      {/* Top bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3">
        <input
          type="search"
          placeholder="Rechercher par nom ou email..."
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
            value={levelFilter}
            onChange={(e) => onLevelFilterChange(e.target.value)}
            className="h-9 appearance-none rounded border border-slate-200 bg-white pl-2.5 pr-8 text-sm text-slate-700 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200"
            aria-label="Filtrer par niveau"
          >
            <option value="all">Tous les niveaux</option>
            <option value="beginner">Débutant</option>
            <option value="amateur">Amateur</option>
            <option value="enthusiast">Passionné</option>
            <option value="expert">Expert</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-400" aria-hidden />
        </div>
        {isPending && (
          <span className="text-xs text-slate-500">Mise à jour…</span>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-500">
            <tr>
              <th className="p-3 font-medium">Utilisateur</th>
              <th className="w-24 p-3 font-medium">Offre</th>
              <th className="w-28 p-3 font-medium">Niveau</th>
              <th className="w-24 p-3 font-medium">Série</th>
              <th className="w-28 p-3 font-medium">Statut</th>
              <th className="w-28 p-3 font-medium text-right">Créé le</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                onClick={() => onSelect(u.id)}
                className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                  selectedId === u.id ? "bg-slate-100" : ""
                }`}
              >
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-slate-200">
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-500">
                          {(u.first_name?.[0] ?? u.email?.[0] ?? "?").toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900">{fullName(u)}</div>
                      <div className="truncate text-xs text-slate-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.plan === "premium"
                        ? "bg-violet-100 text-violet-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {u.plan}
                  </span>
                </td>
                <td className="p-3">
                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {u.level}
                  </span>
                </td>
                <td className="p-3">
                  <span className="text-slate-700">
                    🔥 {u.streak_days} {u.streak_days === 1 ? "jour" : "jours"}
                  </span>
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                        u.is_verified ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                      aria-hidden
                    />
                    <span className={u.is_verified ? "text-slate-700" : "text-slate-500"}>
                      {u.is_verified ? "Vérifié" : "Non vérifié"}
                    </span>
                  </span>
                </td>
                <td className="p-3 text-right text-slate-500">{formatDate(u.created_at)}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Aucun utilisateur ne correspond aux filtres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
