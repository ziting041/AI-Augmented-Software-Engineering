import type { Metadata } from "next";

import { QuizPlayer } from "@/components/features/quiz-player";

export const metadata: Metadata = { title: "作答" };

export default async function QuizPage({ params }: PageProps<"/quiz/[id]">) {
  const { id } = await params;
  return <QuizPlayer quizId={id} />;
}
