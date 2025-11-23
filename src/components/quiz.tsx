
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Check, X, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizProps {
  moduleId: string;
  questions: QuizQuestion[];
  onComplete: () => void;
  isCompleted: boolean;
}

export function Quiz({ moduleId, questions, onComplete, isCompleted }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const allCorrect = questions.every((q, i) => selectedAnswers[i] === q.correctAnswer);
    if (allCorrect) {
      onComplete();
    }
  };

  if (isCompleted) {
    return (
      <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-xl">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-headline font-bold text-green-900 dark:text-green-100 text-lg">Module Complete!</h4>
            <p className="text-green-700 dark:text-green-300 mt-1">
              Excellent work! You've successfully mastered this module and passed the knowledge check.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-2 w-2 rounded-full bg-green-500" />
                ))}
              </div>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Perfect Score!</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="mt-8 border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <Check className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="font-headline text-xl">Knowledge Check</CardTitle>
            <CardDescription>Test your understanding of the concepts in this lesson.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((q, index) => (
          <div key={index} className="space-y-3">
            <p className="font-semibold text-foreground text-base">
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-sm font-bold mr-3">
                {index + 1}
              </span>
              {q.question}
            </p>
            <RadioGroup
              value={selectedAnswers[index]}
              onValueChange={(value) => handleAnswerSelect(index, value)}
              disabled={submitted}
              className="space-y-2"
            >
              {q.options.map((option, i) => {
                const isSelected = selectedAnswers[index] === option;
                const isCorrect = q.correctAnswer === option;
                return (
                  <div key={i} className={cn(
                    "flex items-center space-x-3 rounded-lg border-2 p-4 transition-all duration-200 cursor-pointer hover:bg-muted/50",
                    !submitted && "hover:border-primary/50",
                    submitted && isCorrect && "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700",
                    submitted && isSelected && !isCorrect && "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700",
                    !submitted && isSelected && "border-primary bg-primary/5"
                  )}>
                    <RadioGroupItem value={option} id={`${moduleId}-q${index}-o${i}`} className="mt-0.5" />
                    <Label htmlFor={`${moduleId}-q${index}-o${i}`} className="flex-1 cursor-pointer text-sm leading-relaxed">
                      {option}
                    </Label>
                    {submitted && isCorrect && (
                      <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                    {submitted && isSelected && !isCorrect && (
                      <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center">
                        <X className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        ))}
      </CardContent>
      {!submitted && (
        <CardFooter className="pt-6">
          <Button
            onClick={handleSubmit}
            disabled={Object.keys(selectedAnswers).length < questions.length}
            className="w-full sm:w-auto"
            size="lg"
          >
            <Check className="h-4 w-4 mr-2" />
            Submit Answers
          </Button>
        </CardFooter>
      )}
      {submitted && !isCompleted && (
        <CardFooter className="flex-col items-start gap-4 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-t-2 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center">
              <X className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-100">Review your answers</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Some answers were incorrect. Please review the lesson content and try again.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setSubmitted(false)} className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-950/30">
            Try Again
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
