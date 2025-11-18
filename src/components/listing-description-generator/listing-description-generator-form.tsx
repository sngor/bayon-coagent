
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
import { generateListingDescriptionSchema } from '@/ai/schemas/listing-description-schemas';
import { toast } from '@/hooks/use-toast';

export function ListingDescriptionGeneratorForm() {
  const [generation, setGeneration] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof generateListingDescriptionSchema>>({
    resolver: zodResolver(generateListingDescriptionSchema),
    defaultValues: {
      property_details: '',
    },
  });

  async function onSubmit(values: z.infer<typeof generateListingDescriptionSchema>) {
    setIsLoading(true);
    try {
      // TODO: Implement generateListingDescription server action
      // For now, just show a placeholder message
      setGeneration('Listing description generation feature is under development.');
      toast({
        title: 'Feature Coming Soon',
        description: 'Listing description generation will be available in a future update.',
      });
    } catch (error) {
      console.error('Failed to generate listing description:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate listing description.',
      });
    } finally {
      setIsLoading(false);
    }
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
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Generating...' : 'Generate'}
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
