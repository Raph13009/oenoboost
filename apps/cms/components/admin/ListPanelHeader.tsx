"use client";

import { ChevronDown, Plus } from "lucide-react";

/** Reusable status filter options for list panels. */
export const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tous" },
  { value: "published", label: "Publié" },
  { value: "draft", label: "Brouillon" },
] as const;

export const DEFAULT_STATUS_FILTER = "all";

export type FilterConfig = {
  key: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

type Props = {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterConfig[];
  onNew: () => void;
};

export function ListPanelHeader({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters = [],
  onNew,
}: Props) {
  return (
    <div className="shrink-0 border-b border-slate-200 px-3 py-2">
      <div className="flex items-center">
        <input
          type="search"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 w-full rounded border border-slate-200 px-2.5 text-sm focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200"
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
          {filters.map((f) => (
            <div key={f.key} className="relative min-w-0 sm:shrink-0">
              <select
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                disabled={!!f.disabled}
                className={`h-9 w-full appearance-none rounded border pl-2.5 pr-7 text-sm focus:outline-none focus:ring-1 sm:w-auto ${
                  f.disabled
                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    : "border-slate-200 bg-white text-slate-700 focus:border-slate-300 focus:ring-slate-200"
                }`}
                aria-label={f.label}
              >
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={`pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${
                  f.disabled ? "text-slate-300" : "text-slate-400"
                }`}
                aria-hidden
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onNew}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Nouveau"
          title="Nouveau"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
