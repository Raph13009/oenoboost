"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AppellationDgcChild } from "@/app/admin/(cms)/appellations/actions";
import {
  addAppellationDgcChild,
  getAppellationDgcChildren,
  removeAppellationDgcChild,
  searchAopsForDgcChildren,
  updateAppellationDgcChildExplanation,
} from "@/app/admin/(cms)/appellations/actions";

const labelClass = "block text-[11px] text-slate-500 mb-0.5";
const inputClass =
  "h-8 w-full rounded border border-slate-200 bg-white px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200";
const textareaClass =
  "w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200";

type Props = {
  appellationId: string | null;
  enabled: boolean;
  onError: (message: string | null) => void;
};

export function DgcChildSelector({ appellationId, enabled, onError }: Props) {
  const [selected, setSelected] = useState<AppellationDgcChild[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: string; name: string; slug: string }>>(
    []
  );
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dropdownRect, setDropdownRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const saveTimers = useRef<Map<string, number>>(new Map());

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
    if (!appellationId) return;

    let active = true;
    getAppellationDgcChildren(appellationId)
      .then((items) => {
        if (!active) return;
        setSelected(items);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setSelected([]);
        onError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les DGC associées."
        );
      });

    return () => {
      active = false;
    };
  }, [appellationId, onError]);

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
    if (!open || !appellationId || !enabled) return;
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);

    const timeoutId = window.setTimeout(() => {
      searchAopsForDgcChildren(appellationId, query)
        .then((items) => {
          if (requestIdRef.current !== currentRequestId) return;
          setResults(items);
        })
        .catch((err: unknown) => {
          if (requestIdRef.current !== currentRequestId) return;
          setResults([]);
          onError(
            err instanceof Error ? err.message : "Impossible de rechercher les AOP."
          );
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
  }, [appellationId, enabled, onError, open, query, syncDropdownPosition]);

  useEffect(() => {
    const timers = saveTimers.current;
    return () => {
      Array.from(timers.values()).forEach((id) => window.clearTimeout(id));
      timers.clear();
    };
  }, []);

  const visibleResults = useMemo(() => {
    const selectedIds = new Set(selected.map((item) => item.id));
    return results.filter((item) => !selectedIds.has(item.id));
  }, [results, selected]);

  const handleAdd = useCallback(
    async (child: { id: string; name: string; slug: string }) => {
      if (!appellationId) return;
      onError(null);
      setBusyId(child.id);
      const optimistic: AppellationDgcChild = {
        id: child.id,
        name: child.name,
        slug: child.slug,
        explanation_fr: null,
        explanation_en: null,
        sort_order: selected.length,
        area_hectares: null,
      };
      const previous = selected;
      setSelected((current) => [...current, optimistic]);
      setQuery("");

      const res = await addAppellationDgcChild(appellationId, child.id);
      setBusyId((current) => (current === child.id ? null : current));
      if (res.error) {
        setSelected(previous);
        onError(res.error);
        return;
      }
      const refreshed = await getAppellationDgcChildren(appellationId);
      setSelected(refreshed);
    },
    [appellationId, onError, selected]
  );

  const handleRemove = useCallback(
    async (child: AppellationDgcChild) => {
      if (!appellationId) return;
      onError(null);
      setBusyId(child.id);
      const previous = selected;
      setSelected((current) => current.filter((item) => item.id !== child.id));
      const res = await removeAppellationDgcChild(appellationId, child.id);
      setBusyId((current) => (current === child.id ? null : current));
      if (res.error) {
        setSelected(previous);
        onError(res.error);
      }
    },
    [appellationId, onError, selected]
  );

  const scheduleExplanationSave = useCallback(
    (childId: string, fr: string | null, en: string | null) => {
      if (!appellationId) return;
      const existing = saveTimers.current.get(childId);
      if (existing) window.clearTimeout(existing);
      const timer = window.setTimeout(() => {
        void updateAppellationDgcChildExplanation(appellationId, childId, fr, en).then(
          (res) => {
            if (res.error) onError(res.error);
          }
        );
      }, 450);
      saveTimers.current.set(childId, timer);
    },
    [appellationId, onError]
  );

  if (!enabled) {
    return (
      <p className="text-xs text-slate-500">
        Cochez « AOP parente (DGC) » pour rattacher des appellations filles de la même
        région.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Les DGC restent des entités carte distinctes. Sur l&apos;app publique, le clic
        ouvre la fiche de cette AOP parente, avec une section DGC en bas.
      </p>

      {!appellationId ? (
        <p className="text-xs text-amber-700">
          Enregistrez d&apos;abord l&apos;AOP pour pouvoir lier des DGC.
        </p>
      ) : (
        <>
          <div>
            <label className={labelClass}>Ajouter une DGC / appellation fille</label>
            <div ref={rootRef} className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Rechercher dans la même région…"
                className={inputClass}
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
                  <p className="px-3 py-2 text-xs text-slate-500">Aucune AOP disponible</p>
                ) : (
                  <ul className="py-1">
                    {visibleResults.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => void handleAdd(item)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-100"
                        >
                          <span className="min-w-0 truncate text-slate-800">{item.name}</span>
                          <span className="shrink-0 text-[10px] text-slate-400">
                            {item.slug}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>,
              document.body
            )}

          {selected.length === 0 ? (
            <p className="text-xs text-slate-500">Aucune DGC rattachée.</p>
          ) : (
            <ul className="space-y-3">
              {selected.map((child) => (
                <li
                  key={child.id}
                  className="rounded-md border border-slate-200 bg-white p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{child.name}</p>
                      <p className="text-[11px] text-slate-500">{child.slug}</p>
                    </div>
                    <button
                      type="button"
                      disabled={busyId === child.id}
                      onClick={() => void handleRemove(child)}
                      className="text-xs text-slate-400 hover:text-red-600"
                    >
                      Retirer
                    </button>
                  </div>
                  <div>
                    <label className={labelClass}>Explication courte (FR)</label>
                    <textarea
                      rows={2}
                      className={textareaClass}
                      value={child.explanation_fr ?? ""}
                      onChange={(e) => {
                        const value = e.target.value || null;
                        setSelected((current) =>
                          current.map((item) =>
                            item.id === child.id
                              ? { ...item, explanation_fr: value }
                              : item
                          )
                        );
                        scheduleExplanationSave(
                          child.id,
                          value,
                          child.explanation_en
                        );
                      }}
                      placeholder="Texte affiché dans la section DGC de la fiche parente…"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Explication courte (EN)</label>
                    <textarea
                      rows={2}
                      className={textareaClass}
                      value={child.explanation_en ?? ""}
                      onChange={(e) => {
                        const value = e.target.value || null;
                        setSelected((current) =>
                          current.map((item) =>
                            item.id === child.id
                              ? { ...item, explanation_en: value }
                              : item
                          )
                        );
                        scheduleExplanationSave(
                          child.id,
                          child.explanation_fr,
                          value
                        );
                      }}
                      placeholder="Short copy for the parent fiche DGC section…"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
