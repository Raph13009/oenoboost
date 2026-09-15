"use client";

import { useMemo, useState } from "react";
import type { GrapeListItem } from "@/app/admin/(cms)/grapes/actions";
import {
  ListPanelHeader,
  STATUS_FILTER_OPTIONS,
  DEFAULT_STATUS_FILTER,
} from "@/components/admin/ListPanelHeader";

type Props = {
  grapes: GrapeListItem[];
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

export function GrapesList({ grapes, search, onSearchChange, selectedId, onSelect, onNew }: Props) {
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = grapes;
    if (q) {
      list = list.filter(
        (g) =>
          g.name_fr.toLowerCase().includes(q) ||
          g.name_en?.toLowerCase().includes(q) ||
          g.slug.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((g) => g.status === statusFilter);
    }
    return list;
  }, [grapes, search, statusFilter]);

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
        searchPlaceholder="Rechercher des cépages..."
        searchValue={search}
        onSearchChange={onSearchChange}
        filters={[statusFilterConfig]}
        onNew={onNew}
      />
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="w-10 pl-4 pr-1 py-2 font-medium" aria-label="Statut" />
              <th className="p-2 font-medium">Nom (FR)</th>
              <th className="p-2 font-medium">Type</th>
              <th className="p-2 font-medium">Pays d'origine</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr
                key={g.id}
                onClick={() => onSelect(g.id)}
                className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                  selectedId === g.id ? "bg-slate-100" : ""
                }`}
              >
                <td className="pl-4 pr-1 py-2">
                  <StatusDot status={g.status} />
                </td>
                <td className="p-2 font-medium text-slate-900">{g.name_fr}</td>
                <td className="p-2 text-slate-600">{g.type ?? "—"}</td>
                <td className="p-2 text-slate-600">{g.origin_country ?? "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-sm text-slate-500">
                  {grapes.length === 0
                    ? "Aucun cépage."
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
