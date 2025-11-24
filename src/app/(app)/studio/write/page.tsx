
'use client';

import { useActionState, useState, useTransition, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Typewriter, LoadingDots, SuccessAnimation, StaggeredText, GradientText } from '@/components/ui/text-animations';
import '@/styles/text-animations.css';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StandardFormField } from '@/components/standard/form-field';
import { StandardFormActions } from '@/components/standard/form-actions';
import { StandardLoadingSpinner } from '@/components/standard/loading-spinner';
import {
  generateGuideAction,
  generateSocialPostAction,
  generateDescriptionAction,
  generateMarketUpdateAction,
  generateVideoScriptAction,
  generateBlogPostAction,
  regenerateImageAction,
  saveContentAction,
} from '@/app/actions';

// Buyer personas for listing optimization
const buyerPersonas = [
  { value: 'First-Time Homebuyer', label: 'First-Time Homebuyer' },
  { value: 'Growing Family', label: 'Growing Family' },
  { value: 'Empty Nester', label: 'Empty Nester' },
  { value: 'Investor', label: 'Investor' },
  { value: 'Luxury Buyer', label: 'Luxury Buyer' },
  { value: 'Downsizer', label: 'Downsizer' },
];

import {
  BedDouble,
  Bath,
  Square,
  ExternalLink,
  Loader2,
  Copy,
  Linkedin,
  X,
  Facebook,
  Sparkles,
  Save,
  RefreshCw,
  TrendingUp,
  FileText,
  Video,
  MapPin,
  MessageSquare,
  Home,
  Check,
  Building2,
} from 'lucide-react';
import { marked } from 'marked';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { type GenerateSocialMediaPostOutput } from '@/aws/bedrock/flows/generate-social-media-post';
import { useWebAI } from '@/hooks/useWebAI';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useUser } from '@/aws/auth';
import { useQuery } from '@/aws/dynamodb/hooks';
import type { Project } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StandardErrorDisplay } from '@/components/standard/error-display';
import { SchedulingModal } from '@/components/scheduling-modal';
import { TemplateSaveModal } from '@/components/template-save-modal';
import { ProjectSelector } from '@/components/project-selector';
import { ContentCategory, TemplateConfiguration } from '@/lib/content-workflow-types';

// #region State & Button Components
type GuideInitialState = {
  message: string;
  data: { guide: string; idxFeedUrl: string };
  errors: any;
};
const guideInitialState: GuideInitialState = {
  message: '',
  data: { guide: '', idxFeedUrl: '' },
  errors: {},
};

type SocialInitialState = {
  message: string;
  data: GenerateSocialMediaPostOutput | null;
  errors: any;
};
const socialInitialState: SocialInitialState = {
  message: '',
  data: null,
  errors: {},
};

type SocialPostContentWithTopic = GenerateSocialMediaPostOutput & { topic?: string };

type Faq = { q: string; a: string };
type ListingInitialState = {
  message: string;
  data: { rewrittenDescription?: string; listingFaqs?: Faq[] };
  errors: any;
};
const listingInitialState: ListingInitialState = {
  message: '',
  data: {},
  errors: {},
};

type MarketUpdateInitialState = {
  message: string;
  data: string | null;
  errors: any;
};
const marketUpdateInitialState: MarketUpdateInitialState = {
  message: '',
  data: null,
  errors: {},
};

type VideoScriptInitialState = {
  message: string;
  data: string | null;
  errors: any;
};
const videoScriptInitialState: VideoScriptInitialState = {
  message: '',
  data: null,
  errors: {},
};

type BlogPostInitialState = {
  message: string;
  data: { blogPost: string | null; headerImage: string | null };
  errors: any;
};
const blogPostInitialState: BlogPostInitialState = {
  message: '',
  data: { blogPost: null, headerImage: null },
  errors: {},
};

type ImageInitialState = {
  message: string;
  data: { headerImage: string } | null;
  errors: any;
};
const imageInitialState: ImageInitialState = {
  message: '',
  data: null,
  errors: {},
};

type SaveDialogInfo = {
  isOpen: boolean;
  content: string;
  type: string;
}

type ScheduleDialogInfo = {
  isOpen: boolean;
  content: string;
  title: string;
  contentType: ContentCategory;
}

type TemplateSaveDialogInfo = {
  isOpen: boolean;
  contentType: ContentCategory;
  configuration: TemplateConfiguration;
  initialName: string;
  previewContent: string;
}

function GenerateButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={pending ? 'shimmer' : 'ai'}
      disabled={pending}
      {...props}
    >
      {pending ? (
        <>
          <LoadingDots className="mr-2 text-white" size="sm" />
          <span className="generating-text">Creating</span>
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          <span className="button-text-hover">{children}</span>
        </>
      )}
    </Button>
  );
}

function RegenerateImageButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending} {...props}>
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="mr-2 h-4 w-4" />
      )}
      {pending ? 'Creating...' : children}
    </Button>
  );
}


function SaveDialog({ dialogInfo, setDialogInfo }: { dialogInfo: SaveDialogInfo, setDialogInfo: (info: SaveDialogInfo) => void }) {
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);

  const handleSave = () => {
    console.log('🎯 handleSave called');
    console.log('🎯 user:', user?.id);
    console.log('🎯 dialogInfo:', dialogInfo);
    console.log('🎯 name:', name);
    console.log('🎯 projectId:', projectId);

    if (!user || !dialogInfo.content) {
      console.log('❌ Missing user or content');
      toast({
        variant: 'destructive',
        title: 'Could not save',
        description: 'Content or user is missing.',
      });
      return;
    }

    console.log('🎯 Starting save transition...');
    startTransition(async () => {
      try {
        console.log('🎯 Calling saveContentAction with:', {
          userId: user.id,
          type: dialogInfo.type,
          name: name || dialogInfo.type,
          projectId: projectId || null,
          contentLength: dialogInfo.content.length
        });

        const result = await saveContentAction(
          user.id,
          dialogInfo.content,
          dialogInfo.type,
          name || dialogInfo.type,
          projectId || null
        );

        console.log('🎯 Save result:', result);

        if (result.message === 'Content saved successfully') {
          console.log('✅ Save successful!');
          toast({
            title: '✨ Content Saved!',
            description: `Your content has been saved to your Library.`,
            className: 'success-message',
          });
          setDialogInfo({ isOpen: false, content: '', type: '' });
          setName('');
          setProjectId(null);
        } else {
          console.error('❌ Save failed:', result);
          throw new Error(result.errors?.[0] || 'Save failed');
        }
      } catch (error) {
        console.error('❌ Failed to save content:', error);
        toast({
          variant: 'destructive',
          title: 'Save Failed',
          description: 'Could not save content.',
        });
      }
    });
  };

  return (
    <Dialog open={dialogInfo.isOpen} onOpenChange={(isOpen) => setDialogInfo({ ...dialogInfo, isOpen })}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Content</DialogTitle>
          <DialogDescription>
            Name your content and assign it to a project.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <StandardFormField
            label="Content Name (Optional)"
            id="contentName"
          >
            <Input id="contentName" value={name} onChange={(e) => setName(e.target.value)} placeholder={`e.g., ${dialogInfo.type} for October`} />
          </StandardFormField>
          <ProjectSelector
            value={projectId}
            onChange={setProjectId}
            label="Project"
            placeholder="Select a project (optional)"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setDialogInfo({ isOpen: false, content: '', type: '' })}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// #endregion

function IdxFeedPlaceholder({ url }: { url: string }) {
  if (!url) return null;
  return (
    <div className="mt-8 p-6 rounded-lg border border-dashed">
      <div className="text-center">
        <h3 className="text-xl font-semibold font-headline">Live Property Feed</h3>
        <p className="text-muted-foreground mt-2">A real IDX feed would display live properties for this neighborhood here.</p>
        <Button variant="outline" asChild className="mt-4">
          <a href={url} target="_blank" rel="noopener noreferrer">
            View on IDX Provider <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

function OptimizerButton() {
  const { pending } = useFormStatus();
  const { isWebAIAvailable } = useWebAI();

  return (
    <Button
      type="submit"
      variant={pending ? 'shimmer' : 'ai'}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      {pending ? 'Optimizing...' : 'Optimize Listing'}
      {pending && isWebAIAvailable && (
        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
          On-Device
        </span>
      )}
    </Button>
  );
}



function ErrorDisplay({ message }: { message: string | null }) {
  if (!message) return null;

  const isTopicalError = message.toLowerCase().includes('real estate');

  return (
    <StandardErrorDisplay
      title={isTopicalError ? 'Topic Guardrail Activated' : 'Generation Failed'}
      message={message}
      variant={isTopicalError ? 'warning' : 'error'}
      className="mt-4"
    />
  );
}

/**
 * The Co-Marketing Studio page, providing AI-powered content generation tools.
 * It includes generators for market updates, blog posts, video scripts, neighborhood guides,
 * social media posts, and a listing optimizer.
 */
export default function ContentEnginePage() {
  const { user } = useUser();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') || 'market-update'
  );
  const [blogTopic, setBlogTopic] = useState('');
  const [saveDialogInfo, setSaveDialogInfo] = useState<SaveDialogInfo>({ isOpen: false, content: '', type: '' });
  const [scheduleDialogInfo, setScheduleDialogInfo] = useState<ScheduleDialogInfo>({
    isOpen: false,
    content: '',
    title: '',
    contentType: ContentCategory.MARKET_UPDATE
  });
  const [templateSaveDialogInfo, setTemplateSaveDialogInfo] = useState<TemplateSaveDialogInfo>({
    isOpen: false,
    contentType: ContentCategory.MARKET_UPDATE,
    configuration: {
      promptParameters: {},
      contentStructure: { sections: [], format: '' },
      stylePreferences: { tone: '', length: '', keywords: [] }
    },
    initialName: '',
    previewContent: ''
  });

  const [appliedTemplateInfo, setAppliedTemplateInfo] = useState<{
    templateName: string;
    contentType: ContentCategory;
  } | null>(null);

  const [listingState, serverListingAction, isListingPending] =
    useActionState(generateDescriptionAction, listingInitialState);

  const [rewrittenDescription, setRewrittenDescription] = useState<string>('');
  const [listingFaqs, setListingFaqs] = useState<Faq[]>([]);

  const [isClientGenerating, setIsClientGenerating] = useState(false);

  const { isWebAIAvailable, run } = useWebAI();

  const [guideState, guideFormAction, isGuidePending] = useActionState(
    generateGuideAction,
    guideInitialState
  );
  const [socialState, socialFormAction, isSocialPending] = useActionState(
    generateSocialPostAction,
    socialInitialState
  );
  const [marketUpdateState, marketUpdateAction, isMarketUpdatePending] =
    useActionState(generateMarketUpdateAction, marketUpdateInitialState);
  const [videoScriptState, videoScriptAction, isVideoScriptPending] =
    useActionState(generateVideoScriptAction, videoScriptInitialState);
  const [blogPostState, blogPostAction, isBlogPostPending] = useActionState(
    generateBlogPostAction,
    blogPostInitialState
  );
  const [imageState, imageAction] = useActionState(
    regenerateImageAction,
    imageInitialState
  );

  const [headerImage, setHeaderImage] = useState<string | null>(null);

  const [marketUpdateContent, setMarketUpdateContent] = useState('');
  const [blogPostContent, setBlogPostContent] = useState('');
  const [videoScriptContent, setVideoScriptContent] = useState('');
  const [guideContent, setGuideContent] = useState('');
  const [socialPostContent, setSocialPostContent] = useState<SocialPostContentWithTopic | null>(null);

  // Memoize DynamoDB keys
  const projectsPK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
  const projectsSKPrefix = useMemo(() => 'PROJECT#', []);

  const { data: projects } = useQuery<Project>(projectsPK, projectsSKPrefix, {
    scanIndexForward: false, // descending order
  });

  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    toast({
      title: '✨ Copied to Clipboard!',
      description: 'Content is ready to paste',
      duration: 2000,
      className: 'success-message',
    });
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const openSaveDialog = (content: string, type: string) => {
    if (!content) return;
    setSaveDialogInfo({ isOpen: true, content, type });
  }

  const openScheduleDialog = (content: string, title: string, contentType: ContentCategory) => {
    if (!content) return;
    setScheduleDialogInfo({
      isOpen: true,
      content,
      title: title || contentType.replace('_', ' '),
      contentType
    });
  }

  const openTemplateSaveDialog = (contentType: ContentCategory, formData: FormData, previewContent: string = '') => {
    // Extract configuration from form data
    const configuration: TemplateConfiguration = {
      promptParameters: {},
      contentStructure: {
        sections: [],
        format: contentType === ContentCategory.BLOG_POST ? 'blog' : 'social'
      },
      stylePreferences: {
        tone: '',
        length: '',
        keywords: []
      }
    };

    // Extract form parameters based on content type
    if (contentType === ContentCategory.MARKET_UPDATE) {
      configuration.promptParameters = {
        location: formData.get('location'),
        timePeriod: formData.get('timePeriod'),
        propertyType: formData.get('propertyType'),
        audience: formData.get('audience')
      };
      configuration.stylePreferences.targetAudience = formData.get('audience') as string;
    } else if (contentType === ContentCategory.BLOG_POST) {
      configuration.promptParameters = {
        topic: formData.get('topic'),
        audience: formData.get('audience'),
        keywords: formData.get('keywords'),
        wordCount: formData.get('wordCount')
      };
      configuration.stylePreferences.targetAudience = formData.get('audience') as string;
      configuration.stylePreferences.length = formData.get('wordCount') as string;
      configuration.stylePreferences.keywords = (formData.get('keywords') as string)?.split(',').map(k => k.trim()) || [];
    } else if (contentType === ContentCategory.VIDEO_SCRIPT) {
      configuration.promptParameters = {
        topic: formData.get('topic'),
        videoLength: formData.get('videoLength'),
        tone: formData.get('tone'),
        audience: formData.get('audience'),
        callToAction: formData.get('callToAction')
      };
      configuration.stylePreferences.tone = formData.get('tone') as string;
      configuration.stylePreferences.targetAudience = formData.get('audience') as string;
      configuration.stylePreferences.callToAction = formData.get('callToAction') as string;
    } else if (contentType === ContentCategory.NEIGHBORHOOD_GUIDE) {
      configuration.promptParameters = {
        targetMarket: formData.get('targetMarket'),
        pillarTopic: formData.get('pillarTopic'),
        highlights: formData.get('highlights'),
        buyerType: formData.get('buyerType'),
        idxFeedUrl: formData.get('idxFeedUrl')
      };
      configuration.stylePreferences.targetAudience = formData.get('buyerType') as string;
    } else if (contentType === ContentCategory.SOCIAL_MEDIA) {
      configuration.promptParameters = {
        topic: formData.get('topic'),
        audience: formData.get('audience'),
        tone: formData.get('tone'),
        includeHashtags: formData.get('includeHashtags'),
        callToAction: formData.get('callToAction')
      };
      configuration.stylePreferences.tone = formData.get('tone') as string;
      configuration.stylePreferences.targetAudience = formData.get('audience') as string;
      configuration.stylePreferences.callToAction = formData.get('callToAction') as string;
      configuration.contentStructure.includeHashtags = formData.get('includeHashtags') === 'yes';
    }

    const contentTypeLabels: Record<ContentCategory, string> = {
      [ContentCategory.MARKET_UPDATE]: 'Market Update',
      [ContentCategory.BLOG_POST]: 'Blog Post',
      [ContentCategory.VIDEO_SCRIPT]: 'Video Script',
      [ContentCategory.NEIGHBORHOOD_GUIDE]: 'Neighborhood Guide',
      [ContentCategory.SOCIAL_MEDIA]: 'Social Media Post',
      [ContentCategory.LISTING_DESCRIPTION]: 'Listing Description',
      [ContentCategory.EMAIL_NEWSLETTER]: 'Email Newsletter'
    };

    setTemplateSaveDialogInfo({
      isOpen: true,
      contentType,
      configuration,
      initialName: `${contentTypeLabels[contentType]} Template`,
      previewContent
    });
  }

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);

    const topicFromSession = sessionStorage.getItem('genkit-topic');
    if (topicFromSession) {
      if (tab === 'blog-post') {
        setBlogTopic(topicFromSession);
      } else if (tab === 'social') {
        setSocialPostContent(prevState => ({ ...prevState!, topic: topicFromSession }));
      }
      sessionStorage.removeItem('genkit-topic');
    }
  }, [searchParams]);

  useEffect(() => {
    if (listingState.message === 'success') {
      if (listingState.data?.rewrittenDescription) {
        setRewrittenDescription(listingState.data.rewrittenDescription);
      }
      if (listingState.data?.listingFaqs) {
        setListingFaqs(listingState.data.listingFaqs);
      }
    } else if (listingState.message && listingState.message !== 'success') {
      toast({
        variant: 'destructive',
        title: 'Optimization Failed',
        description: listingState.message,
      });
    }
  }, [listingState]);

  useEffect(() => {
    if (blogPostState.message === 'success' && blogPostState.data?.headerImage) {
      setHeaderImage(blogPostState.data.headerImage);
      if (blogPostState.data.blogPost) {
        setBlogPostContent(blogPostState.data.blogPost);
      }
    } else if (blogPostState.message && blogPostState.message !== 'success') {
      toast({ variant: 'destructive', title: 'Blog Post Failed', description: blogPostState.message });
    }
  }, [blogPostState]);

  useEffect(() => {
    if (imageState.message === 'success' && imageState.data?.headerImage) {
      setHeaderImage(imageState.data.headerImage);
      toast({
        title: 'Image Regenerated!',
        description: 'A new header image has been generated.',
      });
    } else if (imageState.message && imageState.message !== 'success') {
      toast({
        variant: 'destructive',
        title: 'Image Regeneration Failed',
        description: imageState.message,
      });
    }
  }, [imageState]);

  useEffect(() => {
    if (marketUpdateState.message === 'success' && marketUpdateState.data) {
      setMarketUpdateContent(marketUpdateState.data);
    } else if (marketUpdateState.message && marketUpdateState.message !== 'success') {
      toast({ variant: 'destructive', title: 'Market Update Failed', description: marketUpdateState.message });
    }
  }, [marketUpdateState]);

  useEffect(() => {
    if (videoScriptState.message === 'success' && videoScriptState.data) {
      setVideoScriptContent(videoScriptState.data);
    } else if (videoScriptState.message && videoScriptState.message !== 'success') {
      toast({ variant: 'destructive', title: 'Video Script Failed', description: videoScriptState.message });
    }
  }, [videoScriptState]);

  useEffect(() => {
    if (guideState.message === 'success' && guideState.data.guide) {
      setGuideContent(guideState.data.guide);
    } else if (guideState.message && guideState.message !== 'success') {
      toast({ variant: 'destructive', title: 'Guide Failed', description: guideState.message });
    }
  }, [guideState]);

  useEffect(() => {
    if (socialState.message === 'success' && socialState.data) {
      setSocialPostContent(socialState.data);
    } else if (socialState.message && socialState.message !== 'success') {
      toast({ variant: 'destructive', title: 'Social Post Failed', description: socialState.message });
    }
  }, [socialState]);

  // Handle applied template from sessionStorage
  useEffect(() => {
    const appliedTemplateData = sessionStorage.getItem('applied-template');
    if (appliedTemplateData) {
      try {
        const appliedTemplate = JSON.parse(appliedTemplateData);
        const { templateName, contentType, configuration } = appliedTemplate;

        // Set the active tab based on content type
        const tabMapping: Record<ContentCategory, string> = {
          [ContentCategory.MARKET_UPDATE]: 'market-update',
          [ContentCategory.BLOG_POST]: 'blog-post',
          [ContentCategory.VIDEO_SCRIPT]: 'video-script',
          [ContentCategory.NEIGHBORHOOD_GUIDE]: 'guide',
          [ContentCategory.SOCIAL_MEDIA]: 'social',
          [ContentCategory.LISTING_DESCRIPTION]: 'listing',
          [ContentCategory.NEWSLETTER]: 'newsletter',
          [ContentCategory.EMAIL_TEMPLATE]: 'email'
        };

        const targetTab = tabMapping[contentType];
        if (targetTab) {
          setActiveTab(targetTab);
        }

        // Pre-populate form fields based on template configuration
        setTimeout(() => {
          populateFormFromTemplate(configuration, contentType);
        }, 100); // Small delay to ensure form is rendered

        // Set applied template info for display
        setAppliedTemplateInfo({
          templateName,
          contentType
        });

        // Show success message
        toast({
          title: 'Template Applied!',
          description: `"${templateName}" has been applied to your content creation form.`,
        });

        // Clear the applied template from sessionStorage
        sessionStorage.removeItem('applied-template');
      } catch (error) {
        console.error('Error applying template:', error);
        sessionStorage.removeItem('applied-template');
      }
    }
  }, []);

  // Function to populate form fields from template configuration
  const populateFormFromTemplate = (configuration: TemplateConfiguration, contentType: ContentCategory) => {
    const { promptParameters, stylePreferences } = configuration;

    try {
      // Market Update form population
      if (contentType === ContentCategory.MARKET_UPDATE) {
        const locationInput = document.querySelector('input[name="location"]') as HTMLInputElement;
        const timePeriodInput = document.querySelector('input[name="timePeriod"]') as HTMLInputElement;
        const propertyTypeSelect = document.querySelector('select[name="propertyType"]') as HTMLSelectElement;
        const audienceSelect = document.querySelector('select[name="audience"]') as HTMLSelectElement;

        if (locationInput && promptParameters.location) {
          locationInput.value = promptParameters.location;
        }
        if (timePeriodInput && promptParameters.timePeriod) {
          timePeriodInput.value = promptParameters.timePeriod;
        }
        if (propertyTypeSelect && promptParameters.propertyType) {
          propertyTypeSelect.value = promptParameters.propertyType;
        }
        if (audienceSelect && promptParameters.audience) {
          audienceSelect.value = promptParameters.audience;
        }
      }

      // Blog Post form population
      else if (contentType === ContentCategory.BLOG_POST) {
        const topicTextarea = document.querySelector('textarea[name="topic"]') as HTMLTextAreaElement;
        const audienceSelect = document.querySelector('select[name="audience"]') as HTMLSelectElement;
        const keywordsInput = document.querySelector('input[name="keywords"]') as HTMLInputElement;
        const wordCountSelect = document.querySelector('select[name="wordCount"]') as HTMLSelectElement;

        if (topicTextarea && promptParameters.topic) {
          topicTextarea.value = promptParameters.topic;
          setBlogTopic(promptParameters.topic);
        }
        if (audienceSelect && promptParameters.audience) {
          audienceSelect.value = promptParameters.audience;
        }
        if (keywordsInput && stylePreferences.keywords?.length) {
          keywordsInput.value = stylePreferences.keywords.join(', ');
        }
        if (wordCountSelect && promptParameters.wordCount) {
          wordCountSelect.value = promptParameters.wordCount;
        }
      }

      // Video Script form population
      else if (contentType === ContentCategory.VIDEO_SCRIPT) {
        const topicTextarea = document.querySelector('textarea[name="topic"]') as HTMLTextAreaElement;
        const videoLengthSelect = document.querySelector('select[name="videoLength"]') as HTMLSelectElement;
        const toneSelect = document.querySelector('select[name="tone"]') as HTMLSelectElement;
        const audienceSelect = document.querySelector('select[name="audience"]') as HTMLSelectElement;
        const callToActionInput = document.querySelector('input[name="callToAction"]') as HTMLInputElement;

        if (topicTextarea && promptParameters.topic) {
          topicTextarea.value = promptParameters.topic;
        }
        if (videoLengthSelect && promptParameters.videoLength) {
          videoLengthSelect.value = promptParameters.videoLength;
        }
        if (toneSelect && promptParameters.tone) {
          toneSelect.value = promptParameters.tone;
        }
        if (audienceSelect && promptParameters.audience) {
          audienceSelect.value = promptParameters.audience;
        }
        if (callToActionInput && promptParameters.callToAction) {
          callToActionInput.value = promptParameters.callToAction;
        }
      }

      // Neighborhood Guide form population
      else if (contentType === ContentCategory.NEIGHBORHOOD_GUIDE) {
        const targetMarketInput = document.querySelector('input[name="targetMarket"]') as HTMLInputElement;
        const pillarTopicSelect = document.querySelector('select[name="pillarTopic"]') as HTMLSelectElement;
        const highlightsTextarea = document.querySelector('textarea[name="highlights"]') as HTMLTextAreaElement;
        const buyerTypeSelect = document.querySelector('select[name="buyerType"]') as HTMLSelectElement;
        const idxFeedUrlInput = document.querySelector('input[name="idxFeedUrl"]') as HTMLInputElement;

        if (targetMarketInput && promptParameters.targetMarket) {
          targetMarketInput.value = promptParameters.targetMarket;
        }
        if (pillarTopicSelect && promptParameters.pillarTopic) {
          pillarTopicSelect.value = promptParameters.pillarTopic;
        }
        if (highlightsTextarea && promptParameters.highlights) {
          highlightsTextarea.value = promptParameters.highlights;
        }
        if (buyerTypeSelect && promptParameters.buyerType) {
          buyerTypeSelect.value = promptParameters.buyerType;
        }
        if (idxFeedUrlInput && promptParameters.idxFeedUrl) {
          idxFeedUrlInput.value = promptParameters.idxFeedUrl;
        }
      }

      // Social Media form population
      else if (contentType === ContentCategory.SOCIAL_MEDIA) {
        const topicTextarea = document.querySelector('textarea[name="topic"]') as HTMLTextAreaElement;
        const audienceSelect = document.querySelector('select[name="audience"]') as HTMLSelectElement;
        const toneSelect = document.querySelector('select[name="tone"]') as HTMLSelectElement;
        const includeHashtagsSelect = document.querySelector('select[name="includeHashtags"]') as HTMLSelectElement;
        const callToActionInput = document.querySelector('input[name="callToAction"]') as HTMLInputElement;

        if (topicTextarea && promptParameters.topic) {
          topicTextarea.value = promptParameters.topic;
        }
        if (audienceSelect && promptParameters.audience) {
          audienceSelect.value = promptParameters.audience;
        }
        if (toneSelect && promptParameters.tone) {
          toneSelect.value = promptParameters.tone;
        }
        if (includeHashtagsSelect && promptParameters.includeHashtags) {
          includeHashtagsSelect.value = promptParameters.includeHashtags;
        }
        if (callToActionInput && promptParameters.callToAction) {
          callToActionInput.value = promptParameters.callToAction;
        }
      }

    } catch (error) {
      console.error('Error populating form from template:', error);
      toast({
        variant: 'destructive',
        title: 'Template Application Error',
        description: 'Some template values could not be applied to the form.',
      });
    }
  };


  const handleListingSubmit = async (formData: FormData) => {
    const description = formData.get('propertyDescription') as string;
    const persona = formData.get('buyerPersona') as string;

    // Reset previous states
    setRewrittenDescription('');
    setListingFaqs([]);

    if (isWebAIAvailable && description && persona) {
      setIsClientGenerating(true);
      try {
        const result = await run('rewrite', {
          text: description,
          options: { persona },
        });
        setRewrittenDescription(result);
        toast({
          title: 'Description Rewritten!',
          description: 'Your listing was optimized on-device.',
        });
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'On-Device AI Failed',
          description: (e as Error).message,
        });
      } finally {
        setIsClientGenerating(false);
      }
    }
  };

  const listingFormAction = (formData: FormData) => {
    handleListingSubmit(formData);
    serverListingAction(formData);
  };

  const isListingOptimizing = isListingPending || isClientGenerating;

  const contentTypes = [
    {
      id: 'market-update',
      title: 'Market Updates',
      description: 'Share market insights that position you as the local expert',
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'blog-post',
      title: 'Blog Posts',
      description: 'Publish blog posts that rank and convert',
      icon: FileText,
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'video-script',
      title: 'Video Scripts',
      description: 'Script videos that stop the scroll and start conversations',
      icon: Video,
      color: 'from-orange-500 to-red-500',
    },
    {
      id: 'guide',
      title: 'Neighborhood Guides',
      description: 'Become the go-to expert for every neighborhood you serve',
      icon: MapPin,
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'social',
      title: 'Social Media',
      description: 'Post consistently across all platforms without the hassle',
      icon: MessageSquare,
      color: 'from-indigo-500 to-blue-500',
    },
  ];

  return (
    <div className="space-y-8">

      {/* Content Type Selector */}
      <Card className="animate-slide-in-top">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="content-type" className="text-sm font-medium whitespace-nowrap">
              <GradientText text="Content Type:" className="font-semibold" />
            </Label>
            <Select value={activeTab || 'market-update'} onValueChange={setActiveTab}>
              <SelectTrigger id="content-type" className="w-full max-w-md transition-all duration-200 hover:border-primary/50">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map((type, index) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem
                      key={type.id}
                      value={type.id}
                      className={cn(
                        "animate-slide-in-left opacity-0",
                        `stagger-${index + 1}`
                      )}
                      style={{ animationFillMode: 'forwards', animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                        <span className="button-text-hover">{type.title}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applied Template Indicator */}
      {appliedTemplateInfo && (
        <Card className="border-primary/20 bg-primary/5 animate-slide-in-top success-message">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center animate-scale-in">
                  <Sparkles className="w-4 h-4 text-primary animate-twinkle" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    <StaggeredText
                      text="Template Applied"
                      staggerBy="word"
                      delay={200}
                      staggerDelay={100}
                      animation="slideUp"
                    />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <Typewriter
                      text={`Using "${appliedTemplateInfo.templateName}" template`}
                      speed={30}
                      delay={800}
                      cursor={false}
                    />
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAppliedTemplateInfo(null)}
                className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Forms */}
      <Tabs value={activeTab || 'market-update'} onValueChange={setActiveTab} className="w-full">
        <div className="hidden">
          <TabsList>
            <TabsTrigger value="market-update">Market Updates</TabsTrigger>
            <TabsTrigger value="blog-post">Blog Posts</TabsTrigger>
            <TabsTrigger value="video-script">Video Scripts</TabsTrigger>
            <TabsTrigger value="guide">Neighborhood Guides</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="market-update" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="font-headline">
                  Market Update Generator
                </CardTitle>
                <CardDescription>
                  Create a hyper-local market update for a specific audience.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={marketUpdateAction} className="space-y-4">
                  <StandardFormField
                    label="Location"
                    id="location"
                    error={marketUpdateState.errors?.location?.[0]}
                  >
                    <Input
                      id="location"
                      name="location"
                      placeholder="e.g., Seattle, WA"
                      required
                    />
                  </StandardFormField>
                  <StandardFormField
                    label="Time Period"
                    id="timePeriod"
                    error={marketUpdateState.errors?.timePeriod?.[0]}
                  >
                    <Input
                      id="timePeriod"
                      name="timePeriod"
                      type="month"
                      defaultValue={new Date().toISOString().slice(0, 7)}
                      required
                    />
                  </StandardFormField>
                  <StandardFormField
                    label="Property Type"
                    id="propertyType"
                    error={marketUpdateState.errors?.propertyType?.[0]}
                  >
                    <Select name="propertyType" defaultValue="All Properties">
                      <SelectTrigger id="propertyType">
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Properties">All Properties</SelectItem>
                        <SelectItem value="Single-Family Homes">Single-Family Homes</SelectItem>
                        <SelectItem value="Condos">Condos</SelectItem>
                        <SelectItem value="Townhomes">Townhomes</SelectItem>
                        <SelectItem value="Luxury Homes">Luxury Homes</SelectItem>
                      </SelectContent>
                    </Select>
                  </StandardFormField>
                  <StandardFormField
                    label="Target Audience"
                    id="audience"
                    error={marketUpdateState.errors?.audience?.[0]}
                  >
                    <Select name="audience" defaultValue="General Buyers">
                      <SelectTrigger id="audience">
                        <SelectValue placeholder="Select audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General Buyers">General Buyers</SelectItem>
                        <SelectItem value="First-Time Buyers">First-Time Buyers</SelectItem>
                        <SelectItem value="Investors">Investors</SelectItem>
                        <SelectItem value="Luxury Buyers">Luxury Buyers</SelectItem>
                        <SelectItem value="Sellers">Sellers</SelectItem>
                      </SelectContent>
                    </Select>
                  </StandardFormField>
                  <StandardFormActions
                    primaryAction={{
                      label: 'Generate Update',
                      type: 'submit',
                      loading: isMarketUpdatePending,
                      variant: 'ai',
                    }}
                    secondaryAction={{
                      label: 'Save as Template',
                      onClick: () => {
                        const form = document.querySelector('form[action*="marketUpdate"]') as HTMLFormElement;
                        if (form) {
                          const formData = new FormData(form);
                          openTemplateSaveDialog(ContentCategory.MARKET_UPDATE, formData);
                        }
                      }
                    }}
                  />
                </form>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2 min-h-[400px]">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="font-headline">
                  Generated Market Update
                </CardTitle>
                {marketUpdateContent && (
                  <div className="flex gap-2">
                    <Button
                      variant="ai"
                      size="sm"
                      onClick={() => openScheduleDialog(marketUpdateContent, 'Market Update', ContentCategory.MARKET_UPDATE)}
                      className="font-medium transition-all duration-200 hover:scale-105"
                    >
                      <Sparkles className="mr-2 h-4 w-4 animate-twinkle" />
                      <span className="button-text-hover">Schedule</span>
                    </Button>
                    <Button
                      variant={copiedStates['market-update'] ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => copyToClipboard(marketUpdateContent, 'market-update')}
                      className="transition-all duration-200 hover:scale-105"
                    >
                      {copiedStates['market-update'] ? (
                        <>
                          <Check className="mr-2 h-4 w-4 animate-scale-in" />
                          <span className="text-gradient-animated font-medium">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          <span className="button-text-hover">Copy</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSaveDialog(marketUpdateContent, 'Market Update')}
                      className="transition-all duration-200 hover:scale-105"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      <span className="button-text-hover">Save</span>
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isMarketUpdatePending ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <LoadingDots className="text-primary" size="lg" />
                    <div className="text-center">
                      <Typewriter
                        text="Writing your market update..."
                        speed={60}
                        className="text-lg font-medium text-primary"
                        cursor={true}
                        cursorChar="▋"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        <StaggeredText
                          text="Analyzing market data and crafting insights..."
                          staggerBy="word"
                          delay={2000}
                          staggerDelay={100}
                          animation="fadeIn"
                        />
                      </p>
                    </div>
                  </div>
                ) : marketUpdateContent ? (
                  <div className="space-y-4">
                    <Textarea
                      value={marketUpdateContent}
                      onChange={(e) => setMarketUpdateContent(e.target.value)}
                      rows={15}
                      className="w-full h-full font-mono text-sm resize-none"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse-gentle">
                      <TrendingUp className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground text-lg">
                      <StaggeredText
                        text="Your market update will appear here."
                        staggerBy="word"
                        delay={300}
                        staggerDelay={80}
                        animation="slideUp"
                      />
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      <Typewriter
                        text="Fill in the details and we'll write it for you."
                        speed={40}
                        delay={1500}
                        cursor={false}
                      />
                    </p>
                  </div>
                )}
                <ErrorDisplay message={marketUpdateState.message !== 'success' ? marketUpdateState.message : null} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="blog-post" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="font-headline">
                  Blog Post Generator
                </CardTitle>
                <CardDescription>
                  Create a long-form, SEO-friendly blog post on any topic.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={blogPostAction} className="space-y-4">
                  <StandardFormField
                    label="Blog Topic"
                    id="blogTopic"
                    error={blogPostState.errors?.topic?.[0]}
                  >
                    <Textarea
                      id="blogTopic"
                      name="topic"
                      placeholder="e.g., The top 5 neighborhoods in Seattle for young professionals"
                      rows={4}
                      value={blogTopic}
                      onChange={e => setBlogTopic(e.target.value)}
                      required
                    />
                  </StandardFormField>
                  <StandardFormField
                    label="Target Audience"
                    id="blogAudience"
                  >
                    <Input
                      id="blogAudience"
                      name="audience"
                      placeholder="e.g., First-time homebuyers, Millennials"
                    />
                  </StandardFormField>
                  <StandardFormField
                    label="SEO Keywords (Optional)"
                    id="keywords"
                  >
                    <Input
                      id="keywords"
                      name="keywords"
                      placeholder="e.g., Seattle real estate, best neighborhoods"
                    />
                  </StandardFormField>
                  <StandardFormField
                    label="Desired Length"
                    id="wordCount"
                  >
                    <Select name="wordCount" defaultValue="medium">
                      <SelectTrigger id="wordCount">
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (500-800 words)</SelectItem>
                        <SelectItem value="medium">Medium (1000-1500 words)</SelectItem>
                        <SelectItem value="long">Long (2000+ words)</SelectItem>
                      </SelectContent>
                    </Select>
                  </StandardFormField>
                  <StandardFormActions
                    primaryAction={{
                      label: 'Generate Blog Post',
                      type: 'submit',
                      loading: isBlogPostPending,
                      variant: 'ai',
                    }}
                    secondaryAction={{
                      label: 'Save as Template',
                      onClick: () => {
                        const form = document.querySelector('form[action*="blogPost"]') as HTMLFormElement;
                        if (form) {
                          const formData = new FormData(form);
                          openTemplateSaveDialog(ContentCategory.BLOG_POST, formData, blogPostContent);
                        }
                      }
                    }}
                  />
                </form>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2 min-h-[400px]">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="font-headline">
                  Generated Blog Post
                </CardTitle>
                {blogPostContent && (
                  <div className="flex gap-2">
                    <Button
                      variant="ai"
                      size="sm"
                      onClick={() => openScheduleDialog(blogPostContent, blogTopic || 'Blog Post', ContentCategory.BLOG_POST)}
                      className="font-medium"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Schedule
                    </Button>
                    <Button
                      variant={copiedStates['blog-post'] ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => copyToClipboard(blogPostContent, 'blog-post')}
                    >
                      {copiedStates['blog-post'] ? (
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
                    <Button variant="outline" size="sm" onClick={() => openSaveDialog(blogPostContent, 'Blog Post')}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isBlogPostPending ? (
                  <StandardLoadingSpinner variant="ai" message="Writing your blog post..." />
                ) : blogPostContent ? (
                  <div className="space-y-4">
                    {headerImage && (
                      <div className="relative aspect-video mb-6 overflow-hidden rounded-lg group shadow-lg">
                        <Image
                          src={headerImage}
                          alt={blogTopic || 'Blog post header'}
                          fill
                          objectFit="cover"
                        />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <form action={imageAction}>
                            <input
                              type="hidden"
                              name="topic"
                              value={blogTopic}
                            />
                            <RegenerateImageButton>
                              Regenerate Image
                            </RegenerateImageButton>
                          </form>
                        </div>
                      </div>
                    )}
                    <Textarea
                      value={blogPostContent}
                      onChange={(e) => setBlogPostContent(e.target.value)}
                      rows={20}
                      className="w-full h-full font-mono text-sm resize-none"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground text-lg">
                      Your blog post and header image will appear here.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Pick a topic and we'll write a complete blog post with an image.
                    </p>
                  </div>
                )}
                <ErrorDisplay message={blogPostState.message !== 'success' ? blogPostState.message : null} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="video-script" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="font-headline">
                  Video Script Generator
                </CardTitle>
                <CardDescription>
                  Create a 60-second video script with fine-tuned controls.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={videoScriptAction} className="space-y-4">
                  <StandardFormField
                    label="Topic"
                    id="videoTopic"
                    error={videoScriptState.errors?.topic?.[0]}
                  >
                    <Textarea
                      id="videoTopic"
                      name="topic"
                      placeholder="e.g., What is an assumable mortgage?"
                      rows={3}
                      required
                    />
                  </StandardFormField>
                  <StandardFormField
                    label="Video Length"
                    id="videoLength"
                  >
                    <Select name="videoLength" defaultValue="60">
                      <SelectTrigger id="videoLength">
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 seconds (Short)</SelectItem>
                        <SelectItem value="60">60 seconds (Standard)</SelectItem>
                        <SelectItem value="90">90 seconds (Extended)</SelectItem>
                        <SelectItem value="120">2 minutes (Long-form)</SelectItem>
                      </SelectContent>
                    </Select>
                  </StandardFormField>
                  <StandardFormField
                    label="Tone of Voice"
                    id="videoTone"
                    error={videoScriptState.errors?.tone?.[0]}
                  >
                    <Select name="tone" defaultValue="Engaging">
                      <SelectTrigger id="videoTone">
                        <SelectValue placeholder="Select a tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Engaging">Engaging</SelectItem>
                        <SelectItem value="Professional">Professional</SelectItem>
                        <SelectItem value="Humorous">Humorous</SelectItem>
                        <SelectItem value="Inspirational">Inspirational</SelectItem>
                        <SelectItem value="Educational">Educational</SelectItem>
                      </SelectContent>
                    </Select>
                  </StandardFormField>
                  <StandardFormField
                    label="Target Audience"
                    id="videoAudience"
                    error={videoScriptState.errors?.audience?.[0]}
                  >
                    <Input
                      id="videoAudience"
                      name="audience"
                      placeholder="e.g., First-time buyers"
                      required
                    />
                  </StandardFormField>
                  <StandardFormField
                    label="Call-to-Action (Optional)"
                    id="callToAction"
                  >
                    <Input
                      id="callToAction"
                      name="callToAction"
                      placeholder="e.g., Visit my website, Schedule a consultation"
                    />
                  </StandardFormField>
                  <StandardFormActions
                    primaryAction={{
                      label: 'Generate Script',
                      type: 'submit',
                      loading: isVideoScriptPending,
                      variant: 'ai',
                    }}
                    secondaryAction={{
                      label: 'Save as Template',
                      onClick: () => {
                        const form = document.querySelector('form[action*="videoScript"]') as HTMLFormElement;
                        if (form) {
                          const formData = new FormData(form);
                          openTemplateSaveDialog(ContentCategory.VIDEO_SCRIPT, formData, videoScriptContent);
                        }
                      }
                    }}
                  />
                </form>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2 min-h-[400px]">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="font-headline">
                  Generated Video Script
                </CardTitle>
                {videoScriptContent && (
                  <div className="flex gap-2">
                    <Button
                      variant="ai"
                      size="sm"
                      onClick={() => openScheduleDialog(videoScriptContent, 'Video Script', ContentCategory.VIDEO_SCRIPT)}
                      className="font-medium"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Schedule
                    </Button>
                    <Button
                      variant={copiedStates['video-script'] ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => copyToClipboard(videoScriptContent, 'video-script')}
                    >
                      {copiedStates['video-script'] ? (
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
                    <Button variant="outline" size="sm" onClick={() => openSaveDialog(videoScriptContent, 'Video Script')}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isVideoScriptPending ? (
                  <StandardLoadingSpinner variant="ai" message="Writing your video script..." />
                ) : videoScriptContent ? (
                  <div className="space-y-4">
                    <Textarea
                      value={videoScriptContent}
                      onChange={(e) => setVideoScriptContent(e.target.value)}
                      rows={15}
                      className="w-full h-full font-mono text-sm resize-none"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Video className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground text-lg">
                      Your video script will appear here.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Tell us what you want to say and we'll script it for you.
                    </p>
                  </div>
                )}
                <ErrorDisplay message={videoScriptState.message !== 'success' ? videoScriptState.message : null} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="guide" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="font-headline">
                  Content Generator
                </CardTitle>
                <CardDescription>
                  Define your topic to draft a comprehensive guide.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={guideFormAction} className="space-y-4">
                  <StandardFormField
                    label="Target Market"
                    id="targetMarket"
                    error={guideState.errors?.targetMarket?.[0]}
                  >
                    <Input
                      id="targetMarket"
                      name="targetMarket"
                      placeholder="e.g., 'Seattle, WA'"
                      defaultValue="Seattle, WA"
                      required
                    />
                  </StandardFormField>
                  <StandardFormField
                    label="Neighborhood/Area"
                    id="pillarTopic"
                    error={guideState.errors?.pillarTopic?.[0]}
                  >
                    <Input
                      id="pillarTopic"
                      name="pillarTopic"
                      placeholder="e.g., 'Capitol Hill'"
                      defaultValue="The Ultimate Guide to Living in the Capitol Hill Neighborhood"
                      required
                    />
                  </StandardFormField>
                  <StandardFormField
                    label="Key Highlights (Optional)"
                    id="highlights"
                  >
                    <Textarea
                      id="highlights"
                      name="highlights"
                      placeholder="e.g., Great schools, walkable downtown, vibrant nightlife"
                      rows={3}
                    />
                  </StandardFormField>
                  <StandardFormField
                    label="Target Buyer Type"
                    id="buyerType"
                  >
                    <Select name="buyerType" defaultValue="General">
                      <SelectTrigger id="buyerType">
                        <SelectValue placeholder="Select buyer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General Buyers</SelectItem>
                        <SelectItem value="Young Professionals">Young Professionals</SelectItem>
                        <SelectItem value="Families">Families</SelectItem>
                        <SelectItem value="Retirees">Retirees</SelectItem>
                        <SelectItem value="Investors">Investors</SelectItem>
                      </SelectContent>
                    </Select>
                  </StandardFormField>
                  <StandardFormField
                    label="IDX Feed URL (Optional)"
                    id="idxFeedUrl"
                  >
                    <Input
                      id="idxFeedUrl"
                      name="idxFeedUrl"
                      placeholder="e.g., 'https://my-idx-provider.com/seattle-capitol-hill'"
                    />
                  </StandardFormField>
                  <StandardFormActions
                    primaryAction={{
                      label: 'Generate Guide',
                      type: 'submit',
                      loading: isGuidePending,
                      variant: 'ai',
                    }}
                    secondaryAction={{
                      label: 'Save as Template',
                      onClick: () => {
                        const form = document.querySelector('form[action*="guide"]') as HTMLFormElement;
                        if (form) {
                          const formData = new FormData(form);
                          openTemplateSaveDialog(ContentCategory.NEIGHBORHOOD_GUIDE, formData, guideContent);
                        }
                      }
                    }}
                  />
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 min-h-[400px]">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="font-headline">
                  Generated Neighborhood Guide
                </CardTitle>
                {guideContent && (
                  <div className="flex gap-2">
                    <Button
                      variant="ai"
                      size="sm"
                      onClick={() => openScheduleDialog(guideContent, 'Neighborhood Guide', ContentCategory.NEIGHBORHOOD_GUIDE)}
                      className="font-medium"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Schedule
                    </Button>
                    <Button
                      variant={copiedStates['guide'] ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => copyToClipboard(guideContent, 'guide')}
                    >
                      {copiedStates['guide'] ? (
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
                    <Button variant="outline" size="sm" onClick={() => openSaveDialog(guideContent, 'Neighborhood Guide')}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isGuidePending ? (
                  <StandardLoadingSpinner variant="ai" message="Writing your neighborhood guide..." />
                ) : guideContent ? (
                  <div className="space-y-4">
                    <Textarea
                      value={guideContent}
                      onChange={(e) => setGuideContent(e.target.value)}
                      rows={20}
                      className="w-full h-full font-mono text-sm resize-none"
                    />
                    <IdxFeedPlaceholder url={guideState.data.idxFeedUrl} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <MapPin className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground text-lg">
                      Your neighborhood guide will appear here.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      We'll create the guide, then you can add your local insights.
                    </p>
                  </div>
                )}
                <ErrorDisplay message={guideState.message !== 'success' ? guideState.message : null} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="social" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="font-headline">Post Generator</CardTitle>
                <CardDescription>
                  Define your topic and tone to generate social posts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={socialFormAction} className="space-y-4">
                  <StandardFormField
                    label="Topic"
                    id="topic"
                    error={socialState.errors?.topic?.[0]}
                  >
                    <Textarea
                      id="topic"
                      name="topic"
                      placeholder="e.g., 'The benefits of using a real estate agent for first-time homebuyers'"
                      rows={4}
                      value={socialPostContent?.topic || ''}
                      onChange={e => setSocialPostContent(prev => ({ ...prev, topic: e.target.value } as SocialPostContentWithTopic))}
                      required
                    />
                  </StandardFormField>
                  <StandardFormField
                    label="Target Audience"
                    id="socialAudience"
                  >
                    <Input
                      id="socialAudience"
                      name="audience"
                      placeholder="e.g., First-time buyers, Millennials"
                    />
                  </StandardFormField>
                  <StandardFormField
                    label="Tone of Voice"
                    id="tone"
                    error={socialState.errors?.tone?.[0]}
                  >
                    <Select name="tone" defaultValue="Professional">
                      <SelectTrigger id="tone">
                        <SelectValue placeholder="Select a tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Professional">Professional</SelectItem>
                        <SelectItem value="Casual">Casual</SelectItem>
                        <SelectItem value="Enthusiastic">Enthusiastic</SelectItem>
                        <SelectItem value="Humorous">Humorous</SelectItem>
                        <SelectItem value="Inspirational">Inspirational</SelectItem>
                      </SelectContent>
                    </Select>
                  </StandardFormField>
                  <StandardFormField
                    label="Include Hashtags"
                    id="includeHashtags"
                  >
                    <Select name="includeHashtags" defaultValue="yes">
                      <SelectTrigger id="includeHashtags">
                        <SelectValue placeholder="Include hashtags?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes, include hashtags</SelectItem>
                        <SelectItem value="no">No hashtags</SelectItem>
                      </SelectContent>
                    </Select>
                  </StandardFormField>
                  <StandardFormField
                    label="Call-to-Action (Optional)"
                    id="socialCTA"
                  >
                    <Input
                      id="socialCTA"
                      name="callToAction"
                      placeholder="e.g., Contact me today, Visit my website"
                    />
                  </StandardFormField>
                  <StandardFormActions
                    primaryAction={{
                      label: 'Generate Posts',
                      type: 'submit',
                      loading: isSocialPending,
                      variant: 'ai',
                    }}
                    secondaryAction={{
                      label: 'Save as Template',
                      onClick: () => {
                        const form = document.querySelector('form[action*="social"]') as HTMLFormElement;
                        if (form) {
                          const formData = new FormData(form);
                          const previewContent = socialPostContent ?
                            `LinkedIn: ${socialPostContent.linkedin?.substring(0, 100)}...` : '';
                          openTemplateSaveDialog(ContentCategory.SOCIAL_MEDIA, formData, previewContent);
                        }
                      }
                    }}
                  />
                </form>
              </CardContent>
            </Card>
            <div className="lg:col-span-2">
              <Card className="min-h-[400px]">
                <CardHeader>
                  <CardTitle className="font-headline">
                    Generated Social Media Posts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isSocialPending ? (
                    <StandardLoadingSpinner variant="ai" message="Writing your social posts..." />
                  ) : socialPostContent ? (
                    <>
                      <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-700/30">
                        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-700/5 to-transparent">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center">
                              <Linkedin className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-headline font-bold text-lg">LinkedIn</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ai"
                              size="sm"
                              onClick={() => openScheduleDialog(socialPostContent.linkedin || '', 'LinkedIn Post', ContentCategory.SOCIAL_MEDIA)}
                              className="font-medium"
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              Schedule
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openSaveDialog(socialPostContent.linkedin || '', 'Social Post (LinkedIn)')}>
                              <Save className="mr-2 h-4 w-4" />
                              Save
                            </Button>
                            <Button
                              variant={copiedStates['linkedin'] ? 'default' : 'outline'}
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  socialPostContent.linkedin || '',
                                  'linkedin'
                                )
                              }
                            >
                              {copiedStates['linkedin'] ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <Textarea
                            value={socialPostContent.linkedin}
                            onChange={(e) => setSocialPostContent(prev => ({ ...prev!, linkedin: e.target.value }))}
                            rows={6}
                            className="w-full h-full font-mono text-sm resize-none"
                          />
                        </CardContent>
                      </Card>
                      <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-600/30">
                        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600/5 to-transparent">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                              <Facebook className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-headline font-bold text-lg">Facebook</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ai"
                              size="sm"
                              onClick={() => openScheduleDialog(socialPostContent.facebook || '', 'Facebook Post', ContentCategory.SOCIAL_MEDIA)}
                              className="font-medium"
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              Schedule
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openSaveDialog(socialPostContent.facebook || '', 'Social Post (Facebook)')}>
                              <Save className="mr-2 h-4 w-4" />
                              Save
                            </Button>
                            <Button
                              variant={copiedStates['facebook'] ? 'default' : 'outline'}
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  socialPostContent.facebook || '',
                                  'facebook'
                                )
                              }
                            >
                              {copiedStates['facebook'] ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <Textarea
                            value={socialPostContent.facebook}
                            onChange={(e) => setSocialPostContent(prev => ({ ...prev!, facebook: e.target.value }))}
                            rows={6}
                            className="w-full h-full font-mono text-sm resize-none"
                          />
                        </CardContent>
                      </Card>
                      <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-sky-500/30">
                        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-sky-500/5 to-transparent">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                              <X className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-headline font-bold text-lg">X (Twitter)</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ai"
                              size="sm"
                              onClick={() => openScheduleDialog(socialPostContent.twitter || '', 'X (Twitter) Post', ContentCategory.SOCIAL_MEDIA)}
                              className="font-medium"
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              Schedule
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openSaveDialog(socialPostContent.twitter || '', 'Social Post (X/Twitter)')}>
                              <Save className="mr-2 h-4 w-4" />
                              Save
                            </Button>
                            <Button
                              variant={copiedStates['twitter'] ? 'default' : 'outline'}
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  socialPostContent.twitter || '',
                                  'twitter'
                                )
                              }
                            >
                              {copiedStates['twitter'] ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <Textarea
                            value={socialPostContent.twitter}
                            onChange={(e) => setSocialPostContent(prev => ({ ...prev!, twitter: e.target.value }))}
                            rows={4}
                            className="w-full h-full font-mono text-sm resize-none"
                          />
                        </CardContent>
                      </Card>
                      <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-red-500/30">
                        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-red-500/5 to-transparent">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-headline font-bold text-lg">Google Business Profile</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ai"
                              size="sm"
                              onClick={() => openScheduleDialog(socialPostContent.googleBusiness || '', 'Google Business Post', ContentCategory.SOCIAL_MEDIA)}
                              className="font-medium"
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              Schedule
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openSaveDialog(socialPostContent.googleBusiness || '', 'Social Post (Google Business Profile)')}>
                              <Save className="mr-2 h-4 w-4" />
                              Save
                            </Button>
                            <Button
                              variant={copiedStates['googleBusiness'] ? 'default' : 'outline'}
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  socialPostContent.googleBusiness || '',
                                  'googleBusiness'
                                )
                              }
                            >
                              {copiedStates['googleBusiness'] ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <Textarea
                            value={socialPostContent.googleBusiness}
                            onChange={(e) => setSocialPostContent(prev => ({ ...prev!, googleBusiness: e.target.value }))}
                            rows={6}
                            className="w-full h-full font-mono text-sm resize-none"
                          />
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <MessageSquare className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-muted-foreground text-lg">
                        Your generated social media posts will appear here.
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Posts will be optimized for LinkedIn, Facebook, X (Twitter), and Google Business Profile.
                      </p>
                    </div>
                  )}
                  <ErrorDisplay message={socialState.message !== 'success' ? socialState.message : null} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <SaveDialog dialogInfo={saveDialogInfo} setDialogInfo={setSaveDialogInfo} />
      <SchedulingModal
        isOpen={scheduleDialogInfo.isOpen}
        onClose={() => setScheduleDialogInfo({ isOpen: false, content: '', title: '', contentType: ContentCategory.MARKET_UPDATE })}
        onScheduled={(scheduledContent) => {
          toast({
            title: 'Content Scheduled!',
            description: `Your ${scheduleDialogInfo.title} has been scheduled successfully.`
          });
        }}
        contentData={{
          contentId: `content_${Date.now()}`, // Generate a unique ID
          title: scheduleDialogInfo.title,
          content: scheduleDialogInfo.content,
          contentType: scheduleDialogInfo.contentType
        }}
      />
      <TemplateSaveModal
        isOpen={templateSaveDialogInfo.isOpen}
        onClose={() => setTemplateSaveDialogInfo({
          isOpen: false,
          contentType: ContentCategory.MARKET_UPDATE,
          configuration: {
            promptParameters: {},
            contentStructure: { sections: [], format: '' },
            stylePreferences: { tone: '', length: '', keywords: [] }
          },
          initialName: '',
          previewContent: ''
        })}
        onSaved={(templateId) => {
          toast({
            title: 'Template Saved!',
            description: 'Your template has been saved and can be reused for future content creation.'
          });
        }}
        contentType={templateSaveDialogInfo.contentType}
        configuration={templateSaveDialogInfo.configuration}
        initialName={templateSaveDialogInfo.initialName}
        previewContent={templateSaveDialogInfo.previewContent}
      />
    </div>
  );
}
