"use client";

import { useEffect, useState } from "react";
import { getNewsArticle, type NewsArticle, type NewsArticleListItem } from "@/app/admin/(cms)/news/actions";
import { NewsList } from "./NewsList";
import { NewsArticleEditor } from "./NewsArticleEditor";

type Props = {
  articles: NewsArticleListItem[];
};

export function NewsView({ articles }: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [isLoadingArticle, setIsLoadingArticle] = useState(false);

  useEffect(() => {
    let active = true;
    if (selectedId === null || selectedId === "new") {
      setSelectedArticle(null);
      setIsLoadingArticle(false);
      return () => {
        active = false;
      };
    }
    setIsLoadingArticle(true);
    getNewsArticle(selectedId)
      .then((article) => {
        if (!active) return;
        setSelectedArticle(article);
      })
      .finally(() => {
        if (!active) return;
        setIsLoadingArticle(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 w-[420px] shrink-0 flex-col overflow-hidden">
        <NewsList
          articles={articles}
          search={search}
          onSearchChange={setSearch}
          selectedId={selectedId === "new" ? null : selectedId}
          onSelect={setSelectedId}
          onNew={() => setSelectedId("new")}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {selectedId === "new" ? (
          <NewsArticleEditor
            article={null}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : selectedId !== null && isLoadingArticle ? (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Chargement de l'article...
          </div>
        ) : selectedId !== null && selectedArticle ? (
          <NewsArticleEditor
            article={selectedArticle}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : selectedId !== null ? (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Article introuvable.
          </div>
        ) : (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Sélectionnez un article ou créez-en un.
          </div>
        )}
      </div>
    </div>
  );
}
