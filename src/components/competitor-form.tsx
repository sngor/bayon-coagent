
'use client';

import { useEffect, useActionState, useRef } from 'react';
import { useForm, useFormContext, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUser } from '@/aws/auth';
import { getRepository } from '@/aws/dynamodb';
import { getCompetitorKeys } from '@/aws/dynamodb/keys';
import { toast } from '@/hooks/use-toast';
import type { Competitor } from '@/lib/types';
import { Trash2, Sparkles, Loader2, Search } from 'lucide-react';
import { enrichCompetitorAction } from '@/app/actions';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  agency: z.string().min(2, { message: 'Agency must be at least 2 characters.' }),
  reviewCount: z.coerce.number().int().nonnegative(),
  avgRating: z.coerce.number().min(0).max(5),
  socialFollowers: z.coerce.number().int().nonnegative(),
  domainAuthority: z.coerce.number().int().min(0).max(100),
});

type CompetitorFormProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  competitor: Competitor | null;
};

type EnrichState = {
  message: string;
  data: z.infer<typeof formSchema> | null;
  errors: any;
}

const initialEnrichState: EnrichState = {
  message: '',
  data: null,
  errors: {}
}

function FindCompetitorButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={pending ? 'shimmer' : 'ai'}
      disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
      {pending ? 'Searching...' : 'Search'}
    </Button>
  )
}

function SearchForm() {
  const form = useFormContext();
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Competitor Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Jane Smith" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="agency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Agency</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Cityscape Realty" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FindCompetitorButton />
    </div>
  )
}

function PopulatedForm({ isEditing }: { isEditing: boolean }) {
  const form = useFormContext();
  const competitorData = form.getValues();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Competitor Name</FormLabel>
              <FormControl>
                <Input readOnly className="bg-secondary" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="agency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agency</FormLabel>
              <FormControl>
                <Input readOnly className="bg-secondary" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {isEditing ? (
        <p className="text-sm text-muted-foreground">Below is the latest data for this competitor.</p>
      ) : (
        <p className="text-sm text-muted-foreground">The AI has found the following data for this competitor.</p>
      )}

      <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Review Count</p>
          <p className="text-lg font-semibold">{competitorData.reviewCount}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Avg. Rating</p>
          <p className="text-lg font-semibold">{competitorData.avgRating.toFixed(1)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Social Followers</p>
          <p className="text-lg font-semibold">{(competitorData.socialFollowers / 1000).toFixed(1)}k</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Domain Authority</p>
          <p className="text-lg font-semibold">{competitorData.domainAuthority}</p>
        </div>
      </div>
    </div>
  )
}

export function CompetitorForm({
  isOpen,
  setIsOpen,
  competitor,
}: CompetitorFormProps) {
  const { user } = useUser();

  const [enrichState, enrichFormAction] = useActionState(enrichCompetitorAction, initialEnrichState);

  const isEditing = !!competitor;
  const isFound = enrichState.message === 'success' && enrichState.data;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      agency: '',
      reviewCount: 0,
      avgRating: 0,
      socialFollowers: 0,
      domainAuthority: 0,
    },
  });

  // Effect to reset form when dialog opens/closes or competitor changes
  useEffect(() => {
    if (isOpen) {
      if (competitor) {
        form.reset(competitor);
      } else {
        form.reset({
          name: '', agency: '', reviewCount: 0,
          avgRating: 0, socialFollowers: 0, domainAuthority: 0,
        });
      }
    }
  }, [competitor, isOpen, form]);

  // Effect to populate form with data from AI search
  useEffect(() => {
    if (enrichState.message === 'success' && enrichState.data) {
      form.reset(enrichState.data);
    } else if (enrichState.message && enrichState.message !== 'success') {
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: enrichState.message,
      })
    }
  }, [enrichState, form]);

  async function handleSave(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Not authenticated.' });
      return;
    }

    try {
      const repository = getRepository();
      const competitorId = competitor?.id || Date.now().toString();
      const keys = getCompetitorKeys(user.id, competitorId);

      await repository.put({
        ...keys,
        EntityType: 'Competitor',
        Data: values,
        CreatedAt: competitor?.createdAt ? new Date(competitor.createdAt).getTime() : Date.now(),
        UpdatedAt: Date.now()
      });

      if (competitor?.id) {
        toast({ title: 'Competitor Updated', description: `${values.name} has been updated.` });
      } else {
        toast({ title: 'Competitor Added', description: `${values.name} has been added to your list.` });
      }
      setIsOpen(false);
    } catch (e) {
      console.error("Error saving competitor: ", e);
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save competitor details.' })
    }
  }

  async function handleDelete() {
    if (!user || !competitor?.id) return;

    try {
      const repository = getRepository();
      const keys = getCompetitorKeys(user.id, competitor.id);
      await repository.delete(keys.PK, keys.SK);
      toast({ title: "Competitor Removed", description: `${competitor.name} has been removed.` });
      setIsOpen(false);
    } catch (e) {
      console.error("Error deleting competitor: ", e);
      toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete competitor.' })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'View Competitor' : 'Add Competitor'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Viewing competitor details. You can remove this competitor from your tracker.'
              : 'Find a competitor by name and agency to get their latest performance data.'}
          </DialogDescription>
        </DialogHeader>

        {isEditing || isFound ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)}>
              <PopulatedForm isEditing={isEditing} />
              <DialogFooter className="pt-4">
                {isEditing && (
                  <Button type="button" variant="destructive" onClick={handleDelete} className="mr-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
                <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                  {isEditing ? 'Close' : 'Cancel'}
                </Button>
                <Button type="submit" >{isEditing ? 'Save Changes' : 'Add to Tracker'}</Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...form}>
            <form action={enrichFormAction}>
              <SearchForm />
            </form>
          </Form>
        )}

        {enrichState.message && enrichState.message !== 'success' && <p className="text-sm text-destructive pt-4">{enrichState.message}</p>}

      </DialogContent>
    </Dialog>
  );
}
