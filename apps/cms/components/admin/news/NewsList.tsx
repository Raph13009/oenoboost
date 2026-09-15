"use client";

import { useMemo, useState } from "react";
import type { NewsArticleListItem } from "@/app/admin/(cms)/news/actions";
import {
  DEFAULT_STATUS_FILTER,
  ListPanelHeader,
  STATUS_FILTER_OPTIONS,
} from "@/components/admin/ListPanelHeader";

type Props = {
  articles: NewsArticleListItem[];
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

export function NewsList({
  articles,
  search,
  onSearchChange,
  selectedId,
  onSelect,
  onNew,
}: Props) {
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = articles;
    if (q) {
      list = list.filter(
        (a) =>
          a.title_fr.toLowerCase().includes(q) ||
          a.title_en?.toLowerCase().includes(q) ||
          a.slug.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }
    return list;
  }, [articles, search, statusFilter]);

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
        searchPlaceholder="Rechercher des articles..."
        searchValue={search}
        onSearchChange={onSearchChange}
        filters={[statusFilterConfig]}
        onNew={onNew}
      />
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="p-2 font-medium">Titre (FR)</th>
              <th className="w-20 p-2 font-medium">Type</th>
              <th className="w-20 p-2 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr
                key={a.id}
                onClick={() => onSelect(a.id)}
                className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                  selectedId === a.id ? "bg-slate-100" : ""
                }`}
              >
                <td className="p-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span className="font-medium text-slate-900 line-clamp-2">
                      {a.title_fr || "—"}
                    </span>
                    {a.is_premium_early && (
                      <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                        Premium anticipé
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-2 text-slate-600">{a.content_type ?? "—"}</td>
                <td className="p-2">
                  <span className="inline-flex items-center gap-1.5">
                    <StatusDot status={a.status} />
                    <span className="text-slate-600">{a.status}</span>
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-sm text-slate-500">
                  {articles.length === 0
                    ? "Aucun article."
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
