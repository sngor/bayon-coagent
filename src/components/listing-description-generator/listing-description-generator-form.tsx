
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { SchedulingModal } from '@/components/scheduling-modal';
import { TemplateSaveModal } from '@/components/template-save-modal';
import { ContentCategory, TemplateConfiguration } from '@/lib/content-workflow-types';
import { ProjectSelector } from '@/components/project-selector';
import { saveContentAction } from '@/app/actions';
import { useUser } from '@/aws/auth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Buyer personas for listing optimization
const buyerPersonas = [
  { value: 'First-Time Homebuyer', label: 'First-Time Homebuyer' },
  { value: 'Growing Family', label: 'Growing Family' },
  { value: 'Empty Nester', label: 'Empty Nester' },
  { value: 'Investor', label: 'Investor' },
  { value: 'Luxury Buyer', label: 'Luxury Buyer' },
  { value: 'Downsizer', label: 'Downsizer' },
];

interface ListingDescriptionGeneratorFormProps {
  isOptimizeMode?: boolean;
}

export function ListingDescriptionGeneratorForm({ isOptimizeMode = false }: ListingDescriptionGeneratorFormProps) {
  const { user } = useUser();
  const [propertyDetails, setPropertyDetails] = useState('');
  const [buyerPersona, setBuyerPersona] = useState('First-Time Homebuyer');
  const [generation, setGeneration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTemplateSaveModal, setShowTemplateSaveModal] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProjectId, setSaveProjectId] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');
  const [templateConfiguration, setTemplateConfiguration] = useState<TemplateConfiguration>({
    promptParameters: {},
    contentStructure: { sections: [], format: 'listing' },
    stylePreferences: { tone: '', length: '', keywords: [] }
  });

  // Additional fields for Generate New mode
  const [propertyType, setPropertyType] = useState('Single-Family Home');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [location, setLocation] = useState('');
  const [keyFeatures, setKeyFeatures] = useState('');
  const [writingStyle, setWritingStyle] = useState('Balanced');

  // Additional fields for Optimize mode
  const [sellingPoints, setSellingPoints] = useState('');
  const [emotionalAppeal, setEmotionalAppeal] = useState('Balanced');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setGeneration('');

    try {
      let result;

      if (isOptimizeMode) {
        // Validate required fields
        if (!propertyDetails || propertyDetails.trim().length < 50) {
          throw new Error('Original description must be at least 50 characters long.');
        }
        if (!buyerPersona) {
          throw new Error('Please select a target buyer persona.');
        }
        if (!emotionalAppeal) {
          throw new Error('Please select an emotional appeal style.');
        }

        // Import the action dynamically
        const { optimizeListingDescriptionAction } = await import('@/app/actions');

        result = await optimizeListingDescriptionAction({
          originalDescription: propertyDetails.trim(),
          buyerPersona,
          sellingPoints: sellingPoints.trim() || '',
          emotionalAppeal,
        });
      } else {
        // Validate required fields
        if (!location || location.trim().length < 3) {
          throw new Error('Please enter a location (at least 3 characters).');
        }
        if (!keyFeatures || keyFeatures.trim().length < 10) {
          throw new Error('Please enter key features (at least 10 characters).');
        }

        // Import the action dynamically
        const { generateNewListingDescriptionAction } = await import('@/app/actions');

        result = await generateNewListingDescriptionAction({
          propertyType,
          bedrooms,
          bathrooms,
          squareFeet: squareFeet.trim(),
          location: location.trim(),
          keyFeatures: keyFeatures.trim(),
          buyerPersona,
          writingStyle,
        });
      }

      if (result.message === 'success' && result.data) {
        setGeneration(result.data.description);
        toast({
          title: '✨ Description Generated!',
          description: 'Your listing description is ready.',
        });
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      console.error('Failed to generate listing description:', err);
      const errorMessage = err instanceof Error ? err.message : 'Could not generate listing description. Please try again.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: errorMessage,
      });
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
    if (!generation) {
      toast({
        variant: 'destructive',
        title: 'No Content',
        description: 'Generate a listing description first.',
      });
      return;
    }
    setShowSaveDialog(true);
  };

  const handleSaveConfirm = async () => {
    if (!user || !generation) {
      toast({
        variant: 'destructive',
        title: 'Could not save',
        description: 'Content or user is missing.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveContentAction(
        user.id,
        generation,
        'Listing Description',
        saveName || 'Listing Description',
        saveProjectId
      );

      if (result.message === 'Content saved successfully') {
        toast({
          title: '✨ Content Saved!',
          description: 'Your listing description has been saved to your Library.',
        });
        setShowSaveDialog(false);
        setSaveName('');
        setSaveProjectId(null);
      } else {
        throw new Error(result.errors?.[0] || 'Save failed');
      }
    } catch (error) {
      console.error('Failed to save content:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save content.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsTemplate = () => {
    // Create template configuration from current form state
    const configuration: TemplateConfiguration = {
      promptParameters: isOptimizeMode ? {
        originalDescription: propertyDetails,
        buyerPersona,
        sellingPoints: '', // Would be extracted from form
        emotionalAppeal: 'Balanced'
      } : {
        propertyType,
        bedrooms,
        bathrooms,
        squareFeet,
        location,
        keyFeatures,
        buyerPersona,
        writingStyle
      },
      contentStructure: {
        sections: ['description', 'features', 'location'],
        format: 'listing'
      },
      stylePreferences: {
        tone: isOptimizeMode ? 'Balanced' : writingStyle,
        length: 'medium',
        keywords: [],
        targetAudience: buyerPersona
      }
    };

    setTemplateConfiguration(configuration);
    setShowTemplateSaveModal(true);
  };

  const handleSchedule = () => {
    if (!generation) return;
    setShowScheduleModal(true);
  };

  return (
    <>
      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              {isOptimizeMode ? 'Listing Optimizer' : 'Property Details'}
            </CardTitle>
            <CardDescription>
              {isOptimizeMode
                ? 'Rewrite an existing listing description for a specific buyer persona'
                : 'Enter your property details and select your target buyer persona'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isOptimizeMode ? (
                <>
                  <StandardFormField
                    label="Original Description"
                    id="propertyDetails"
                    hint="Paste your existing listing description"
                  >
                    <Textarea
                      id="propertyDetails"
                      value={propertyDetails}
                      onChange={(e) => setPropertyDetails(e.target.value)}
                      placeholder="Paste your listing description here..."
                      rows={8}
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

                  <StandardFormField
                    label="Key Selling Points (Optional)"
                    id="sellingPoints"
                    hint="Highlight specific features you want emphasized"
                  >
                    <Textarea
                      id="sellingPoints"
                      value={sellingPoints}
                      onChange={(e) => setSellingPoints(e.target.value)}
                      placeholder="e.g., Recently renovated, Smart home features, Pool"
                      rows={3}
                    />
                  </StandardFormField>

                  <StandardFormField
                    label="Emotional Appeal"
                    id="emotionalAppeal"
                    hint="Choose the writing style for your listing"
                  >
                    <Select value={emotionalAppeal} onValueChange={setEmotionalAppeal}>
                      <SelectTrigger id="emotionalAppeal">
                        <SelectValue placeholder="Select appeal style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Factual">Factual & Straightforward</SelectItem>
                        <SelectItem value="Balanced">Balanced</SelectItem>
                        <SelectItem value="Emotional">Emotional & Aspirational</SelectItem>
                      </SelectContent>
                    </Select>
                  </StandardFormField>
                </>
              ) : (
                <>
                  <StandardFormField
                    label="Property Type"
                    id="propertyType"
                  >
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTrigger id="propertyType">
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single-Family Home">Single-Family Home</SelectItem>
                        <SelectItem value="Condo">Condo</SelectItem>
                        <SelectItem value="Townhouse">Townhouse</SelectItem>
                        <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                        <SelectItem value="Land">Land</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </StandardFormField>

                  <div className="grid grid-cols-3 gap-4">
                    <StandardFormField
                      label="Bedrooms"
                      id="bedrooms"
                    >
                      <Select value={bedrooms} onValueChange={setBedrooms}>
                        <SelectTrigger id="bedrooms">
                          <SelectValue placeholder="Beds" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Studio">Studio</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="6+">6+</SelectItem>
                        </SelectContent>
                      </Select>
                    </StandardFormField>

                    <StandardFormField
                      label="Bathrooms"
                      id="bathrooms"
                    >
                      <Select value={bathrooms} onValueChange={setBathrooms}>
                        <SelectTrigger id="bathrooms">
                          <SelectValue placeholder="Baths" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="1.5">1.5</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="2.5">2.5</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="3.5">3.5</SelectItem>
                          <SelectItem value="4+">4+</SelectItem>
                        </SelectContent>
                      </Select>
                    </StandardFormField>

                    <StandardFormField
                      label="Sq Ft"
                      id="squareFeet"
                    >
                      <Input
                        type="number"
                        id="squareFeet"
                        value={squareFeet}
                        onChange={(e) => setSquareFeet(e.target.value)}
                        placeholder="e.g., 2000"
                      />
                    </StandardFormField>
                  </div>

                  <StandardFormField
                    label="Location"
                    id="location"
                    hint="Neighborhood, city, or area"
                  >
                    <Input
                      type="text"
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Capitol Hill, Seattle"
                      required
                    />
                  </StandardFormField>

                  <StandardFormField
                    label="Key Features"
                    id="keyFeatures"
                    hint="Highlight standout features and amenities"
                  >
                    <Textarea
                      id="keyFeatures"
                      value={keyFeatures}
                      onChange={(e) => setKeyFeatures(e.target.value)}
                      placeholder="e.g., Updated kitchen, hardwood floors, large backyard, walk-in closets, smart home features"
                      rows={4}
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

                  <StandardFormField
                    label="Writing Style"
                    id="writingStyle"
                    hint="Choose the tone for your listing"
                  >
                    <Select value={writingStyle} onValueChange={setWritingStyle}>
                      <SelectTrigger id="writingStyle">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Factual">Factual & Straightforward</SelectItem>
                        <SelectItem value="Balanced">Balanced</SelectItem>
                        <SelectItem value="Emotional">Emotional & Aspirational</SelectItem>
                        <SelectItem value="Luxury">Luxury & Sophisticated</SelectItem>
                      </SelectContent>
                    </Select>
                  </StandardFormField>
                </>
              )}

              <StandardFormActions
                primaryAction={{
                  label: isOptimizeMode ? 'Optimize Listing' : 'Generate Description',
                  type: 'submit',
                  loading: isLoading,
                  variant: 'ai',
                }}
                secondaryAction={{
                  label: 'Save as Template',
                  onClick: handleSaveAsTemplate
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
                  variant="ai"
                  size="sm"
                  onClick={handleSchedule}
                  className="font-medium"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
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
                showSubtext={true}
                featureType="listing-description"
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

      <SchedulingModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onScheduled={(scheduledContent) => {
          toast({
            title: 'Listing Description Scheduled!',
            description: 'Your listing description has been scheduled successfully.'
          });
        }}
        contentData={{
          contentId: `listing_${Date.now()}`,
          title: `${propertyType} Listing - ${location || 'Property'}`,
          content: generation,
          contentType: ContentCategory.LISTING_DESCRIPTION
        }}
      />
      <TemplateSaveModal
        isOpen={showTemplateSaveModal}
        onClose={() => setShowTemplateSaveModal(false)}
        onSaved={(templateId) => {
          toast({
            title: 'Template Saved!',
            description: 'Your listing template has been saved and can be reused for future listings.'
          });
        }}
        contentType={ContentCategory.LISTING_DESCRIPTION}
        configuration={templateConfiguration}
        initialName={`${isOptimizeMode ? 'Listing Optimizer' : 'Listing Generator'} - ${buyerPersona}`}
        previewContent={generation}
      />

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Listing Description</DialogTitle>
            <DialogDescription>
              Name your listing description and assign it to a project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <StandardFormField label="Content Name (Optional)" id="saveName">
              <Input
                id="saveName"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g., Downtown Condo Listing"
              />
            </StandardFormField>
            <ProjectSelector
              value={saveProjectId}
              onChange={setSaveProjectId}
              label="Project"
              placeholder="Select a project (optional)"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfirm} disabled={isSaving}>
              {isSaving ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
