import { HomeHero } from "@/components/features/home/home-hero";
import { HomeMarquee } from "@/components/features/home/home-marquee";
import { HomeSteps } from "@/components/features/home/home-steps";
import { QuizList } from "@/components/features/quiz-list";

export default function Home() {
  return (
    <>
      <HomeHero />
      <HomeMarquee />
      <QuizList />
      <HomeSteps />
    </>
  );
}
