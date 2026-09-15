"use client";

import { useState, useMemo } from "react";
import type { WineSubregionListItem } from "@/app/admin/(cms)/wine-subregions/actions";
import {
  ListPanelHeader,
  STATUS_FILTER_OPTIONS,
  DEFAULT_STATUS_FILTER,
} from "@/components/admin/ListPanelHeader";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TableSkeleton } from "@/components/admin/Loaders";

type RegionOption = { id: string; name_fr: string };

type Props = {
  subregions: WineSubregionListItem[];
  regions: RegionOption[];
  search: string;
  onSearchChange: (v: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  currentPage: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
  isLoadingList?: boolean;
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

export function SubregionsList({
  subregions,
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
  isLoadingList = false,
}: Props) {
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);
  const [regionFilter, setRegionFilter] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = subregions;
    if (q) {
      list = list.filter(
        (r) =>
          r.name_fr.toLowerCase().includes(q) ||
          r.name_en?.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q) ||
          r.region_name_fr?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (regionFilter !== "all") {
      list = list.filter((r) => r.region_id === regionFilter);
    }
    return list;
  }, [subregions, search, statusFilter, regionFilter]);

  const statusFilterConfig = {
    key: "status",
    label: "Statut",
    value: statusFilter,
    options: [...STATUS_FILTER_OPTIONS],
    onChange: setStatusFilter,
  };

  const regionOptions = [
    { value: "all", label: "Toutes" },
    ...regions.map((r) => ({ value: r.id, label: r.name_fr })),
  ];
  const regionFilterConfig = {
    key: "region",
    label: "Région",
    value: regionFilter,
    options: regionOptions,
    onChange: setRegionFilter,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col border-r border-slate-200 bg-white">
      <ListPanelHeader
        searchPlaceholder="Rechercher des sous-régions..."
        searchValue={search}
        onSearchChange={onSearchChange}
        filters={[statusFilterConfig, regionFilterConfig]}
        onNew={onNew}
      />
      <div className="flex flex-col items-start gap-2 border-b border-slate-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs font-medium text-slate-600">
          Page <span className="font-mono">{currentPage}</span>
        </div>
        <div className="flex w-full items-center justify-start gap-2 sm:w-auto">
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
      <div className={`flex-1 overflow-auto pb-2 transition-opacity duration-200 ${isLoadingList ? "opacity-70" : "opacity-100"}`}>
        {isLoadingList ? (
          <TableSkeleton rows={8} columns={4} />
        ) : (
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="w-10 pl-4 pr-1 py-2 font-medium" aria-label="Statut" />
              <th className="p-2 font-medium">Nom (FR)</th>
              <th className="p-2 font-medium">Région</th>
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
                <td className="p-2 text-slate-600">{r.region_name_fr ?? "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-sm text-slate-500">
                  {subregions.length === 0
                    ? "Aucune sous-région."
                    : "Aucun résultat pour cette recherche ou ces filtres."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}
