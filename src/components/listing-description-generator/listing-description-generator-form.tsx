
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
import { Sparkles, Home, Copy, Check, Save, Upload, X, Image as ImageIcon } from 'lucide-react';
import { SchedulingModal } from '@/components/scheduling-modal';
import { TemplateSaveModal } from '@/components/template-save-modal';
import { ContentCategory, TemplateConfiguration } from '@/lib/content-workflow-types';
import { ProjectSelector } from '@/components/project-selector';
import { saveContentAction } from '@/app/actions';
import { SaveToLibraryDialog } from '@/components/studio/save-to-library-dialog';
import {
  generateNewListingDescription,
  optimizeListingDescription,
  generateFromImages
} from '@/lib/api-client';
import { useUser } from '@/aws/auth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AEOOptimizationPanel } from '@/components/aeo-optimization-panel';

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

  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<Array<{ file: File; preview: string; order: number }>>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      if (!isValidType) {
        toast({
          variant: 'destructive',
          title: 'Invalid File Type',
          description: `${file.name} is not an image file.`,
        });
      }
      if (!isValidSize) {
        toast({
          variant: 'destructive',
          title: 'File Too Large',
          description: `${file.name} exceeds 10MB limit.`,
        });
      }
      return isValidType && isValidSize;
    });

    const newImages = validFiles.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      order: uploadedImages.length + index,
    }));

    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (order: number) => {
    setUploadedImages(prev => {
      const updated = prev.filter(img => img.order !== order);
      // Clean up preview URL
      const removed = prev.find(img => img.order === order);
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

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

        // Use serverless API
        result = await optimizeListingDescription({
          originalDescription: propertyDetails.trim(),
          buyerPersona,
          sellingPoints: sellingPoints.trim() || '',
          emotionalAppeal,
        });
      } else {
        // Check if using images or manual input
        if (uploadedImages.length > 0) {
          // Generate from images using serverless API
          // Convert images to base64
          const imagePromises = uploadedImages.map(async (img) => {
            return new Promise<{ data: string; format: string; order: number }>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                const format = img.file.type.split('/')[1] as 'jpeg' | 'png' | 'webp';
                resolve({ data: base64, format, order: img.order });
              };
              reader.onerror = reject;
              reader.readAsDataURL(img.file);
            });
          });

          const imageData = await Promise.all(imagePromises);

          result = await generateFromImages({
            images: imageData,
            propertyType,
            location: location.trim(),
            buyerPersona,
            writingStyle,
            bedrooms: bedrooms || undefined,
            bathrooms: bathrooms || undefined,
            squareFeet: squareFeet.trim() || undefined,
          });
        } else {
          // Generate from manual input using serverless API
          if (!location || location.trim().length < 3) {
            throw new Error('Please enter a location (at least 3 characters).');
          }
          if (!keyFeatures || keyFeatures.trim().length < 10) {
            throw new Error('Please enter key features (at least 10 characters).');
          }

          result = await generateNewListingDescription({
            propertyType,
            bedrooms,
            bathrooms,
            squareFootage: squareFeet.trim(),
            location: location.trim(),
            features: keyFeatures.trim(),
            buyerPersona,
            writingStyle,
          });
        }
      }

      if (result.success && result.data) {
        // Handle different response formats from serverless API
        const description = result.data.description || result.data.optimizedDescription || result.data;
        setGeneration(typeof description === 'string' ? description : JSON.stringify(description));
        toast({
          title: '✨ Description Generated!',
          description: 'Your listing description is ready.',
        });
      } else {
        throw new Error(result.error?.message || 'Generation failed');
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
                  {/* Image Upload Section */}
                  <StandardFormField
                    label="Property Images (Optional)"
                    id="propertyImages"
                    hint="Upload images to generate descriptions based on visual features"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('image-upload')?.click()}
                          className="w-full"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Images
                        </Button>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          aria-label="Upload property images"
                        />
                      </div>

                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {uploadedImages.map((img) => (
                            <div key={img.order} className="relative group">
                              <img
                                src={img.preview}
                                alt={`Property ${img.order + 1}`}
                                className="w-full h-24 object-cover rounded-md border"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(img.order)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {uploadedImages.length > 0 && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          {uploadedImages.length} image{uploadedImages.length !== 1 ? 's' : ''} uploaded. AI will analyze these to generate your description.
                        </p>
                      )}
                    </div>
                  </StandardFormField>

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
                    hint={uploadedImages.length > 0 ? "Optional when using images - AI will extract features from photos" : "Highlight standout features and amenities"}
                  >
                    <Textarea
                      id="keyFeatures"
                      value={keyFeatures}
                      onChange={(e) => setKeyFeatures(e.target.value)}
                      placeholder="e.g., Updated kitchen, hardwood floors, large backyard, walk-in closets, smart home features"
                      rows={4}
                      required={uploadedImages.length === 0}
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
              <div className="space-y-6">
                <Textarea
                  value={generation}
                  onChange={(e) => setGeneration(e.target.value)}
                  rows={15}
                  className="w-full h-full font-mono text-sm resize-none"
                />

                {/* AEO Optimization for Listing Descriptions */}
                <AEOOptimizationPanel
                  content={generation}
                  contentType="article"
                  targetKeywords={[
                    propertyType,
                    location,
                    `${bedrooms} bedroom`,
                    `${bathrooms} bathroom`,
                    ...(keyFeatures ? keyFeatures.split(',').map(f => f.trim()) : []),
                  ].filter(Boolean)}
                  onOptimized={(optimizedContent) => {
                    setGeneration(optimizedContent);
                    toast({
                      title: 'Listing Optimized for AI',
                      description: 'Your listing is now optimized for ChatGPT, Perplexity, and other AI search engines.',
                    });
                  }}
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

      <SaveToLibraryDialog
        isOpen={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        content={generation}
        contentType="listing-description"
        suggestedName={`${propertyType} Listing - ${location || 'Property'}`}
        onSaved={(savedItem) => {
          toast({
            title: 'Content Saved!',
            description: `"${savedItem.name}" has been added to your library.`,
          });
        }}
      />
    </>
  );
}
