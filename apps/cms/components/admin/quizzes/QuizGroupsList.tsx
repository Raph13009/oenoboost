"use client";

import { useMemo, useState } from "react";
import type { QuizGroupListItem } from "@/app/admin/(cms)/quizzes/actions";
import {
  DEFAULT_STATUS_FILTER,
  ListPanelHeader,
  STATUS_FILTER_OPTIONS,
} from "@/components/admin/ListPanelHeader";

type Props = {
  quizzes: QuizGroupListItem[];
  search: string;
  onSearchChange: (value: string) => void;
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
      aria-hidden
    />
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
      {type}
    </span>
  );
}

function uniqSorted(values: (string | null | undefined)[]) {
  return Array.from(new Set(values.filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b, "fr")
  );
}

export function QuizGroupsList({
  quizzes,
  search,
  onSearchChange,
  selectedId,
  onSelect,
  onNew,
}: Props) {
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);
  const [typeFilter, setTypeFilter] = useState("all");

  const typeOptions = useMemo(() => {
    const types = uniqSorted(quizzes.map((quiz) => quiz.type));
    return [{ value: "all", label: "Tous les types" }, ...types.map((type) => ({
      value: type,
      label: type,
    }))];
  }, [quizzes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = quizzes;

    if (q) {
      list = list.filter(
        (quiz) =>
          quiz.title_fr.toLowerCase().includes(q) ||
          (quiz.theme ?? "").toLowerCase().includes(q)
      );
    }

    if (typeFilter !== "all") {
      list = list.filter((quiz) => quiz.type === typeFilter);
    }

    if (statusFilter !== "all") {
      list = list.filter((quiz) => quiz.status === statusFilter);
    }

    return list;
  }, [quizzes, search, statusFilter, typeFilter]);

  return (
    <div className="flex min-h-0 flex-1 flex-col border-r border-slate-200 bg-white">
      <ListPanelHeader
        searchPlaceholder="Rechercher un quizz..."
        searchValue={search}
        onSearchChange={onSearchChange}
        filters={[
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
        ]}
        onNew={onNew}
      />

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="p-2 font-medium">Titre</th>
              <th className="w-32 p-2 font-medium">Type</th>
              <th className="w-32 p-2 font-medium">Thème</th>
              <th className="w-28 p-2 font-medium">Statut</th>
              <th className="w-24 p-2 text-right font-medium">Questions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((quiz) => (
              <tr
                key={quiz.id}
                onClick={() => onSelect(quiz.id)}
                className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                  selectedId === quiz.id ? "bg-slate-100" : ""
                }`}
              >
                <td className="p-2">
                  <div className="line-clamp-2 font-medium text-slate-900">
                    {quiz.title_fr || "—"}
                  </div>
                </td>
                <td className="p-2">
                  <TypeBadge type={quiz.type} />
                </td>
                <td className="p-2 text-slate-600">{quiz.theme ?? "—"}</td>
                <td className="p-2">
                  <span className="inline-flex items-center gap-1.5 text-slate-600">
                    <StatusDot status={quiz.status} />
                    {quiz.status === "published" ? "Publié" : "Brouillon"}
                  </span>
                </td>
                <td className="p-2 text-right font-medium text-slate-700">
                  {quiz.question_count}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-sm text-slate-500">
                  {quizzes.length === 0
                    ? "Aucun quizz."
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
