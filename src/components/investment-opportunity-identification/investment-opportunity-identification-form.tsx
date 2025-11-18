
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
import { investmentOpportunityIdentificatorSchema } from '@/ai/schemas/investment-opportunity-schemas';
import { toast } from '@/hooks/use-toast';

export function InvestmentOpportunityIdentificationForm() {
  const [generation, setGeneration] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof investmentOpportunityIdentificatorSchema>>({
    resolver: zodResolver(investmentOpportunityIdentificatorSchema),
    defaultValues: {
      market_data: '',
    },
  });

  async function onSubmit(values: z.infer<typeof investmentOpportunityIdentificatorSchema>) {
    setIsLoading(true);
    try {
      // TODO: Implement findInvestmentOpportunities server action
      // For now, just show a placeholder message
      setGeneration('Investment opportunity identification feature is under development.');
      toast({
        title: 'Feature Coming Soon',
        description: 'Investment opportunity identification will be available in a future update.',
      });
    } catch (error) {
      console.error('Failed to identify investment opportunities:', error);
      toast({
        variant: 'destructive',
        title: 'Identification Failed',
        description: 'Could not identify investment opportunities.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market and Client Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="market_data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Market Data</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter market data here..."
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
            <h3 className="text-lg font-semibold">Generated Investment Opportunities:</h3>
            <p className="mt-2">{generation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
