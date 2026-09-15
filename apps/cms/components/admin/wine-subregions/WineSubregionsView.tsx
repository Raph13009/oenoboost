"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getWineSubregion,
  type WineSubregion,
  type WineSubregionListItem,
} from "@/app/admin/(cms)/wine-subregions/actions";
import { DrawerSkeleton, useDelayedBusy } from "@/components/admin/Loaders";
import { SubregionsList } from "./SubregionsList";
import { SubregionEditor } from "./SubregionEditor";
import { useTransition } from "react";

type Props = {
  subregions: WineSubregionListItem[];
  regions: Array<{ id: string; name_fr: string }>;
  currentPage: number;
  hasPrev: boolean;
  hasNext: boolean;
};

export function WineSubregionsView({
  subregions,
  regions,
  currentPage,
  hasPrev,
  hasNext,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [selectedSubregion, setSelectedSubregion] = useState<WineSubregion | null>(null);
  const [isLoadingSubregion, setIsLoadingSubregion] = useState(false);
  const [isNavigatingPage, startPageTransition] = useTransition();
  const router = useRouter();
  const showDrawerLoader = useDelayedBusy(isLoadingSubregion, 150);
  const showListLoader = useDelayedBusy(isNavigatingPage, 150);

  const onPageChange = (nextPage: number) => {
    startPageTransition(() => {
      router.push(`?page=${nextPage}`);
    });
  };

  useEffect(() => {
    if (!hasNext) return;
    router.prefetch(`?page=${currentPage + 1}`);
  }, [currentPage, hasNext, router]);

  useEffect(() => {
    let active = true;
    if (selectedId === null || selectedId === "new") {
      setSelectedSubregion(null);
      setIsLoadingSubregion(false);
      return () => {
        active = false;
      };
    }
    setIsLoadingSubregion(true);
    getWineSubregion(selectedId)
      .then((subregion) => {
        if (!active) return;
        setSelectedSubregion(subregion);
      })
      .finally(() => {
        if (!active) return;
        setIsLoadingSubregion(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden sm:w-[420px]">
        <SubregionsList
          subregions={subregions}
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
          isLoadingList={showListLoader}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {selectedId === "new" ? (
          <SubregionEditor
            subregion={null}
            regions={regions}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : selectedId !== null && isLoadingSubregion ? (
          showDrawerLoader ? (
            <DrawerSkeleton />
          ) : (
            <div className="h-full border-l border-slate-200 bg-white" />
          )
        ) : selectedId !== null && selectedSubregion ? (
          <SubregionEditor
            subregion={selectedSubregion}
            regions={regions}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Sélectionnez une sous-région ou créez-en une.
          </div>
        )}
      </div>
    </div>
  );
}
