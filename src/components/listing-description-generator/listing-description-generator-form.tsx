
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StandardFormField } from '@/components/standard/form-field';
import { StandardFormActions } from '@/components/standard/form-actions';
import { StandardLoadingSpinner } from '@/components/standard/loading-spinner';
import { StandardErrorDisplay } from '@/components/standard/error-display';
import { toast } from '@/hooks/use-toast';
import { Sparkles, Home, Copy, Check, Save } from 'lucide-react';

// Buyer personas for listing optimization
const buyerPersonas = [
  { value: 'First-Time Homebuyer', label: 'First-Time Homebuyer' },
  { value: 'Growing Family', label: 'Growing Family' },
  { value: 'Empty Nester', label: 'Empty Nester' },
  { value: 'Investor', label: 'Investor' },
  { value: 'Luxury Buyer', label: 'Luxury Buyer' },
  { value: 'Downsizer', label: 'Downsizer' },
];

export function ListingDescriptionGeneratorForm() {
  const [propertyDetails, setPropertyDetails] = useState('');
  const [buyerPersona, setBuyerPersona] = useState('First-Time Homebuyer');
  const [generation, setGeneration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setGeneration('');

    try {
      // TODO: Implement generateListingDescription server action
      // For now, just show a placeholder message
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setGeneration('Listing description generation feature is under development. This is a placeholder for the generated description that will be tailored to your selected buyer persona.');
      toast({
        title: 'Feature Coming Soon',
        description: 'Listing description generation will be available in a future update.',
      });
    } catch (err) {
      console.error('Failed to generate listing description:', err);
      setError('Could not generate listing description. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generation);
    setCopied(true);
    toast({
      title: 'Copied to Clipboard!',
      description: 'Content is ready to paste',
      duration: 2000,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    toast({
      title: 'Save Feature Coming Soon',
      description: 'Content saving will be available in a future update.',
    });
  };

  return (
    <>
      {/* Info Banner */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-600/5">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">AI-Powered Listing Descriptions</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Generate compelling, persona-targeted listing descriptions that resonate with your ideal buyers.
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-success" />
                  <span>Persona-Optimized</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-success" />
                  <span>SEO-Friendly</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-success" />
                  <span>Instant Generation</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Property Details</CardTitle>
            <CardDescription>
              Enter your property details and select your target buyer persona
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <StandardFormField
                label="Property Details"
                id="propertyDetails"
                hint="Include key features, location, and unique selling points"
              >
                <Textarea
                  id="propertyDetails"
                  value={propertyDetails}
                  onChange={(e) => setPropertyDetails(e.target.value)}
                  placeholder="e.g., Charming 3-bedroom, 2-bathroom single-family home in a quiet, tree-lined neighborhood. Features a recently updated kitchen with granite countertops..."
                  rows={10}
                  required
                />
              </StandardFormField>

              <StandardFormField
                label="Target Buyer Persona"
                id="buyerPersona"
                hint="Select the persona that best matches your ideal buyer"
              >
                <Select value={buyerPersona} onValueChange={setBuyerPersona}>
                  <SelectTrigger id="buyerPersona">
                    <SelectValue placeholder="Select a persona" />
                  </SelectTrigger>
                  <SelectContent>
                    {buyerPersonas.map((persona) => (
                      <SelectItem key={persona.value} value={persona.value}>
                        {persona.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </StandardFormField>

              <StandardFormActions
                primaryAction={{
                  label: 'Generate Description',
                  type: 'submit',
                  loading: isLoading,
                  variant: 'ai',
                }}
              />
            </form>
          </CardContent>
        </Card>

        {/* Right Column: Generated Output */}
        <Card className="min-h-[400px]">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="font-headline">Generated Description</CardTitle>
              <CardDescription>
                AI-optimized for your target persona
              </CardDescription>
            </div>
            {generation && (
              <div className="flex gap-2">
                <Button
                  variant={copied ? 'default' : 'outline'}
                  size="sm"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <StandardLoadingSpinner
                variant="ai"
                message="Generating your listing description..."
              />
            ) : generation ? (
              <div className="space-y-4">
                <Textarea
                  value={generation}
                  onChange={(e) => setGeneration(e.target.value)}
                  rows={15}
                  className="w-full h-full font-mono text-sm resize-none"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Home className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground text-lg">
                  Your generated listing description will appear here.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter property details and click Generate to create content.
                </p>
              </div>
            )}
            {error && <StandardErrorDisplay title="Generation Failed" message={error} variant="error" className="mt-4" />}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
