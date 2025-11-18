
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Check, X, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
};

type QuizProps = {
  moduleId: string;
  questions: QuizQuestion[];
  onComplete: () => void;
  isCompleted: boolean;
};

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
      <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg flex items-center gap-3">
        <Award className="h-6 w-6" />
        <div>
          <h4 className="font-bold">Module Complete!</h4>
          <p className="text-sm">You have successfully passed the knowledge check for this module.</p>
        </div>
      </div>
    )
  }

  return (
    <Card className="mt-8 border-dashed border-primary/50">
        <CardHeader>
            <CardTitle className="font-headline text-xl">Knowledge Check</CardTitle>
            <CardDescription>Test your understanding of the concepts in this lesson.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        {questions.map((q, index) => (
            <div key={index}>
            <p className="font-medium mb-2">{index + 1}. {q.question}</p>
            <RadioGroup
                value={selectedAnswers[index]}
                onValueChange={(value) => handleAnswerSelect(index, value)}
                disabled={submitted}
            >
                {q.options.map((option, i) => {
                    const isSelected = selectedAnswers[index] === option;
                    const isCorrect = q.correctAnswer === option;
                    return (
                        <div key={i} className={cn(
                            "flex items-center space-x-3 rounded-md border p-3 transition-colors",
                            submitted && isCorrect && "bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800",
                            submitted && isSelected && !isCorrect && "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800"
                        )}>
                            <RadioGroupItem value={option} id={`${moduleId}-q${index}-o${i}`} />
                            <Label htmlFor={`${moduleId}-q${index}-o${i}`} className="flex-1 cursor-pointer">{option}</Label>
                            {submitted && isCorrect && <Check className="h-5 w-5 text-green-600" />}
                            {submitted && isSelected && !isCorrect && <X className="h-5 w-5 text-red-600" />}
                        </div>
                    );
                })}
            </RadioGroup>
            </div>
        ))}
        </CardContent>
        {!submitted && (
            <CardFooter>
                 <Button onClick={handleSubmit} disabled={Object.keys(selectedAnswers).length < questions.length}>
                    Submit Answers
                </Button>
            </CardFooter>
        )}
        {submitted && !isCompleted && (
             <CardFooter className="flex-col items-start gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t">
                <p className="font-semibold">Review your answers.</p>
                <p className="text-sm text-muted-foreground">Some answers were incorrect. Please review the lesson and try again.</p>
                <Button variant="outline" size="sm" onClick={() => setSubmitted(false)} className="mt-2">Try Again</Button>
            </CardFooter>
        )}
    </Card>
  );
}
