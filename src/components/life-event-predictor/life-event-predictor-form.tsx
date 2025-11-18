
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { lifeEventPredictorSchema } from '@/ai/schemas/life-event-predictor-schemas';
import { toast } from '@/hooks/use-toast';

export function LifeEventPredictorForm() {
  const [generation, setGeneration] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof lifeEventPredictorSchema>>({
    resolver: zodResolver(lifeEventPredictorSchema),
    defaultValues: {
      client_data: '',
    },
  });

  async function onSubmit(values: z.infer<typeof lifeEventPredictorSchema>) {
    setIsLoading(true);
    try {
      // TODO: Implement predictLifeEvents server action
      // For now, just show a placeholder message
      setGeneration('Life event prediction feature is under development.');
      toast({
        title: 'Feature Coming Soon',
        description: 'Life event prediction will be available in a future update.',
      });
    } catch (error) {
      console.error('Failed to predict life events:', error);
      toast({
        variant: 'destructive',
        title: 'Prediction Failed',
        description: 'Could not generate life event prediction.',
      });
    } finally {
      setIsLoading(false);
    }
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
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Generating...' : 'Generate'}
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
