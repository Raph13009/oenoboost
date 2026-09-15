"use client";

import { useEffect, useState } from "react";
import {
  getSoilType,
  type SoilType,
  type SoilTypeListItem,
} from "@/app/admin/(cms)/soil-types/actions";
import { SoilTypesList } from "./SoilTypesList";
import { SoilTypeEditor } from "./SoilTypeEditor";

type Props = {
  soilTypes: SoilTypeListItem[];
};

export function SoilTypesView({ soilTypes }: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [selectedSoilType, setSelectedSoilType] = useState<SoilType | null>(null);
  const [isLoadingSoilType, setIsLoadingSoilType] = useState(false);

  useEffect(() => {
    let active = true;
    if (selectedId === null || selectedId === "new") {
      setSelectedSoilType(null);
      setIsLoadingSoilType(false);
      return () => {
        active = false;
      };
    }
    setIsLoadingSoilType(true);
    getSoilType(selectedId)
      .then((soilType) => {
        if (!active) return;
        setSelectedSoilType(soilType);
      })
      .finally(() => {
        if (!active) return;
        setIsLoadingSoilType(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 w-[420px] shrink-0 flex-col overflow-hidden">
        <SoilTypesList
          soilTypes={soilTypes}
          search={search}
          onSearchChange={setSearch}
          selectedId={selectedId === "new" ? null : selectedId}
          onSelect={setSelectedId}
          onNew={() => setSelectedId("new")}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {selectedId === "new" ? (
          <SoilTypeEditor
            soilType={null}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : selectedId !== null && isLoadingSoilType ? (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Chargement du sol...
          </div>
        ) : selectedId !== null && selectedSoilType ? (
          <SoilTypeEditor
            soilType={selectedSoilType}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : selectedId !== null ? (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Sol introuvable.
          </div>
        ) : (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Sélectionnez un sol ou créez-en un.
          </div>
        )}
      </div>
    </div>
  );
}

