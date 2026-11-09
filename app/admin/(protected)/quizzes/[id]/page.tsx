import { QuizEditor } from "@/components/features/admin/quiz-editor";

export default async function EditQuizPage({
  params,
}: PageProps<"/admin/quizzes/[id]">) {
  const { id } = await params;
  return <QuizEditor quizId={id} />;
}
