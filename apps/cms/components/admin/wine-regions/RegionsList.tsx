"use client";

import { useState, useMemo } from "react";
import type { WineRegionListItem } from "@/app/admin/(cms)/wine-regions/actions";
import {
  ListPanelHeader,
  STATUS_FILTER_OPTIONS,
  DEFAULT_STATUS_FILTER,
} from "@/components/admin/ListPanelHeader";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  regions: WineRegionListItem[];
  search: string;
  onSearchChange: (v: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  currentPage: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
};

function StatusDot({ status }: { status: string }) {
  const color =
    status === "published"
      ? "bg-emerald-500"
      : status === "draft"
        ? "bg-amber-400"
        : "bg-slate-400";
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${color}`}
      title={status}
      aria-hidden
    />
  );
}

export function RegionsList({
  regions,
  search,
  onSearchChange,
  selectedId,
  onSelect,
  onNew,
  currentPage,
  hasPrev,
  hasNext,
  onPageChange,
}: Props) {
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = regions;
    if (q) {
      list = list.filter(
        (r) =>
          r.name_fr.toLowerCase().includes(q) ||
          r.name_en?.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }
    return list;
  }, [regions, search, statusFilter]);

  const statusFilterConfig = {
    key: "status",
    label: "Statut",
    value: statusFilter,
    options: [...STATUS_FILTER_OPTIONS],
    onChange: setStatusFilter,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col border-r border-slate-200 bg-white">
      <ListPanelHeader
        searchPlaceholder="Rechercher des régions..."
        searchValue={search}
        onSearchChange={onSearchChange}
        filters={[statusFilterConfig]}
        onNew={onNew}
      />
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
        <div className="text-xs font-medium text-slate-600">
          Page <span className="font-mono">{currentPage}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPrev}
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Préc.
          </button>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNext}
            className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
          >
            Suiv.
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto pb-2">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="w-10 pl-4 pr-1 py-2 font-medium" aria-label="Statut" />
              <th className="p-2 font-medium">Nom (FR)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                onClick={() => onSelect(r.id)}
                className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                  selectedId === r.id ? "bg-slate-100" : ""
                }`}
              >
                <td className="pl-4 pr-1 py-2">
                  <StatusDot status={r.status} />
                </td>
                <td className="p-2 font-medium text-slate-900">{r.name_fr}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={2} className="p-4 text-center text-sm text-slate-500">
                  {regions.length === 0
                    ? "Aucune région."
                    : "Aucun résultat pour cette recherche ou ces filtres."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
