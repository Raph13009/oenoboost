"use client";

import { useEffect, useState } from "react";
import { getQuizQuestion, type QuizQuestion, type QuizQuestionListItem } from "@/app/admin/(cms)/quiz/actions";
import { QuizQuestionsList } from "./QuizQuestionsList";
import { QuizQuestionEditor } from "./QuizQuestionEditor";

type Props = {
  questions: QuizQuestionListItem[];
};

export function QuizView({ questions }: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<QuizQuestion | null>(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);

  useEffect(() => {
    let active = true;
    if (selectedId === null || selectedId === "new") {
      setSelectedQuestion(null);
      setIsLoadingQuestion(false);
      return () => {
        active = false;
      };
    }
    setIsLoadingQuestion(true);
    getQuizQuestion(selectedId)
      .then((question) => {
        if (!active) return;
        setSelectedQuestion(question);
      })
      .finally(() => {
        if (!active) return;
        setIsLoadingQuestion(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 w-[460px] shrink-0 flex-col overflow-hidden">
        <QuizQuestionsList
          questions={questions}
          search={search}
          onSearchChange={setSearch}
          selectedId={selectedId === "new" ? null : selectedId}
          onSelect={setSelectedId}
          onNew={() => setSelectedId("new")}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {selectedId === "new" ? (
          <QuizQuestionEditor
            question={null}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : selectedId !== null && isLoadingQuestion ? (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Chargement de la question...
          </div>
        ) : selectedId !== null && selectedQuestion ? (
          <QuizQuestionEditor
            question={selectedQuestion}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : selectedId !== null ? (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Question introuvable.
          </div>
        ) : (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Sélectionnez une question ou créez-en une.
          </div>
        )}
      </div>
    </div>
  );
}

