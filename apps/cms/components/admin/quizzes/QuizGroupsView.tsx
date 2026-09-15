"use client";

import { useEffect, useState } from "react";
import {
  getQuizGroup,
  getQuizGroupQuestions,
  type QuizGroup,
  type QuizGroupListItem,
  type QuizGroupQuestionLink,
} from "@/app/admin/(cms)/quizzes/actions";
import { QuizGroupsList } from "./QuizGroupsList";
import { QuizGroupEditor } from "./QuizGroupEditor";

type Props = {
  quizzes: QuizGroupListItem[];
};

export function QuizGroupsView({ quizzes }: Props) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizGroup | null>(null);
  const [questions, setQuestions] = useState<QuizGroupQuestionLink[]>([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  useEffect(() => {
    let active = true;

    if (selectedId === null || selectedId === "new") {
      setSelectedQuiz(null);
      setQuestions([]);
      setIsLoadingQuiz(false);
      return () => {
        active = false;
      };
    }

    setIsLoadingQuiz(true);
    Promise.all([getQuizGroup(selectedId), getQuizGroupQuestions(selectedId)])
      .then(([quiz, questionLinks]) => {
        if (!active) return;
        setSelectedQuiz(quiz);
        setQuestions(questionLinks);
      })
      .finally(() => {
        if (!active) return;
        setIsLoadingQuiz(false);
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="flex min-h-0 w-[460px] shrink-0 flex-col overflow-hidden">
        <QuizGroupsList
          quizzes={quizzes}
          search={search}
          onSearchChange={setSearch}
          selectedId={selectedId === "new" ? null : selectedId}
          onSelect={setSelectedId}
          onNew={() => setSelectedId("new")}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {selectedId === "new" ? (
          <QuizGroupEditor
            quiz={null}
            questions={[]}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : selectedId !== null && isLoadingQuiz ? (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Chargement du quizz...
          </div>
        ) : selectedId !== null && selectedQuiz ? (
          <QuizGroupEditor
            quiz={selectedQuiz}
            questions={questions}
            onClose={() => setSelectedId(null)}
            onDeleted={() => setSelectedId(null)}
          />
        ) : selectedId !== null ? (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Quizz introuvable.
          </div>
        ) : (
          <div className="flex h-full items-center justify-center border-l border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            Sélectionnez un quizz ou créez-en un.
          </div>
        )}
      </div>
    </div>
  );
}
