'use client';

import { useState } from 'react';
import { ListingDescriptionGeneratorForm } from '@/components/listing-description-generator/listing-description-generator-form';
import { StandardPageLayout } from '@/components/standard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Home, Sparkles } from 'lucide-react';

export default function ListingDescriptionGeneratorPage() {
  const [activeMode, setActiveMode] = useState('generate');

  const descriptionModes = [
    {
      id: 'generate',
      title: 'Generate New',
      description: 'Create listing descriptions from property details',
      icon: Sparkles,
    },
    {
      id: 'optimize',
      title: 'Optimize Existing',
      description: 'Rewrite existing listings for target personas',
      icon: Home,
    },
  ];

  return (
    <StandardPageLayout spacing="default">
      <div className="space-y-8">
        {/* Mode Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="description-mode" className="text-sm font-medium whitespace-nowrap">
                Mode:
              </Label>
              <Select value={activeMode} onValueChange={setActiveMode}>
                <SelectTrigger id="description-mode" className="w-full max-w-md">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {descriptionModes.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <SelectItem key={mode.id} value={mode.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          <span>{mode.title}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content Forms */}
        <Tabs value={activeMode} onValueChange={setActiveMode} className="w-full">
          <div className="hidden">
            <TabsList>
              <TabsTrigger value="generate">Generate New</TabsTrigger>
              <TabsTrigger value="optimize">Optimize Existing</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="generate">
            <ListingDescriptionGeneratorForm />
          </TabsContent>

          <TabsContent value="optimize">
            <ListingDescriptionGeneratorForm isOptimizeMode={true} />
          </TabsContent>
        </Tabs>
      </div>
    </StandardPageLayout>
  );
}
