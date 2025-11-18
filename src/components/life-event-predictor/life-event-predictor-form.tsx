
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { useActions } from 'ai/rsc';
import { predictLifeEvents } from '@/app/actions';
import { Loader } from '@/components/loader';
import { lifeEventPredictorSchema } from '@/ai/zod-schemas/life-event-predictor-schema';

export function LifeEventPredictorForm() {
  const [generation, setGeneration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { predictLifeEvents: generate } = useActions();

  const form = useForm<z.infer<typeof lifeEventPredictorSchema>>({
    resolver: zodResolver(lifeEventPredictorSchema),
    defaultValues: {
      client_data: '',
    },
  });

  async function onSubmit(values: z.infer<typeof lifeEventPredictorSchema>) {
    setIsLoading(true);
    const result = await generate(values);
    setGeneration(result.result as string);
    setIsLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Data</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="client_data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Data</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter client data here..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader /> : 'Generate'}
            </Button>
          </form>
        </Form>
        {generation && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold">Generated Life Event Prediction:</h3>
            <p className="mt-2">{generation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
