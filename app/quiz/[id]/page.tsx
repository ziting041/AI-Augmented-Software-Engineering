import type { Metadata } from "next";

import { QuizPlayer } from "@/components/features/quiz-player";

export const metadata: Metadata = { title: "作答" };

export default async function QuizPage({
  params,
  searchParams,
}: PageProps<"/quiz/[id]">) {
  const [{ id }, search] = await Promise.all([params, searchParams])
  return <QuizPlayer quizId={id} sharedResult={search.result} />
}
