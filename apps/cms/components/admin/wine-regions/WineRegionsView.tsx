"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getWineRegion,
  type WineRegion,
  type WineRegionListItem,
} from "@/app/admin/(cms)/wine-regions/actions";
import { RegionsList } from "./RegionsList";
import { RegionEditor } from "./RegionEditor";

type Props = {
  regions: WineRegionListItem[];
  currentPage: number;
  hasPrev: boolean;
  hasNext: boolean;
};

export function WineRegionsView({ regions, currentPage, hasPrev, hasNext }: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<WineRegion | null>(null);
  const [isLoadingRegion, setIsLoadingRegion] = useState(false);
  const router = useRouter();

  const onPageChange = (nextPage: number) => {
    router.push(`?page=${nextPage}`);
  };

  useEffect(() => {
    if (!hasNext) return;
    router.prefetch(`?page=${currentPage + 1}`);
  }, [currentPage, hasNext, router]);

  useEffect(() => {
    let active = true;
    if (selectedId === null || selectedId === "new") {
      setSelectedRegion(null);
      setIsLoadingRegion(false);
      return () => {
        active = false;
      };
    }
    setIsLoadingRegion(true);
    getWineRegion(selectedId)
      .then((region) => {
        if (!active) return;
        setSelectedRegion(region);
      })
      .finally(() => {
        if (!active) return;
        setIsLoadingRegion(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 w-[420px] shrink-0 flex-col overflow-hidden">
        <RegionsList
          regions={regions}
          search={search}
          onSearchChange={setSearch}
          selectedId={selectedId === "new" ? null : selectedId}
          onSelect={setSelectedId}
          onNew={() => setSelectedId("new")}
          currentPage={currentPage}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPageChange={onPageChange}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {selectedId === "new" ? (
          <RegionEditor
            region={null}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : selectedId !== null && isLoadingRegion ? (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Chargement de la région...
          </div>
        ) : selectedId !== null && selectedRegion ? (
          <RegionEditor
            region={selectedRegion}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Sélectionnez une région ou créez-en une.
          </div>
        )}
      </div>
    </div>
  );
}
