"use client";

import { useEffect, useState } from "react";
import {
  getDictionaryTerm,
  type DictionaryTerm,
  type DictionaryTermListItem,
} from "@/app/admin/(cms)/dictionary/actions";
import { DictionaryList } from "./DictionaryList";
import { DictionaryTermEditor } from "./DictionaryTermEditor";

type Props = {
  terms: DictionaryTermListItem[];
};

export function DictionaryView({ terms }: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<DictionaryTerm | null>(null);
  const [isLoadingTerm, setIsLoadingTerm] = useState(false);

  useEffect(() => {
    let active = true;
    if (selectedId === null || selectedId === "new") {
      setSelectedTerm(null);
      setIsLoadingTerm(false);
      return () => {
        active = false;
      };
    }
    setIsLoadingTerm(true);
    getDictionaryTerm(selectedId)
      .then((term) => {
        if (!active) return;
        setSelectedTerm(term);
      })
      .finally(() => {
        if (!active) return;
        setIsLoadingTerm(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 w-[380px] shrink-0 flex-col overflow-hidden">
        <DictionaryList
          terms={terms}
          search={search}
          onSearchChange={setSearch}
          selectedId={selectedId === "new" ? null : selectedId}
          onSelect={setSelectedId}
          onNew={() => setSelectedId("new")}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {selectedId === "new" ? (
          <DictionaryTermEditor
            term={null}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : selectedId !== null && isLoadingTerm ? (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Chargement du terme...
          </div>
        ) : selectedId !== null && selectedTerm ? (
          <DictionaryTermEditor
            term={selectedTerm}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : selectedId !== null ? (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Terme introuvable.
          </div>
        ) : (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Sélectionnez un terme ou créez-en un.
          </div>
        )}
      </div>
    </div>
  );
}
