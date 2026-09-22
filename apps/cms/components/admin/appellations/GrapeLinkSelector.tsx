"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AppellationLinkedGrape } from "@/app/admin/(cms)/appellations/actions";
import {
  addAppellationGrapeLink,
  getAppellationGrapeLinkItems,
  removeAppellationGrapeLink,
  searchGrapesForAppellationLinks,
  setAppellationGrapeLinkRole,
} from "@/app/admin/(cms)/appellations/actions";

const labelClass = "block text-[11px] text-slate-500 mb-0.5";
const inputClass =
  "h-8 w-full rounded border border-slate-200 bg-white px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200";

type Props = {
  appellationId: string | null;
  onError: (message: string | null) => void;
};

export function GrapeLinkSelector({ appellationId, onError }: Props) {
  const [selected, setSelected] = useState<AppellationLinkedGrape[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Omit<AppellationLinkedGrape, "is_primary">[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownRect, setDropdownRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  const sortGrapes = useCallback((items: AppellationLinkedGrape[]) => {
    return [...items].sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.name_fr.localeCompare(b.name_fr, "fr", { sensitivity: "base" });
    });
  }, []);

  const syncDropdownPosition = useCallback(() => {
    if (!rootRef.current) {
      setDropdownRect(null);
      return;
    }
    const rect = rootRef.current.getBoundingClientRect();
    setDropdownRect({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    setSelected([]);
    setQuery("");
    setResults([]);
    setOpen(false);
    setActiveIndex(0);
    if (!appellationId) return;

    let active = true;
    getAppellationGrapeLinkItems(appellationId)
      .then((items) => {
        if (!active) return;
        setSelected(sortGrapes(items));
      })
      .catch((err: unknown) => {
        if (!active) return;
        setSelected([]);
        onError(
          err instanceof Error ? err.message : "Impossible de charger les cépages associés."
        );
      });

    return () => {
      active = false;
    };
  }, [appellationId, onError, sortGrapes]);

  useEffect(() => {
    if (!open) return;
    syncDropdownPosition();

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleViewportChange() {
      syncDropdownPosition();
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, syncDropdownPosition]);

  useEffect(() => {
    if (!open || !appellationId) return;
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);

    const timeoutId = window.setTimeout(() => {
      searchGrapesForAppellationLinks(query)
        .then((items) => {
          if (requestIdRef.current !== currentRequestId) return;
          setResults(items);
          setActiveIndex(0);
        })
        .catch((err: unknown) => {
          if (requestIdRef.current !== currentRequestId) return;
          setResults([]);
          onError(err instanceof Error ? err.message : "Impossible de rechercher les cépages.");
        })
        .finally(() => {
          if (requestIdRef.current !== currentRequestId) return;
          setLoading(false);
          syncDropdownPosition();
        });
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [appellationId, onError, open, query, syncDropdownPosition]);

  const visibleResults = useMemo(() => {
    if (results.length === 0) return [];
    const selectedIds = new Set(selected.map((item) => item.id));
    return results.filter((item) => !selectedIds.has(item.id));
  }, [results, selected]);

  useEffect(() => {
    if (activeIndex < visibleResults.length) return;
    setActiveIndex(visibleResults.length > 0 ? visibleResults.length - 1 : 0);
  }, [activeIndex, visibleResults.length]);

  const handleAdd = useCallback(
    async (grape: Omit<AppellationLinkedGrape, "is_primary">, isPrimary: boolean) => {
      if (!appellationId) return;
      if (selected.some((item) => item.id === grape.id)) return;

      onError(null);
      setBusyId(grape.id);
      const nextItem: AppellationLinkedGrape = { ...grape, is_primary: isPrimary };
      const previous = selected;
      setSelected((current) => sortGrapes([...current, nextItem]));
      setQuery("");
      inputRef.current?.focus();

      const res = await addAppellationGrapeLink(appellationId, grape.id, isPrimary);
      setBusyId((current) => (current === grape.id ? null : current));

      if (res.error) {
        setSelected(previous);
        onError(res.error);
      }
    },
    [appellationId, onError, selected, sortGrapes]
  );

  const handleToggleRole = useCallback(
    async (grape: AppellationLinkedGrape) => {
      if (!appellationId) return;
      const nextPrimary = !grape.is_primary;
      onError(null);
      setBusyId(grape.id);
      const previous = selected;
      setSelected((current) =>
        sortGrapes(
          current.map((item) =>
            item.id === grape.id ? { ...item, is_primary: nextPrimary } : item
          )
        )
      );

      const res = await setAppellationGrapeLinkRole(appellationId, grape.id, nextPrimary);
      setBusyId((current) => (current === grape.id ? null : current));
      if (res.error) {
        setSelected(previous);
        onError(res.error);
      }
    },
    [appellationId, onError, selected, sortGrapes]
  );

  const handleRemove = useCallback(
    async (grape: AppellationLinkedGrape) => {
      if (!appellationId) return;
      onError(null);
      setBusyId(grape.id);
      const previous = selected;
      setSelected((current) => current.filter((item) => item.id !== grape.id));

      const res = await removeAppellationGrapeLink(appellationId, grape.id);
      setBusyId((current) => (current === grape.id ? null : current));
      if (res.error) {
        setSelected(previous);
        onError(res.error);
      }
    },
    [appellationId, onError, selected]
  );

  const mainGrapes = selected.filter((g) => g.is_primary);
  const accessoryGrapes = selected.filter((g) => !g.is_primary);

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Liez des cépages existants. Les <strong>principaux / classiques</strong> apparaissent dans
        l&apos;aperçu gratuit ; les <strong>accessoires</strong> seulement sur la fiche complète.
      </p>

      {!appellationId ? (
        <p className="text-xs text-amber-700">
          Enregistrez d&apos;abord l&apos;AOP pour pouvoir lier des cépages.
        </p>
      ) : (
        <>
          <div>
            <label className={labelClass}>Ajouter un cépage</label>
            <div ref={rootRef} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Rechercher un cépage…"
                className={inputClass}
                disabled={!appellationId}
              />
            </div>
          </div>

          {open &&
            dropdownRect &&
            createPortal(
              <div
                ref={panelRef}
                className="z-[80] max-h-56 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg"
                style={{
                  position: "fixed",
                  top: dropdownRect.top,
                  left: dropdownRect.left,
                  width: dropdownRect.width,
                }}
              >
                {loading ? (
                  <p className="px-3 py-2 text-xs text-slate-500">Recherche…</p>
                ) : visibleResults.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-500">Aucun cépage</p>
                ) : (
                  <ul className="py-1">
                    {visibleResults.map((grape, index) => (
                      <li key={grape.id}>
                        <div
                          className={`flex items-center justify-between gap-2 px-3 py-1.5 text-sm ${
                            index === activeIndex ? "bg-slate-100" : ""
                          }`}
                        >
                          <span className="min-w-0 truncate text-slate-800">{grape.name_fr}</span>
                          <span className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              disabled={busyId === grape.id}
                              onClick={() => void handleAdd(grape, true)}
                              className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Principal
                            </button>
                            <button
                              type="button"
                              disabled={busyId === grape.id}
                              onClick={() => void handleAdd(grape, false)}
                              className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Accessoire
                            </button>
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>,
              document.body
            )}

          <GrapeRoleList
            title="Cépages principaux"
            items={mainGrapes}
            busyId={busyId}
            onToggleRole={handleToggleRole}
            onRemove={handleRemove}
            emptyLabel="Aucun cépage principal."
          />
          <GrapeRoleList
            title="Cépages accessoires"
            items={accessoryGrapes}
            busyId={busyId}
            onToggleRole={handleToggleRole}
            onRemove={handleRemove}
            emptyLabel="Aucun cépage accessoire."
          />
        </>
      )}
    </div>
  );
}

function GrapeRoleList({
  title,
  items,
  busyId,
  onToggleRole,
  onRemove,
  emptyLabel,
}: {
  title: string;
  items: AppellationLinkedGrape[];
  busyId: string | null;
  onToggleRole: (grape: AppellationLinkedGrape) => void;
  onRemove: (grape: AppellationLinkedGrape) => void;
  emptyLabel: string;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((grape) => (
            <li
              key={grape.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800"
            >
              <span>{grape.name_fr}</span>
              <button
                type="button"
                disabled={busyId === grape.id}
                onClick={() => onToggleRole(grape)}
                className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-200"
                title={
                  grape.is_primary
                    ? "Passer en accessoire"
                    : "Passer en principal"
                }
              >
                {grape.is_primary ? "→ acc." : "→ princ."}
              </button>
              <button
                type="button"
                disabled={busyId === grape.id}
                onClick={() => onRemove(grape)}
                className="text-slate-400 hover:text-red-600"
                aria-label={`Retirer ${grape.name_fr}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
