"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AppellationLinkedGrape } from "@/app/admin/(cms)/appellations/actions";
import {
  addAppellationGrapeLink,
  getAppellationGrapeLinkItems,
  removeAppellationGrapeLink,
  searchGrapesForAppellationLinks,
  setAppellationGrapeLinkColor,
  setAppellationGrapeLinkRole,
} from "@/app/admin/(cms)/appellations/actions";
import {
  filterGrapeSearchForColor,
  isGrapeWineColor,
  producedGrapeColors,
  type GrapeWineColor,
} from "@/lib/aop-grape-colors";
import {
  WINE_COLOR_LABELS,
  type WineColorBreakdown,
} from "@/lib/aop-wine-color-breakdown";

const labelClass = "block text-[11px] text-slate-500 mb-0.5";
const inputClass =
  "h-8 w-full rounded border border-slate-200 bg-white px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200";

type SearchGrape = Omit<AppellationLinkedGrape, "is_primary" | "wine_color">;

type Props = {
  appellationId: string | null;
  winePct: WineColorBreakdown;
  onError: (message: string | null) => void;
};

export function GrapeLinkSelector({ appellationId, winePct, onError }: Props) {
  const [selected, setSelected] = useState<AppellationLinkedGrape[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchGrape[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeColor, setActiveColor] = useState<GrapeWineColor | null>(null);
  const [dropdownRect, setDropdownRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Partial<Record<GrapeWineColor, HTMLInputElement | null>>>({});
  const panelRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  const producedColors = useMemo(() => producedGrapeColors(winePct), [winePct]);
  const producedSet = useMemo(() => new Set(producedColors), [producedColors]);

  const sortGrapes = useCallback((items: AppellationLinkedGrape[]) => {
    return [...items].sort((a, b) =>
      a.name_fr.localeCompare(b.name_fr, "fr", { sensitivity: "base" })
    );
  }, []);

  const syncDropdownPosition = useCallback(() => {
    const input = activeColor ? inputRefs.current[activeColor] : null;
    if (!input) {
      setDropdownRect(null);
      return;
    }
    const rect = input.getBoundingClientRect();
    setDropdownRect({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  }, [activeColor]);

  useEffect(() => {
    setSelected([]);
    setQuery("");
    setResults([]);
    setOpen(false);
    setActiveIndex(0);
    setActiveColor(null);
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
    if (results.length === 0 || !activeColor) return [];
    return filterGrapeSearchForColor(results, selected, activeColor);
  }, [activeColor, results, selected]);

  const linkKey = useCallback(
    (grapeId: string, wineColor: GrapeWineColor | null) =>
      `${grapeId}:${wineColor ?? "null"}`,
    [],
  );

  useEffect(() => {
    if (activeIndex < visibleResults.length) return;
    setActiveIndex(visibleResults.length > 0 ? visibleResults.length - 1 : 0);
  }, [activeIndex, visibleResults.length]);

  const handleAdd = useCallback(
    async (grape: SearchGrape, isPrimary: boolean, wineColor: GrapeWineColor) => {
      if (!appellationId) return;
      if (
        selected.some(
          (item) => item.id === grape.id && item.wine_color === wineColor
        )
      ) {
        return;
      }

      onError(null);
      const key = linkKey(grape.id, wineColor);
      setBusyKey(key);
      const nextItem: AppellationLinkedGrape = {
        ...grape,
        is_primary: isPrimary,
        wine_color: wineColor,
      };
      const previous = selected;
      setSelected((current) => sortGrapes([...current, nextItem]));
      setQuery("");
      inputRefs.current[wineColor]?.focus();

      const res = await addAppellationGrapeLink(
        appellationId,
        grape.id,
        isPrimary,
        wineColor
      );
      setBusyKey((current) => (current === key ? null : current));

      if (res.error) {
        setSelected(previous);
        onError(res.error);
      }
    },
    [appellationId, linkKey, onError, selected, sortGrapes]
  );

  const handleToggleRole = useCallback(
    async (grape: AppellationLinkedGrape) => {
      if (!appellationId) return;
      const nextPrimary = !grape.is_primary;
      onError(null);
      const key = linkKey(grape.id, grape.wine_color);
      setBusyKey(key);
      const previous = selected;
      setSelected((current) =>
        current.map((item) =>
          item.id === grape.id && item.wine_color === grape.wine_color
            ? { ...item, is_primary: nextPrimary }
            : item
        )
      );

      const res = await setAppellationGrapeLinkRole(
        appellationId,
        grape.id,
        nextPrimary,
        grape.wine_color
      );
      setBusyKey((current) => (current === key ? null : current));
      if (res.error) {
        setSelected(previous);
        onError(res.error);
      }
    },
    [appellationId, linkKey, onError, selected]
  );

  const handleSetColor = useCallback(
    async (grape: AppellationLinkedGrape, wineColor: GrapeWineColor) => {
      if (!appellationId) return;
      if (
        selected.some(
          (item) =>
            item.id === grape.id &&
            item.wine_color === wineColor &&
            item.wine_color !== grape.wine_color
        )
      ) {
        onError("Ce cépage est déjà lié pour cette couleur.");
        return;
      }
      onError(null);
      const key = linkKey(grape.id, grape.wine_color);
      setBusyKey(key);
      const previous = selected;
      setSelected((current) =>
        current.map((item) =>
          item.id === grape.id && item.wine_color === grape.wine_color
            ? { ...item, wine_color: wineColor }
            : item
        )
      );

      const res = await setAppellationGrapeLinkColor(
        appellationId,
        grape.id,
        wineColor,
        grape.wine_color
      );
      setBusyKey((current) => (current === key ? null : current));
      if (res.error) {
        setSelected(previous);
        onError(res.error);
      }
    },
    [appellationId, linkKey, onError, selected]
  );

  const handleRemove = useCallback(
    async (grape: AppellationLinkedGrape) => {
      if (!appellationId) return;
      onError(null);
      const key = linkKey(grape.id, grape.wine_color);
      setBusyKey(key);
      const previous = selected;
      setSelected((current) =>
        current.filter(
          (item) =>
            !(item.id === grape.id && item.wine_color === grape.wine_color)
        )
      );

      const res = await removeAppellationGrapeLink(
        appellationId,
        grape.id,
        grape.wine_color
      );
      setBusyKey((current) => (current === key ? null : current));
      if (res.error) {
        setSelected(previous);
        onError(res.error);
      }
    },
    [appellationId, linkKey, onError, selected]
  );

  const unclassified = selected.filter(
    (grape) => grape.wine_color == null || !producedSet.has(grape.wine_color)
  );

  return (
    <div className="space-y-3" ref={rootRef}>
      <p className="text-xs text-slate-500">
        Un cépage peut être lié une fois par couleur produite (part supérieure à 0), avec un
        rôle propre à chaque lien. Les <strong>principaux</strong> apparaissent dans
        l&apos;aperçu gratuit ; les <strong>accessoires</strong> seulement sur la fiche
        complète. Les cépages non classés restent hors fiche publique.
      </p>

      {!appellationId ? (
        <p className="text-xs text-amber-700">
          Enregistrez d&apos;abord l&apos;AOP pour pouvoir lier des cépages.
        </p>
      ) : (
        <>
          {producedColors.length === 0 ? (
            <p className="text-xs text-amber-700">
              Renseignez la répartition par couleur (une part supérieure à 0) pour lier de
              nouveaux cépages.
            </p>
          ) : (
            producedColors.map((color) => {
              const inColor = selected.filter((grape) => grape.wine_color === color);
              return (
                <ColorGrapeSection
                  key={color}
                  color={color}
                  items={inColor}
                  busyKey={busyKey}
                  linkKey={linkKey}
                  query={activeColor === color ? query : ""}
                  inputRef={(node) => {
                    inputRefs.current[color] = node;
                  }}
                  onQueryChange={(value) => {
                    setActiveColor(color);
                    setQuery(value);
                    setOpen(true);
                  }}
                  onFocus={() => {
                    setActiveColor(color);
                    setOpen(true);
                    syncDropdownPosition();
                  }}
                  onToggleRole={handleToggleRole}
                  onRemove={handleRemove}
                />
              );
            })
          )}

          {open &&
            activeColor &&
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
                    {visibleResults.map((grape, index) => {
                      const addBusy = busyKey === linkKey(grape.id, activeColor);
                      return (
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
                              disabled={addBusy}
                              onClick={() => void handleAdd(grape, true, activeColor)}
                              className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Principal
                            </button>
                            <button
                              type="button"
                              disabled={addBusy}
                              onClick={() => void handleAdd(grape, false, activeColor)}
                              className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Accessoire
                            </button>
                          </span>
                        </div>
                      </li>
                      );
                    })}
                  </ul>
                )}
              </div>,
              document.body
            )}

          <UnclassifiedGrapes
            items={unclassified}
            producedColors={producedColors}
            busyKey={busyKey}
            linkKey={linkKey}
            onToggleRole={handleToggleRole}
            onSetColor={handleSetColor}
            onRemove={handleRemove}
          />
        </>
      )}
    </div>
  );
}

function ColorGrapeSection({
  color,
  items,
  busyKey,
  linkKey,
  query,
  inputRef,
  onQueryChange,
  onFocus,
  onToggleRole,
  onRemove,
}: {
  color: GrapeWineColor;
  items: AppellationLinkedGrape[];
  busyKey: string | null;
  linkKey: (grapeId: string, wineColor: GrapeWineColor | null) => string;
  query: string;
  inputRef: (node: HTMLInputElement | null) => void;
  onQueryChange: (value: string) => void;
  onFocus: () => void;
  onToggleRole: (grape: AppellationLinkedGrape) => void;
  onRemove: (grape: AppellationLinkedGrape) => void;
}) {
  const mainGrapes = items.filter((grape) => grape.is_primary);
  const accessoryGrapes = items.filter((grape) => !grape.is_primary);

  return (
    <section className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">
        {WINE_COLOR_LABELS[color]}
      </p>
      <div>
        <label className={labelClass}>Ajouter un cépage</label>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onFocus={onFocus}
          placeholder="Rechercher un cépage…"
          className={inputClass}
        />
      </div>
      <GrapeRoleList
        title="Cépages principaux"
        items={mainGrapes}
        busyKey={busyKey}
        linkKey={linkKey}
        onToggleRole={onToggleRole}
        onRemove={onRemove}
        emptyLabel="Aucun cépage principal."
      />
      <GrapeRoleList
        title="Cépages accessoires"
        items={accessoryGrapes}
        busyKey={busyKey}
        linkKey={linkKey}
        onToggleRole={onToggleRole}
        onRemove={onRemove}
        emptyLabel="Aucun cépage accessoire."
      />
    </section>
  );
}

function UnclassifiedGrapes({
  items,
  producedColors,
  busyKey,
  linkKey,
  onToggleRole,
  onSetColor,
  onRemove,
}: {
  items: AppellationLinkedGrape[];
  producedColors: GrapeWineColor[];
  busyKey: string | null;
  linkKey: (grapeId: string, wineColor: GrapeWineColor | null) => string;
  onToggleRole: (grape: AppellationLinkedGrape) => void;
  onSetColor: (grape: AppellationLinkedGrape, color: GrapeWineColor) => void;
  onRemove: (grape: AppellationLinkedGrape) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
        À classer
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((grape) => {
          const key = linkKey(grape.id, grape.wine_color);
          return (
          <li
            key={key}
            className="flex flex-wrap items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-slate-800"
          >
            <span>{grape.name_fr}</span>
            {grape.wine_color ? (
              <span className="text-[10px] text-amber-800">
                {WINE_COLOR_LABELS[grape.wine_color]} n&apos;est plus produit
              </span>
            ) : null}
            <button
              type="button"
              disabled={busyKey === key}
              onClick={() => onToggleRole(grape)}
              className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-100"
            >
              {grape.is_primary ? "Principal" : "Accessoire"}
            </button>
            {producedColors.length > 0 ? (
              <select
                className="h-6 rounded border border-slate-200 bg-white px-1 text-[10px] text-slate-700"
                value=""
                disabled={busyKey === key}
                onChange={(event) => {
                  const next = event.target.value;
                  if (isGrapeWineColor(next)) onSetColor(grape, next);
                }}
                aria-label={`Classer ${grape.name_fr}`}
              >
                <option value="">Classer…</option>
                {producedColors.map((color) => (
                  <option key={color} value={color}>
                    {WINE_COLOR_LABELS[color]}
                  </option>
                ))}
              </select>
            ) : null}
            <button
              type="button"
              disabled={busyKey === key}
              onClick={() => onRemove(grape)}
              className="text-slate-400 hover:text-red-600"
              aria-label={`Retirer ${grape.name_fr}`}
            >
              ×
            </button>
          </li>
          );
        })}
      </ul>
    </div>
  );
}

function GrapeRoleList({
  title,
  items,
  busyKey,
  linkKey,
  onToggleRole,
  onRemove,
  emptyLabel,
}: {
  title: string;
  items: AppellationLinkedGrape[];
  busyKey: string | null;
  linkKey: (grapeId: string, wineColor: GrapeWineColor | null) => string;
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
          {items.map((grape) => {
            const key = linkKey(grape.id, grape.wine_color);
            return (
            <li
              key={key}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800"
            >
              <span>{grape.name_fr}</span>
              <button
                type="button"
                disabled={busyKey === key}
                onClick={() => onToggleRole(grape)}
                className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-200"
                title={grape.is_primary ? "Passer en accessoire" : "Passer en principal"}
              >
                {grape.is_primary ? "→ acc." : "→ princ."}
              </button>
              <button
                type="button"
                disabled={busyKey === key}
                onClick={() => onRemove(grape)}
                className="text-slate-400 hover:text-red-600"
                aria-label={`Retirer ${grape.name_fr}`}
              >
                ×
              </button>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
