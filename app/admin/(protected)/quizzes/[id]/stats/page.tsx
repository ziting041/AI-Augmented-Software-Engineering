import { QuizStats } from "@/components/features/admin/quiz-stats";

export default async function QuizStatsPage({
  params,
}: PageProps<"/admin/quizzes/[id]/stats">) {
  const { id } = await params;
  return <QuizStats quizId={id} />;
}
