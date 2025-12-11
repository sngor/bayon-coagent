
'use client';

import { useActionState, useState, useTransition, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';

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
import {
  generateGuideAction,
  generateSocialPostAction,
  generateDescriptionAction,
  generateMarketUpdateAction,
  generateVideoScriptAction,
  generateBlogPostAction,
  regenerateImageAction,
  generateBlogImageAction,
  saveContentAction,
  generateFutureCastAction,
} from '@/app/actions';
import { FutureCastChart } from '@/components/market/future-cast-chart';
import type { GenerateFutureCastOutput } from '@/ai/schemas/market-update-schemas';

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
  Twitter,
  Facebook,
  Sparkles,
  Save,
  RefreshCw,
  ServerCrash,
  ShieldAlert,
  TrendingUp,
  FileText,
  Video,
  MapPin,
  MessageSquare,
  Home,
  Check,
  ImagePlus,
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
import { type GenerateSocialMediaPostOutput } from '@/aws/bedrock/flows';
import { useWebAI } from '@/hooks/useWebAI';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useUser } from '@/aws/auth';
import type { Project } from '@/lib/types/common';
import { cn } from '@/lib/utils/common';
import { StandardErrorDisplay } from '@/components/standard/error-display';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProjectSelector } from '@/components/project-selector';

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

type SocialPostContentWithTopic = GenerateSocialMediaPostOutput & { topic?: string };
const socialInitialState: SocialInitialState = {
  message: '',
  data: null,
  errors: {},
};

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

type FutureCastInitialState = {
  message: string;
  data: GenerateFutureCastOutput | null;
  errors: any;
};
const futureCastInitialState: FutureCastInitialState = {
  message: '',
  data: null,
  errors: {},
};

type SaveDialogInfo = {
  isOpen: boolean;
  content: string;
  type: string;
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
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      {pending ? 'Generating...' : children}
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
      {pending ? 'Generating...' : children}
    </Button>
  );
}


function SaveDialog({ dialogInfo, setDialogInfo }: { dialogInfo: SaveDialogInfo, setDialogInfo: (info: SaveDialogInfo) => void }) {
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);

  const handleSave = () => {
    if (!user || !dialogInfo.content) {
      toast({
        variant: 'destructive',
        title: 'Could not save',
        description: 'Content or user is missing.',
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await saveContentAction(
          user.id,
          dialogInfo.content,
          dialogInfo.type,
          name || dialogInfo.type,
          projectId || null
        );

        if (result.message === 'Content saved successfully') {
          toast({
            title: 'Content Saved!',
            description: `Your content has been saved to your Projects.`,
          });
          setDialogInfo({ isOpen: false, content: '', type: '' });
          setName('');
          setProjectId(null);
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
          <div className="space-y-2">
            <Label htmlFor="contentName">Content Name (Optional)</Label>
            <Input id="contentName" value={name} onChange={(e) => setName(e.target.value)} placeholder={`e.g., ${dialogInfo.type} for October`} />
          </div>
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
        <h3 className="font-headline text-2xl font-bold">Live Property Feed</h3>
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

function GeneratingContentPlaceholder() {
  const messages = [
    'Consulting with our digital marketing experts...',
    'Brewing up some fresh content ideas...',
    'Analyzing market trends for the perfect angle...',
    'Assembling your content, pixel by pixel...',
    'Teaching the AI about curb appeal...',
    'Warming up the creativity engines...',
    'Finding the most persuasive adjectives...',
    'Checking for SEO best practices...',
  ];
  const [currentMessage, setCurrentMessage] = useState(messages[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage(prevMessage => {
        const currentIndex = messages.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % messages.length;
        return messages[nextIndex];
      });
    }, 2500); // Change message every 2.5 seconds

    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full p-12 transition-all duration-300">
      <div className="relative mb-8">
        {/* Outer pulsing ring */}
        <div className="absolute inset-0 w-20 h-20 -left-2 -top-2 border-4 border-primary/10 rounded-full animate-ping" />
        {/* Middle rotating ring */}
        <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
        {/* Inner spinning ring */}
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        {/* Sparkles icon with pulse */}
        <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 text-primary animate-pulse" />
        {/* Floating sparkles */}
        <div className="absolute -top-2 -right-2 w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
        <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-1/2 -right-3 w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
      </div>
      <div className="space-y-3 max-w-md">
        <p className="font-semibold text-lg animate-pulse bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          {currentMessage}
        </p>
        <p className="text-sm">This may take a few moments.</p>
        <div className="flex justify-center gap-1 mt-4">
          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
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
  const [blogImageState, blogImageAction, isBlogImagePending] = useActionState(
    generateBlogImageAction,
    { message: '', data: { imageUrl: null }, errors: {} }
  );
  const [futureCastState, futureCastAction, isFutureCastPending] = useActionState(
    generateFutureCastAction,
    futureCastInitialState
  );

  const [headerImage, setHeaderImage] = useState<string | null>(null);

  const [marketUpdateContent, setMarketUpdateContent] = useState('');
  const [futureCastData, setFutureCastData] = useState<GenerateFutureCastOutput | null>(null);
  const [blogPostContent, setBlogPostContent] = useState('');
  const [videoScriptContent, setVideoScriptContent] = useState('');
  const [guideContent, setGuideContent] = useState('');
  const [socialPostContent, setSocialPostContent] = useState<SocialPostContentWithTopic | null>(null);



  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    toast({
      title: 'Copied to Clipboard!',
      description: 'Content is ready to paste',
      duration: 2000,
    });
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const openSaveDialog = (content: string, type: string) => {
    if (!content) return;
    setSaveDialogInfo({ isOpen: true, content, type });
  }

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);

    const topicFromSession = sessionStorage.getItem('genkit-topic');
    if (topicFromSession) {
      if (tab === 'blog-post') {
        setBlogTopic(topicFromSession);
      } else if (tab === 'social') {
        setSocialPostContent((prevState: any) => ({ ...prevState!, topic: topicFromSession }));
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
    console.log('Blog post state changed:', {
      message: blogPostState.message,
      hasData: !!blogPostState.data,
      hasBlogPost: !!blogPostState.data?.blogPost,
      blogPostLength: blogPostState.data?.blogPost?.length,
      fullState: blogPostState
    });

    if (blogPostState.message === 'success') {
      if (blogPostState.data?.blogPost) {
        console.log('Setting blog post content, length:', blogPostState.data.blogPost.length);
        setBlogPostContent(blogPostState.data.blogPost);
        toast({ title: 'Blog Post Generated', description: 'Your blog post is ready!' });
      } else {
        console.error('Blog post data is missing:', blogPostState);
        toast({ variant: 'destructive', title: 'Error', description: 'Blog post was generated but content is missing.' });
      }
    } else if (blogPostState.message && blogPostState.message !== 'success') {
      toast({ variant: 'destructive', title: 'Blog Post Failed', description: blogPostState.message });
    }
  }, [blogPostState]);

  useEffect(() => {
    if (blogImageState.message === 'success' && blogImageState.data?.imageUrl) {
      setHeaderImage(blogImageState.data.imageUrl);
      toast({ title: 'Image Generated', description: 'Blog header image generated successfully!' });
    } else if (blogImageState.message && blogImageState.message !== 'success') {
      toast({ variant: 'destructive', title: 'Image Generation Failed', description: blogImageState.message });
    }
  }, [blogImageState]);

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

  useEffect(() => {
    if (futureCastState.message === 'success' && futureCastState.data) {
      setFutureCastData(futureCastState.data);
    } else if (futureCastState.message && futureCastState.message !== 'success') {
      toast({ variant: 'destructive', title: 'FutureCast Failed', description: futureCastState.message });
    }
  }, [futureCastState]);


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
      description: 'Create hyper-local market updates for your audience',
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'future-cast',
      title: 'FutureCast',
      description: 'Predictive market trends and forecasts',
      icon: TrendingUp,
      color: 'from-violet-500 to-purple-500',
    },
    {
      id: 'blog-post',
      title: 'Blog Posts',
      description: 'Generate SEO-friendly long-form content',
      icon: FileText,
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'video-script',
      title: 'Video Scripts',
      description: 'Create engaging 60-second video scripts',
      icon: Video,
      color: 'from-orange-500 to-red-500',
    },
    {
      id: 'guide',
      title: 'Neighborhood Guides',
      description: 'Comprehensive guides for local areas',
      icon: MapPin,
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'social',
      title: 'Social Media',
      description: 'Multi-platform social media posts',
      icon: MessageSquare,
      color: 'from-indigo-500 to-blue-500',
    },
    {
      id: 'listing',
      title: 'Listing Optimizer',
      description: 'Optimize listings for target personas',
      icon: Home,
      color: 'from-amber-500 to-yellow-500',
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-headline">Co-Marketing Studio</h1>
              <p className="text-muted-foreground">Use generative AI to create hyper-local content, social posts, and video scripts.</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Info Banner */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-600/5">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold font-headline mb-2">AI-Powered Content Generation</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Generate professional marketing content in seconds. Select a content type below and fill in the details to get started.
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-success" />
                  <span>AI-Powered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-success" />
                  <span>Multi-Platform Ready</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-success" />
                  <span>Save & Organize</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Type Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="content-type" className="text-sm font-medium whitespace-nowrap">
              Content Type:
            </Label>
            <Select value={activeTab || 'market-update'} onValueChange={setActiveTab}>
              <SelectTrigger id="content-type" className="w-full max-w-md">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{type.title}</span>
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
      <Tabs value={activeTab || 'market-update'} onValueChange={setActiveTab} className="w-full">
        <div className="hidden">
          <TabsList>
            <TabsTrigger value="market-update">Market Updates</TabsTrigger>
            <TabsTrigger value="future-cast">FutureCast</TabsTrigger>
            <TabsTrigger value="blog-post">Blog Posts</TabsTrigger>
            <TabsTrigger value="video-script">Video Scripts</TabsTrigger>
            <TabsTrigger value="guide">Neighborhood Guides</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="listing">Listing Optimizer</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="future-cast" className="mt-6">
          <div className="grid gap-8 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="font-headline">
                  FutureCast Generator
                </CardTitle>
                <CardDescription>
                  Generate predictive market forecasts for any location.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={futureCastAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fc-location">Location</Label>
                    <Input
                      id="fc-location"
                      name="location"
                      placeholder="e.g. Austin, TX 78704"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fc-timePeriod">Time Period</Label>
                    <Select name="timePeriod" defaultValue="next 6 months">
                      <SelectTrigger id="fc-timePeriod">
                        <SelectValue placeholder="Select time period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="next 3 months">Next 3 Months</SelectItem>
                        <SelectItem value="next 6 months">Next 6 Months</SelectItem>
                        <SelectItem value="next 12 months">Next 12 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fc-propertyType">Property Type</Label>
                    <Select name="propertyType" defaultValue="Single Family">
                      <SelectTrigger id="fc-propertyType">
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single Family">Single Family</SelectItem>
                        <SelectItem value="Condo">Condo</SelectItem>
                        <SelectItem value="Townhouse">Townhouse</SelectItem>
                        <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <GenerateButton>Generate Forecast</GenerateButton>
                </form>
                <ErrorDisplay message={futureCastState.message} />
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              {isFutureCastPending ? (
                <Card className="h-full min-h-[400px]">
                  <CardContent className="h-full p-0">
                    <GeneratingContentPlaceholder />
                  </CardContent>
                </Card>
              ) : futureCastData ? (
                <div className="space-y-6 fade-in">
                  <FutureCastChart data={futureCastData} />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => openSaveDialog(JSON.stringify(futureCastData), 'future-cast')}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Forecast
                    </Button>
                  </div>
                </div>
              ) : (
                <Card className="h-full min-h-[400px] flex items-center justify-center text-center p-8 border-dashed">
                  <div className="max-w-sm space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                      <TrendingUp className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Ready to Forecast</h3>
                      <p className="text-muted-foreground mt-2">
                        Enter a location to generate a predictive market forecast with actionable insights.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="market-update" className="mt-6">
          <div className="grid gap-8 lg:grid-cols-3">
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
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="e.g., Seattle, WA"
                    />
                    {(marketUpdateState.errors as any)?.location && (
                      <p className="text-sm text-destructive">
                        {(marketUpdateState.errors as any).location[0]}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timePeriod">Date</Label>
                    <Input
                      id="timePeriod"
                      name="timePeriod"
                      type="date"
                    />
                    {(marketUpdateState.errors as any)?.timePeriod && (
                      <p className="text-sm text-destructive">
                        {(marketUpdateState.errors as any).timePeriod[0]}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audience">Target Audience</Label>
                    <Input
                      id="audience"
                      name="audience"
                      placeholder="e.g., First-time buyers"
                    />
                    {(marketUpdateState.errors as any)?.audience && (
                      <p className="text-sm text-destructive">
                        {(marketUpdateState.errors as any).audience[0]}
                      </p>
                    )}
                  </div>
                  <GenerateButton>Generate Update</GenerateButton>
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
                      variant={copiedStates['market-update'] ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => copyToClipboard(marketUpdateContent, 'market-update')}
                    >
                      {copiedStates['market-update'] ? (
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
                    <Button variant="outline" size="sm" onClick={() => openSaveDialog(marketUpdateContent, 'Market Update')}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isMarketUpdatePending ? (
                  <GeneratingContentPlaceholder />
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
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <TrendingUp className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground text-lg">
                      Your generated market update will appear here.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Fill in the form and click Generate to create content.
                    </p>
                  </div>
                )}
                <ErrorDisplay message={marketUpdateState.message !== 'success' ? marketUpdateState.message : null} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="blog-post" className="mt-6">
          <div className="grid gap-8 lg:grid-cols-3">
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
                  <div className="space-y-2">
                    <Label htmlFor="blogTopic">Blog Topic</Label>
                    <Textarea
                      id="blogTopic"
                      name="topic"
                      placeholder="e.g., The top 5 neighborhoods in Seattle for young professionals"
                      rows={5}
                      value={blogTopic}
                      onChange={e => setBlogTopic(e.target.value)}
                    />
                    {blogPostState.errors?.topic && (
                      <p className="text-sm text-destructive">
                        {blogPostState.errors.topic[0]}
                      </p>
                    )}
                  </div>
                  <GenerateButton>Generate Blog Post</GenerateButton>
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
                {(() => {
                  console.log('Rendering blog post card:', {
                    isBlogPostPending,
                    hasBlogPostContent: !!blogPostContent,
                    blogPostContentLength: blogPostContent?.length,
                    blogPostContentPreview: blogPostContent?.substring(0, 100)
                  });
                  return null;
                })()}
                {isBlogPostPending ? (
                  <GeneratingContentPlaceholder />
                ) : blogPostContent ? (
                  <div className="space-y-4">
                    {!headerImage && blogTopic && (
                      <div className="mb-6">
                        <form action={blogImageAction}>
                          <input type="hidden" name="topic" value={blogTopic} />
                          <Button
                            type="submit"
                            variant="outline"
                            className="w-full"
                            disabled={isBlogImagePending}
                          >
                            {isBlogImagePending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Image...
                              </>
                            ) : (
                              <>
                                <ImagePlus className="mr-2 h-4 w-4" />
                                Generate Header Image
                              </>
                            )}
                          </Button>
                        </form>
                      </div>
                    )}
                    {headerImage && (
                      <div className="relative aspect-video mb-6 overflow-hidden rounded-lg group shadow-lg">
                        <Image
                          src={headerImage}
                          alt={blogTopic || 'Blog post header'}
                          fill
                          objectFit="cover"
                        />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <form action={blogImageAction}>
                            <input
                              type="hidden"
                              name="topic"
                              value={blogTopic}
                            />
                            <Button type="submit" variant="secondary" disabled={isBlogImagePending}>
                              {isBlogImagePending ? 'Regenerating...' : 'Regenerate Image'}
                            </Button>
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
                      Your generated blog post and header image will appear here.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Enter a topic and click Generate to create your blog post.
                    </p>
                  </div>
                )}
                <ErrorDisplay message={blogPostState.message !== 'success' ? blogPostState.message : null} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="video-script" className="mt-6">
          <div className="grid gap-8 lg:grid-cols-3">
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
                  <div className="space-y-2">
                    <Label htmlFor="videoTopic">Topic</Label>
                    <Textarea
                      id="videoTopic"
                      name="topic"
                      placeholder="e.g., What is an assumable mortgage?"
                      rows={3}
                    />
                    {videoScriptState.errors?.topic && (
                      <p className="text-sm text-destructive">
                        {videoScriptState.errors.topic[0]}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="videoTone">Tone of Voice</Label>
                    <Select name="tone" defaultValue="Engaging">
                      <SelectTrigger id="videoTone">
                        <SelectValue placeholder="Select a tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Engaging">Engaging</SelectItem>
                        <SelectItem value="Professional">
                          Professional
                        </SelectItem>
                        <SelectItem value="Humorous">Humorous</SelectItem>
                        <SelectItem value="Inspirational">
                          Inspirational
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {videoScriptState.errors?.tone && (
                      <p className="text-sm text-destructive">
                        {videoScriptState.errors.tone[0]}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="videoAudience">Target Audience</Label>
                    <Input
                      id="videoAudience"
                      name="audience"
                      placeholder="e.g., First-time buyers"
                    />
                    {videoScriptState.errors?.audience && (
                      <p className="text-sm text-destructive">
                        {videoScriptState.errors.audience[0]}
                      </p>
                    )}
                  </div>
                  <GenerateButton>Generate Script</GenerateButton>
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
                  <GeneratingContentPlaceholder />
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
                      Your generated video script will appear here.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Configure your script settings and click Generate.
                    </p>
                  </div>
                )}
                <ErrorDisplay message={videoScriptState.message !== 'success' ? videoScriptState.message : null} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="guide" className="mt-6">
          <div className="grid gap-8 lg:grid-cols-3">
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
                  <div className="space-y-2">
                    <Label htmlFor="targetMarket">Target Market</Label>
                    <Input
                      id="targetMarket"
                      name="targetMarket"
                      placeholder="e.g., 'Seattle, WA'"
                      defaultValue="Seattle, WA"
                    />
                    {guideState.errors?.targetMarket && (
                      <p className="text-sm text-destructive">
                        {guideState.errors.targetMarket[0]}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pillarTopic">Pillar Topic</Label>
                    <Input
                      id="pillarTopic"
                      name="pillarTopic"
                      placeholder="e.g., 'The Ultimate Guide to Living in Seattle'"
                      defaultValue="The Ultimate Guide to Living in the Capitol Hill Neighborhood"
                    />
                    {guideState.errors?.pillarTopic && (
                      <p className="text-sm text-destructive">
                        {guideState.errors.pillarTopic[0]}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idxFeedUrl">IDX Feed URL (Optional)</Label>
                    <Input
                      id="idxFeedUrl"
                      name="idxFeedUrl"
                      placeholder="e.g., 'https://my-idx-provider.com/seattle-capitol-hill'"
                    />
                  </div>
                  <GenerateButton>Generate Guide</GenerateButton>
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
                  <GeneratingContentPlaceholder />
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
                      Your generated guide will appear here.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add your personal, on-the-ground insights to provide unique value.
                    </p>
                  </div>
                )}
                <ErrorDisplay message={guideState.message !== 'success' ? guideState.message : null} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="social" className="mt-6">
          <div className="grid gap-8 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="font-headline">Post Generator</CardTitle>
                <CardDescription>
                  Define your topic and tone to generate social posts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={socialFormAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Textarea
                      id="topic"
                      name="topic"
                      placeholder="e.g., 'The benefits of using a real estate agent for first-time homebuyers'"
                      rows={5}
                      value={socialPostContent?.topic || ''}
                      onChange={e => setSocialPostContent((prev: any) => ({ ...prev, topic: e.target.value } as SocialPostContentWithTopic))}
                    />
                    {socialState.errors?.topic && (
                      <p className="text-sm text-destructive">
                        {socialState.errors.topic[0]}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tone">Tone of Voice</Label>
                    <Select name="tone" defaultValue="Professional">
                      <SelectTrigger id="tone">
                        <SelectValue placeholder="Select a tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Professional">
                          Professional
                        </SelectItem>
                        <SelectItem value="Casual">Casual</SelectItem>
                        <SelectItem value="Enthusiastic">
                          Enthusiastic
                        </SelectItem>
                        <SelectItem value="Humorous">Humorous</SelectItem>
                      </SelectContent>
                    </Select>
                    {socialState.errors?.tone && (
                      <p className="text-sm text-destructive">
                        {socialState.errors.tone[0]}
                      </p>
                    )}
                  </div>
                  <GenerateButton>Generate Posts</GenerateButton>
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
                    <GeneratingContentPlaceholder />
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
                            onChange={(e) => setSocialPostContent((prev: any) => ({ ...prev!, linkedin: e.target.value }))}
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
                            onChange={(e) => setSocialPostContent((prev: any) => ({ ...prev!, facebook: e.target.value }))}
                            rows={6}
                            className="w-full h-full font-mono text-sm resize-none"
                          />
                        </CardContent>
                      </Card>
                      <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-sky-500/30">
                        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-sky-500/5 to-transparent">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-sky-500 flex items-center justify-center">
                              <Twitter className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-headline font-bold text-lg">X (Twitter)</h3>
                          </div>
                          <div className="flex items-center gap-2">
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
                        Posts will be optimized for LinkedIn, Facebook, and X (Twitter).
                      </p>
                    </div>
                  )}
                  <ErrorDisplay message={socialState.message !== 'success' ? socialState.message : null} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="listing" className="mt-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">
                    Listing Optimizer
                  </CardTitle>
                  <CardDescription>
                    Rewrite a listing description for a specific buyer persona.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={listingFormAction}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Original Description</Label>
                        <Textarea
                          id="propertyDescription"
                          name="propertyDescription"
                          rows={8}
                          defaultValue={
                            'Charming 3-bedroom, 2-bathroom single-family home in a quiet, tree-lined neighborhood. Features a recently updated kitchen with granite countertops, stainless steel appliances, and a large island. The open-concept living area has hardwood floors and a wood-burning fireplace. A spacious, fenced-in backyard with a deck is perfect for entertaining. The master suite includes a walk-in closet and an en-suite bathroom with a double vanity. Located in a top-rated school district, close to parks and shopping centers.'
                          }
                        />
                        {listingState.errors?.propertyDescription && (
                          <p className="text-sm text-destructive">
                            {listingState.errors.propertyDescription[0]}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="buyerPersona">
                          Target Buyer Persona
                        </Label>
                        <Select
                          name="buyerPersona"
                          defaultValue="First-Time Homebuyer"
                        >
                          <SelectTrigger id="buyerPersona" className="w-full">
                            <SelectValue placeholder="Select a persona" />
                          </SelectTrigger>
                          <SelectContent>
                            {buyerPersonas.map(persona => (
                              <SelectItem
                                key={persona.value}
                                value={persona.value}
                              >
                                {persona.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {listingState.errors?.buyerPersona && (
                          <p className="text-sm text-destructive">
                            {listingState.errors.buyerPersona[0]}
                          </p>
                        )}
                      </div>
                      <OptimizerButton />
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-8">
              <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="font-headline">
                      Rewritten Description
                    </CardTitle>
                    <CardDescription>
                      The description rewritten for your target persona.
                    </CardDescription>
                  </div>
                  {rewrittenDescription && (
                    <div className="flex gap-2">
                      <Button
                        variant={copiedStates['listing-description'] ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => copyToClipboard(rewrittenDescription, 'listing-description')}
                      >
                        {copiedStates['listing-description'] ? (
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
                      <Button variant="outline" size="sm" onClick={() => openSaveDialog(rewrittenDescription, 'Listing Description')}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {isListingOptimizing ? (
                    <GeneratingContentPlaceholder />
                  ) : rewrittenDescription ? (
                    <Textarea
                      rows={8}
                      readOnly
                      className="bg-secondary/50 resize-none"
                      value={rewrittenDescription}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <Home className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Your AI-generated description will appear here.
                      </p>
                    </div>
                  )}
                  <ErrorDisplay message={listingState.message !== 'success' ? listingState.message : null} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle className="font-headline">
                      Generated FAQ
                    </CardTitle>
                    <CardDescription>
                      Common questions based on the description.
                    </CardDescription>
                  </div>
                  {listingFaqs.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant={copiedStates['listing-faq'] ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => copyToClipboard(listingFaqs.map(faq => `Q: ${faq.q}\nA: ${faq.a}`).join('\n\n'), 'listing-faq')}
                      >
                        {copiedStates['listing-faq'] ? (
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
                      <Button variant="outline" size="sm" onClick={() => openSaveDialog(listingFaqs.map(faq => `Q: ${faq.q}\nA: ${faq.a}`).join('\n\n'), 'Listing FAQ')}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {isListingPending ? (
                    <GeneratingContentPlaceholder />
                  ) : listingFaqs.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {listingFaqs.map((faq, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                          <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <MessageSquare className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        The generated FAQ will appear here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <SaveDialog dialogInfo={saveDialogInfo} setDialogInfo={setSaveDialogInfo} />
    </div>
  );
}
