"use client";

import { QuizJerseyPickStage } from "@/components/quiz/QuizJerseyPickStage";

export function PreviewWrapper({ question }: { question: any }) {
  return (
    <QuizJerseyPickStage 
      question={question} 
      phase="answering" 
      selectedOptionId={null} 
      secondsLeft={15} 
      locked={false} 
      onSelect={() => {}} 
    />
  );
}
