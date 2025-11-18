
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
import { findInvestmentOpportunities } from '@/app/actions';
import { Loader } from '@/components/loader';
import { investmentOpportunityIdentificatorSchema } from '@/ai/zod-schemas/investment-opportunity-identification-schema';

export function InvestmentOpportunityIdentificationForm() {
  const [generation, setGeneration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { findInvestmentOpportunities: generate } = useActions();

  const form = useForm<z.infer<typeof investmentOpportunityIdentificatorSchema>>({
    resolver: zodResolver(investmentOpportunityIdentificatorSchema),
    defaultValues: {
      market_trends: '',
      client_profile: '',
    },
  });

  async function onSubmit(values: z.infer<typeof investmentOpportunityIdentificatorSchema>) {
    setIsLoading(true);
    const result = await generate(values);
    setGeneration(result.result as string);
    setIsLoading(false);
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
              name="market_trends"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Market Trends</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter market trends here..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="client_profile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Profile</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter client profile here..."
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
            <h3 className="text-lg font-semibold">Generated Investment Opportunities:</h3>
            <p className="mt-2">{generation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
