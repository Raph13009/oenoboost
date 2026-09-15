import { WorkspacePage } from "@/components/admin/WorkspacePage";
import { getNewsArticles } from "./actions";
import { NewsView } from "@/components/admin/news/NewsView";

export default async function NewsPage() {
  let articles: Awaited<ReturnType<typeof getNewsArticles>> = [];
  try {
    articles = await getNewsArticles();
  } catch {
    articles = [];
  }

  return (
    <WorkspacePage
      title="Actualités"
      description="Gérez les actualités, guides et contenus éditoriaux. Sélectionnez une ligne pour modifier."
      flushLeft
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <NewsView articles={articles} />
      </div>
    </WorkspacePage>
  );
}
