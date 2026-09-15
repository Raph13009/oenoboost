"use client";

import { useMemo, useState } from "react";
import type { QuizQuestionListItem } from "@/app/admin/(cms)/quiz/actions";
import {
  DEFAULT_STATUS_FILTER,
  ListPanelHeader,
  STATUS_FILTER_OPTIONS,
} from "@/components/admin/ListPanelHeader";

type Props = {
  questions: QuizQuestionListItem[];
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

function uniqSorted(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b, "fr")
  );
}

export function QuizQuestionsList({
  questions,
  search,
  onSearchChange,
  selectedId,
  onSelect,
  onNew,
}: Props) {
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);
  const [themeFilter, setThemeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const themeOptions = useMemo(() => {
    const themes = uniqSorted(questions.map((q) => q.theme));
    return [{ value: "all", label: "Tous" }, ...themes.map((t) => ({ value: t, label: t }))];
  }, [questions]);

  const typeOptions = useMemo(() => {
    const types = uniqSorted(questions.map((q) => q.type));
    return [{ value: "all", label: "Tous" }, ...types.map((t) => ({ value: t, label: t }))];
  }, [questions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = questions;
    if (q) {
      list = list.filter(
        (x) => x.question_fr.toLowerCase().includes(q) || x.question_en.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((x) => x.status === statusFilter);
    if (themeFilter !== "all") list = list.filter((x) => (x.theme ?? "") === themeFilter);
    if (typeFilter !== "all") list = list.filter((x) => x.type === typeFilter);
    return list;
  }, [questions, search, statusFilter, themeFilter, typeFilter]);

  const filters = [
    {
      key: "theme",
      label: "Thème",
      value: themeFilter,
      options: themeOptions,
      onChange: setThemeFilter,
    },
    {
      key: "type",
      label: "Type",
      value: typeFilter,
      options: typeOptions,
      onChange: setTypeFilter,
    },
    {
      key: "status",
      label: "Statut",
      value: statusFilter,
      options: [...STATUS_FILTER_OPTIONS],
      onChange: setStatusFilter,
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col border-r border-slate-200 bg-white">
      <ListPanelHeader
        searchPlaceholder="Rechercher des questions..."
        searchValue={search}
        onSearchChange={onSearchChange}
        filters={filters}
        onNew={onNew}
      />
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="p-2 font-medium">Question (FR)</th>
              <th className="w-28 p-2 font-medium">Thème</th>
              <th className="w-24 p-2 font-medium">Type</th>
              <th className="w-24 p-2 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((x) => (
              <tr
                key={x.id}
                onClick={() => onSelect(x.id)}
                className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                  selectedId === x.id ? "bg-slate-100" : ""
                }`}
              >
                <td className="p-2">
                  <div className="line-clamp-2 font-medium text-slate-900">
                    {x.question_fr || "—"}
                  </div>
                </td>
                <td className="p-2 text-slate-600">{x.theme ?? "—"}</td>
                <td className="p-2 text-slate-600">{x.type}</td>
                <td className="p-2">
                  <span className="inline-flex items-center gap-1.5">
                    <StatusDot status={x.status} />
                    <span className="text-slate-600">{x.status}</span>
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-sm text-slate-500">
                  {questions.length === 0
                    ? "Aucune question."
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

