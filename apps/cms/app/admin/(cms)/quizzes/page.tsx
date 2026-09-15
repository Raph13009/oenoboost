import { WorkspacePage } from "@/components/admin/WorkspacePage";
import { QuizGroupsView } from "@/components/admin/quizzes/QuizGroupsView";
import { getQuizGroups } from "./actions";

export default async function QuizzesPage() {
  let quizzes: Awaited<ReturnType<typeof getQuizGroups>> = [];
  try {
    quizzes = await getQuizGroups();
  } catch {
    quizzes = [];
  }

  return (
    <WorkspacePage
      title="Groupes de quizz"
      description="Créez des quizz, ajoutez des questions publiées et définissez leur ordre."
      flushLeft
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <QuizGroupsView quizzes={quizzes} />
      </div>
    </WorkspacePage>
  );
}
