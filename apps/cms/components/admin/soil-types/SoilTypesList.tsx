"use client";

import { useMemo, useState } from "react";
import type { SoilTypeListItem } from "@/app/admin/(cms)/soil-types/actions";
import {
  DEFAULT_STATUS_FILTER,
  ListPanelHeader,
  STATUS_FILTER_OPTIONS,
} from "@/components/admin/ListPanelHeader";

type Props = {
  soilTypes: SoilTypeListItem[];
  search: string;
  onSearchChange: (v: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
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

export function SoilTypesList({
  soilTypes,
  search,
  onSearchChange,
  selectedId,
  onSelect,
  onNew,
}: Props) {
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = soilTypes;
    if (q) {
      list = list.filter(
        (s) =>
          s.name_fr.toLowerCase().includes(q) ||
          s.name_en?.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((s) => s.status === statusFilter);
    }
    return list;
  }, [soilTypes, search, statusFilter]);

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
        searchPlaceholder="Rechercher des sols..."
        searchValue={search}
        onSearchChange={onSearchChange}
        filters={[statusFilterConfig]}
        onNew={onNew}
      />
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="p-2 font-medium">Nom (FR)</th>
              <th className="p-2 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                  selectedId === s.id ? "bg-slate-100" : ""
                }`}
              >
                <td className="p-2 font-medium text-slate-900">{s.name_fr}</td>
                <td className="p-2 text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <StatusDot status={s.status} />
                    <span className="text-slate-700">{s.status}</span>
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={2} className="p-4 text-center text-sm text-slate-500">
                  {soilTypes.length === 0
                    ? "Aucun sol."
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

