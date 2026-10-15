"use client";

import { useEffect, useState } from "react";
import {
  getClimateType,
  type ClimateType,
  type ClimateTypeListItem,
} from "@/app/admin/(cms)/climate-types/actions";
import { ClimateTypesList } from "./ClimateTypesList";
import { ClimateTypeEditor } from "./ClimateTypeEditor";

type Props = {
  climateTypes: ClimateTypeListItem[];
};

export function ClimateTypesView({ climateTypes }: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [selectedClimate, setSelectedClimate] = useState<ClimateType | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (selectedId === null || selectedId === "new") {
      setSelectedClimate(null);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }
    setIsLoading(true);
    getClimateType(selectedId)
      .then((climate) => {
        if (!active) return;
        setSelectedClimate(climate);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 w-[420px] shrink-0 flex-col overflow-hidden">
        <ClimateTypesList
          climateTypes={climateTypes}
          search={search}
          onSearchChange={setSearch}
          selectedId={selectedId === "new" ? null : selectedId}
          onSelect={setSelectedId}
          onNew={() => setSelectedId("new")}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {selectedId === "new" ? (
          <ClimateTypeEditor
            climateType={null}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
            onCreated={(id) => setSelectedId(id)}
          />
        ) : selectedId !== null && isLoading ? (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Chargement du climat...
          </div>
        ) : selectedId !== null && selectedClimate ? (
          <ClimateTypeEditor
            climateType={selectedClimate}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : selectedId !== null ? (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Climat introuvable.
          </div>
        ) : (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Sélectionnez un climat ou créez-en un nouveau.
          </div>
        )}
      </div>
    </div>
  );
}
