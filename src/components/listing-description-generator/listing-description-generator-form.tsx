
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { useStreamableValue, useActions } from 'ai/rsc';
import { generateListingDescription } from '@/app/actions';
import { Loader } from '@/components/loader';
import { generateListingDescriptionSchema } from '@/ai/zod-schemas/listing-description-generator-schema';

export function ListingDescriptionGeneratorForm() {
  const [generation, setGeneration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { generateListingDescription: generate } = useActions();

  const form = useForm<z.infer<typeof generateListingDescriptionSchema>>({
    resolver: zodResolver(generateListingDescriptionSchema),
    defaultValues: {
      property_details: '',
    },
  });

  async function onSubmit(values: z.infer<typeof generateListingDescriptionSchema>) {
    setIsLoading(true);
    const result = await generate(values);
    setGeneration(result.result as string);
    setIsLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="property_details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter property details here..."
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
            <h3 className="text-lg font-semibold">Generated Listing Description:</h3>
            <p className="mt-2">{generation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
