"use client";

import { useMemo, useState } from "react";
import type { DictionaryTermListItem } from "@/app/admin/(cms)/dictionary/actions";
import {
  DEFAULT_STATUS_FILTER,
  ListPanelHeader,
  STATUS_FILTER_OPTIONS,
} from "@/components/admin/ListPanelHeader";

type Props = {
  terms: DictionaryTermListItem[];
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

export function DictionaryList({
  terms,
  search,
  onSearchChange,
  selectedId,
  onSelect,
  onNew,
}: Props) {
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = terms;
    if (q) {
      list = list.filter(
        (t) =>
          t.term_fr.toLowerCase().includes(q) ||
          t.term_en?.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((t) => t.status === statusFilter);
    }
    return list;
  }, [terms, search, statusFilter]);

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
        searchPlaceholder="Rechercher des termes..."
        searchValue={search}
        onSearchChange={onSearchChange}
        filters={[statusFilterConfig]}
        onNew={onNew}
      />
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="p-2 font-medium">Terme (FR)</th>
              <th className="w-20 p-2 font-medium text-right">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr
                key={t.id}
                onClick={() => onSelect(t.id)}
                className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                  selectedId === t.id ? "bg-slate-100" : ""
                }`}
              >
                <td className="p-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="font-medium text-slate-900 truncate">{t.term_fr}</span>
                    {t.is_premium && (
                      <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                        Premium
                      </span>
                    )}
                    {t.is_word_of_day && (
                      <span className="shrink-0 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-800">
                        Mot du jour
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-2 text-right">
                  <span className="inline-flex items-center justify-end gap-1.5">
                    <StatusDot status={t.status} />
                    <span className="text-slate-600">{t.status}</span>
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={2} className="p-4 text-center text-sm text-slate-500">
                  {terms.length === 0
                    ? "Aucun terme."
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
