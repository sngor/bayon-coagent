
'use client';

import { useActionState, useState, useTransition, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { PageHeader } from '@/components/page-header';
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
} from '@/app/actions';
import { buyerPersonas } from '@/lib/data';
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
import { type GenerateSocialMediaPostOutput } from '@/ai/flows/generate-social-media-post';
import { useWebAI } from '@/hooks/useWebAI';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useUser } from '@/aws/auth';
import { useQuery } from '@/aws/dynamodb/hooks';
import { getRepository } from '@/aws/dynamodb';
import { getSavedContentKeys } from '@/aws/dynamodb/keys';
import type { Project } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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


function SaveDialog({ dialogInfo, setDialogInfo, projects }: { dialogInfo: SaveDialogInfo, setDialogInfo: (info: SaveDialogInfo) => void, projects: Project[] | null }) {
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
        const repository = getRepository();
        const contentId = Date.now().toString();
        const keys = getSavedContentKeys(user.id, contentId);
        await repository.put({
          ...keys,
          EntityType: 'SavedContent',
          Data: {
            name: name || dialogInfo.type,
            content: dialogInfo.content,
            type: dialogInfo.type,
            projectId: projectId || null,
            createdAt: new Date().toISOString(),
          },
          CreatedAt: Date.now(),
          UpdatedAt: Date.now()
        });
        toast({
          title: 'Content Saved!',
          description: `Your content has been saved to your Projects.`,
        });
        setDialogInfo({ isOpen: false, content: '', type: '' });
        setName('');
        setProjectId(null);
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
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select onValueChange={(value) => setProjectId(value === 'uncategorized' ? null : value)}>
              <SelectTrigger id="project">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                {projects?.map(project => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
    <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full p-8 transition-all duration-300">
      <div className="relative mb-6">
        <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary animate-pulse" />
      </div>
      <p className="font-semibold text-lg animate-pulse">{currentMessage}</p>
      <p className="text-sm mt-1">This may take a few moments.</p>
    </div>
  );
}

function ErrorDisplay({ message }: { message: string | null }) {
  if (!message) return null;

  const isTopicalError = message.toLowerCase().includes('real estate');

  return (
    <Alert variant="destructive" className="mt-4">
      {isTopicalError ? <ShieldAlert className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
      <AlertTitle>{isTopicalError ? 'Topic Guardrail Activated' : 'Generation Failed'}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
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

  const [headerImage, setHeaderImage] = useState<string | null>(null);

  const [marketUpdateContent, setMarketUpdateContent] = useState('');
  const [blogPostContent, setBlogPostContent] = useState('');
  const [videoScriptContent, setVideoScriptContent] = useState('');
  const [guideContent, setGuideContent] = useState('');
  const [socialPostContent, setSocialPostContent] = useState<GenerateSocialMediaPostOutput | null>(null);

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
    <div className="space-y-8 fade-in">
      <PageHeader
        title="Co-Marketing Studio"
        description="Use generative AI to create hyper-local content, social posts, and video scripts."
      />

      {!activeTab && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {contentTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.id}
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-primary/50"
                onClick={() => setActiveTab(type.id)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${type.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="font-headline text-xl">{type.title}</CardTitle>
                  <CardDescription className="text-base">{type.description}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="ghost" className="w-full group-hover:bg-primary/10">
                    Get Started
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab && (
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => setActiveTab('')}
            className="mb-4"
          >
            ← Back to Content Types
          </Button>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="grid w-full grid-cols-[repeat(6,minmax(max-content,1fr))] h-auto md:grid-cols-6">
                <TabsTrigger value="market-update">Market Updates</TabsTrigger>
                <TabsTrigger value="blog-post">Blog Posts</TabsTrigger>
                <TabsTrigger value="video-script">Video Scripts</TabsTrigger>
                <TabsTrigger value="guide">Neighborhood Guides</TabsTrigger>
                <TabsTrigger value="social">Social Media</TabsTrigger>
                <TabsTrigger value="listing">Listing Optimizer</TabsTrigger>
              </TabsList>
            </div>
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
                        {marketUpdateState.errors?.location && (
                          <p className="text-sm text-destructive">
                            {marketUpdateState.errors.location[0]}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timePeriod">Time Period</Label>
                        <Input
                          id="timePeriod"
                          name="timePeriod"
                          placeholder="e.g., October 2025"
                        />
                        {marketUpdateState.errors?.timePeriod && (
                          <p className="text-sm text-destructive">
                            {marketUpdateState.errors.timePeriod[0]}
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
                        {marketUpdateState.errors?.audience && (
                          <p className="text-sm text-destructive">
                            {marketUpdateState.errors.audience[0]}
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
                    <Button variant="outline" size="sm" onClick={() => openSaveDialog(marketUpdateContent, 'Market Update')}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isMarketUpdatePending ? (
                      <GeneratingContentPlaceholder />
                    ) : marketUpdateContent ? (
                      <Textarea
                        value={marketUpdateContent}
                        onChange={(e) => setMarketUpdateContent(e.target.value)}
                        rows={15}
                        className="w-full h-full font-mono text-sm"
                      />
                    ) : (
                      <p className="text-muted-foreground">
                        Your generated market update will appear here.
                      </p>
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
                    <Button variant="outline" size="sm" onClick={() => openSaveDialog(blogPostContent, 'Blog Post')}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isBlogPostPending ? (
                      <GeneratingContentPlaceholder />
                    ) : blogPostContent ? (
                      <div>
                        {headerImage && (
                          <div className="relative aspect-video mb-6 overflow-hidden rounded-lg group">
                            <Image
                              src={headerImage}
                              alt={blogTopic || 'Blog post header'}
                              fill
                              objectFit="cover"
                            />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <form action={imageAction}>
                                <input
                                  type="hidden"
                                  name="topic"
                                  value={blogTopic}
                                />
                                <RegenerateImageButton>
                                  Regenerate
                                </RegenerateImageButton>
                              </form>
                            </div>
                          </div>
                        )}
                        <Textarea
                          value={blogPostContent}
                          onChange={(e) => setBlogPostContent(e.target.value)}
                          rows={20}
                          className="w-full h-full font-mono text-sm"
                        />
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Your generated blog post and header image will appear here.
                      </p>
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
                    <Button variant="outline" size="sm" onClick={() => openSaveDialog(videoScriptContent, 'Video Script')}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isVideoScriptPending ? (
                      <GeneratingContentPlaceholder />
                    ) : videoScriptContent ? (
                      <Textarea
                        value={videoScriptContent}
                        onChange={(e) => setVideoScriptContent(e.target.value)}
                        rows={15}
                        className="w-full h-full font-mono text-sm"
                      />
                    ) : (
                      <p className="text-muted-foreground">
                        Your generated video script will appear here.
                      </p>
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
                    <Button variant="outline" size="sm" onClick={() => openSaveDialog(guideContent, 'Neighborhood Guide')}>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isGuidePending ? (
                      <GeneratingContentPlaceholder />
                    ) : guideContent ? (
                      <div>
                        <Textarea
                          value={guideContent}
                          onChange={(e) => setGuideContent(e.target.value)}
                          rows={20}
                          className="w-full h-full font-mono text-sm"
                        />
                        <IdxFeedPlaceholder url={guideState.data.idxFeedUrl} />
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Your generated guide will appear here. Add your personal,
                        on-the-ground insights to provide unique value.
                      </p>
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
                          onChange={e => setSocialPostContent(prev => ({ ...prev, topic: e.target.value } as GenerateSocialMediaPostOutput))}
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
                          <Card className="hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="flex flex-row items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Linkedin className="w-5 h-5 text-blue-700" />
                                <h3 className="font-bold">LinkedIn</h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => openSaveDialog(socialPostContent.linkedin || '', 'Social Post (LinkedIn)')}>
                                  <Save className="mr-2 h-4 w-4" />
                                  Save
                                </Button>
                                <Button
                                  variant={copiedStates['linkedin'] ? 'default' : 'ghost'}
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
                            <CardContent>
                              <Textarea
                                value={socialPostContent.linkedin}
                                onChange={(e) => setSocialPostContent(prev => ({ ...prev!, linkedin: e.target.value }))}
                                rows={6}
                                className="w-full h-full font-mono text-sm"
                              />
                            </CardContent>
                          </Card>
                          <Card className="hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="flex flex-row items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Facebook className="w-5 h-5 text-blue-600" />
                                <h3 className="font-bold">Facebook</h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => openSaveDialog(socialPostContent.facebook || '', 'Social Post (Facebook)')}>
                                  <Save className="mr-2 h-4 w-4" />
                                  Save
                                </Button>
                                <Button
                                  variant={copiedStates['facebook'] ? 'default' : 'ghost'}
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
                            <CardContent>
                              <Textarea
                                value={socialPostContent.facebook}
                                onChange={(e) => setSocialPostContent(prev => ({ ...prev!, facebook: e.target.value }))}
                                rows={6}
                                className="w-full h-full font-mono text-sm"
                              />
                            </CardContent>
                          </Card>
                          <Card className="hover:shadow-lg transition-shadow duration-300">
                            <CardHeader className="flex flex-row items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Twitter className="w-5 h-5 text-sky-500" />
                                <h3 className="font-bold">X (Twitter)</h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => openSaveDialog(socialPostContent.twitter || '', 'Social Post (X/Twitter)')}>
                                  <Save className="mr-2 h-4 w-4" />
                                  Save
                                </Button>
                                <Button
                                  variant={copiedStates['twitter'] ? 'default' : 'ghost'}
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
                            <CardContent>
                              <Textarea
                                value={socialPostContent.twitter}
                                onChange={(e) => setSocialPostContent(prev => ({ ...prev!, twitter: e.target.value }))}
                                rows={4}
                                className="w-full h-full font-mono text-sm"
                              />
                            </CardContent>
                          </Card>
                        </>
                      ) : (
                        <p className="text-muted-foreground">
                          Your generated social media posts for different platforms
                          will appear here.
                        </p>
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
                      <Button variant="outline" size="sm" onClick={() => openSaveDialog(rewrittenDescription, 'Listing Description')}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {isListingOptimizing ? (
                        <GeneratingContentPlaceholder />
                      ) : (
                        <Textarea
                          rows={8}
                          readOnly
                          className="bg-secondary/50"
                          value={rewrittenDescription}
                          placeholder={
                            'Your AI-generated description will appear here.'
                          }
                        />
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
                      <Button variant="outline" size="sm" onClick={() => openSaveDialog(listingFaqs.map(faq => `Q: ${faq.q}\nA: ${faq.a}`).join('\n\n'), 'Listing FAQ')}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {isListingPending ? (
                        <GeneratingContentPlaceholder />
                      ) : listingFaqs.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                          {listingFaqs.map((faq, index) => (
                            <AccordionItem value={`item-${index}`} key={index}>
                              <AccordionTrigger>{faq.q}</AccordionTrigger>
                              <AccordionContent>{faq.a}</AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          The generated FAQ will appear here.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
      <SaveDialog dialogInfo={saveDialogInfo} setDialogInfo={setSaveDialogInfo} projects={projects} />
    </div>
  );
}
