"use client";

import { useEffect, useState } from "react";
import { getGrape, type Grape, type GrapeListItem } from "@/app/admin/(cms)/grapes/actions";
import { GrapesList } from "./GrapesList";
import { GrapeEditor } from "./GrapeEditor";

type Props = {
  grapes: GrapeListItem[];
};

export function GrapesView({ grapes }: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [selectedGrape, setSelectedGrape] = useState<Grape | null>(null);
  const [isLoadingGrape, setIsLoadingGrape] = useState(false);

  useEffect(() => {
    let active = true;
    if (selectedId === null || selectedId === "new") {
      setSelectedGrape(null);
      setIsLoadingGrape(false);
      return () => {
        active = false;
      };
    }
    setIsLoadingGrape(true);
    getGrape(selectedId)
      .then((grape) => {
        if (!active) return;
        setSelectedGrape(grape);
      })
      .finally(() => {
        if (!active) return;
        setIsLoadingGrape(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 w-[420px] shrink-0 flex-col overflow-hidden">
        <GrapesList
          grapes={grapes}
          search={search}
          onSearchChange={setSearch}
          selectedId={selectedId === "new" ? null : selectedId}
          onSelect={setSelectedId}
          onNew={() => setSelectedId("new")}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {selectedId === "new" ? (
          <GrapeEditor
            grape={null}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : selectedId !== null && isLoadingGrape ? (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Chargement du cépage...
          </div>
        ) : selectedId !== null && selectedGrape ? (
          <GrapeEditor
            grape={selectedGrape}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : selectedId !== null ? (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Cépage introuvable.
          </div>
        ) : (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Sélectionnez un cépage ou créez-en un.
          </div>
        )}
      </div>
    </div>
  );
}
