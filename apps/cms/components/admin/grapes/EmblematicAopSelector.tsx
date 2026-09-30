"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GrapeEmblematicAop } from "@/app/admin/(cms)/grapes/actions";
import {
  addGrapeEmblematicAop,
  getGrapeEmblematicAops,
  removeGrapeEmblematicAop,
  searchAopsForGrapeEmblematic,
} from "@/app/admin/(cms)/grapes/actions";

const labelClass = "block text-[11px] text-slate-500 mb-0.5";
const inputClass =
  "h-8 w-full rounded border border-slate-200 bg-white px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200";

type Props = {
  grapeId: string | null;
  onError: (message: string | null) => void;
};

/** Search/select curated emblematic AOPs for a grape fiche. */
export function EmblematicAopSelector({ grapeId, onError }: Props) {
  const [selected, setSelected] = useState<GrapeEmblematicAop[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: string; name: string; slug: string }>>(
    [],
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
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

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
    if (!grapeId) return;

    let active = true;
    getGrapeEmblematicAops(grapeId)
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
            : "Impossible de charger les AOP emblématiques.",
        );
      });

    return () => {
      active = false;
    };
  }, [grapeId, onError]);

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
    if (!open || !grapeId) return;
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);

    const timeoutId = window.setTimeout(() => {
      searchAopsForGrapeEmblematic(query)
        .then((items) => {
          if (requestIdRef.current !== currentRequestId) return;
          setResults(items);
        })
        .catch((err: unknown) => {
          if (requestIdRef.current !== currentRequestId) return;
          setResults([]);
          onError(
            err instanceof Error ? err.message : "Impossible de rechercher les AOP.",
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
  }, [grapeId, onError, open, query, syncDropdownPosition]);

  const visibleResults = useMemo(() => {
    const selectedIds = new Set(selected.map((item) => item.id));
    return results.filter((item) => !selectedIds.has(item.id));
  }, [results, selected]);

  const handleAdd = useCallback(
    async (aop: { id: string; name: string; slug: string }) => {
      if (!grapeId) return;
      if (selected.some((item) => item.id === aop.id)) return;

      onError(null);
      setBusyId(aop.id);
      const optimistic: GrapeEmblematicAop = {
        ...aop,
        sort_order: selected.length,
      };
      const previous = selected;
      setSelected((current) => [...current, optimistic]);
      setQuery("");
      inputRef.current?.focus();

      const res = await addGrapeEmblematicAop(grapeId, aop.id, selected.length);
      setBusyId((current) => (current === aop.id ? null : current));
      if (res.error) {
        setSelected(previous);
        onError(res.error);
        return;
      }
      const refreshed = await getGrapeEmblematicAops(grapeId);
      setSelected(refreshed);
    },
    [grapeId, onError, selected],
  );

  const handleRemove = useCallback(
    async (aop: GrapeEmblematicAop) => {
      if (!grapeId) return;
      onError(null);
      setBusyId(aop.id);
      const previous = selected;
      setSelected((current) => current.filter((item) => item.id !== aop.id));

      const res = await removeGrapeEmblematicAop(grapeId, aop.id);
      setBusyId((current) => (current === aop.id ? null : current));
      if (res.error) {
        setSelected(previous);
        onError(res.error);
      }
    },
    [grapeId, onError, selected],
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        AOP affichées en puces cliquables sur la fiche publique. Remplace l&apos;usage
        éditorial du champ texte « vins emblématiques » (conservé ci-dessous pour
        historique).
      </p>

      {!grapeId ? (
        <p className="text-xs text-amber-700">
          Enregistrez d&apos;abord le cépage pour pouvoir lier des AOP.
        </p>
      ) : (
        <>
          <div>
            <label className={labelClass}>Ajouter une AOP emblématique</label>
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
                placeholder="Rechercher une AOP…"
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
                  <p className="px-3 py-2 text-xs text-slate-500">Aucune AOP</p>
                ) : (
                  <ul className="py-1">
                    {visibleResults.map((aop) => (
                      <li key={aop.id}>
                        <button
                          type="button"
                          disabled={busyId === aop.id}
                          onClick={() => void handleAdd(aop)}
                          className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-100"
                        >
                          <span className="min-w-0 truncate text-slate-800">{aop.name}</span>
                          <span className="shrink-0 text-[10px] text-slate-400">
                            {aop.slug}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>,
              document.body,
            )}

          {selected.length === 0 ? (
            <p className="text-xs text-slate-500">Aucune AOP emblématique.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {selected.map((aop) => (
                <li
                  key={aop.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800"
                >
                  <span>{aop.name}</span>
                  <button
                    type="button"
                    disabled={busyId === aop.id}
                    onClick={() => void handleRemove(aop)}
                    className="text-slate-400 hover:text-red-600"
                    aria-label={`Retirer ${aop.name}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
