'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Award,
    Trophy,
    Star,
    Download,
    Share2,
    ExternalLink,
    CheckCircle,
    Clock,
    Target,
    Zap,
    Brain,
    TrendingUp,
    Users,
    Sparkles,
    Calendar,
    BookOpen,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth/use-user';
import { cn } from '@/lib/utils';

type Certificate = {
    id: string;
    title: string;
    description: string;
    category: 'course' | 'skill' | 'achievement';
    issuedAt: string;
    expiresAt?: string;
    credentialUrl: string;
    badgeUrl: string;
    issuer: string;
    skills: string[];
    verificationCode: string;
};

type CertificationPath = {
    id: string;
    title: string;
    description: string;
    category: 'beginner' | 'intermediate' | 'advanced' | 'specialist';
    totalCourses: number;
    completedCourses: number;
    estimatedTime: number; // in hours
    prerequisites: string[];
    skills: string[];
    badge: string;
    isActive: boolean;
    nextCourse?: string;
};

const mockCertificates: Certificate[] = [
    {
        id: 'cert-ai-content-mastery',
        title: 'AI Content Creation Mastery',
        description: 'Certified in advanced AI-powered content creation techniques for real estate marketing',
        category: 'course',
        issuedAt: '2024-01-15',
        credentialUrl: 'https://certificates.bayon.ai/cert-ai-content-mastery',
        badgeUrl: '/api/placeholder/200/200',
        issuer: 'Bayon Coagent Academy',
        skills: ['AI Prompting', 'Content Strategy', 'Brand Voice Development'],
        verificationCode: 'BC-ACM-2024-001',
    },
    {
        id: 'cert-client-communication',
        title: 'Client Communication Excellence',
        description: 'Demonstrated expertise in professional client communication and relationship management',
        category: 'skill',
        issuedAt: '2024-01-10',
        credentialUrl: 'https://certificates.bayon.ai/cert-client-communication',
        badgeUrl: '/api/placeholder/200/200',
        issuer: 'Bayon Coagent Academy',
        skills: ['Active Listening', 'Negotiation', 'Relationship Building'],
        verificationCode: 'BC-CCE-2024-002',
    },
    {
        id: 'cert-early-adopter',
        title: 'Early Adopter Achievement',
        description: 'Recognized as an early adopter of AI-powered real estate marketing tools',
        category: 'achievement',
        issuedAt: '2024-01-05',
        credentialUrl: 'https://certificates.bayon.ai/cert-early-adopter',
        badgeUrl: '/api/placeholder/200/200',
        issuer: 'Bayon Coagent Academy',
        skills: ['Innovation', 'Technology Adoption', 'Leadership'],
        verificationCode: 'BC-EA-2024-003',
    },
];

const mockCertificationPaths: CertificationPath[] = [
    {
        id: 'ai-marketing-specialist',
        title: 'AI Marketing Specialist',
        description: 'Master AI-powered marketing tools and strategies to become a certified AI Marketing Specialist in real estate.',
        category: 'specialist',
        totalCourses: 5,
        completedCourses: 2,
        estimatedTime: 25,
        prerequisites: ['Basic computer skills', 'Real estate license'],
        skills: ['AI Tools Mastery', 'Content Creation', 'Marketing Automation', 'Data Analysis'],
        badge: '/api/placeholder/100/100',
        isActive: true,
        nextCourse: 'Advanced AI Prompting Techniques',
    },
    {
        id: 'brand-authority-expert',
        title: 'Brand Authority Expert',
        description: 'Build and maintain a powerful personal brand that establishes you as the go-to expert in your market.',
        category: 'advanced',
        totalCourses: 4,
        completedCourses: 1,
        estimatedTime: 20,
        prerequisites: ['Completed beginner courses', '6 months experience'],
        skills: ['Brand Strategy', 'Online Reputation', 'Competitive Analysis', 'Market Positioning'],
        badge: '/api/placeholder/100/100',
        isActive: true,
        nextCourse: 'Advanced Brand Audit Techniques',
    },
    {
        id: 'digital-marketing-pro',
        title: 'Digital Marketing Professional',
        description: 'Comprehensive digital marketing certification covering all aspects of online real estate marketing.',
        category: 'intermediate',
        totalCourses: 6,
        completedCourses: 0,
        estimatedTime: 30,
        prerequisites: ['Basic marketing knowledge'],
        skills: ['Social Media Marketing', 'SEO', 'Content Marketing', 'Lead Generation'],
        badge: '/api/placeholder/100/100',
        isActive: false,
        nextCourse: 'Social Media Marketing Fundamentals',
    },
    {
        id: 'client-relations-master',
        title: 'Client Relations Master',
        description: 'Advanced certification in client communication, relationship building, and customer service excellence.',
        category: 'advanced',
        totalCourses: 4,
        completedCourses: 3,
        estimatedTime: 18,
        prerequisites: ['Client Communication Excellence course'],
        skills: ['Advanced Communication', 'Conflict Resolution', 'Customer Psychology', 'Service Excellence'],
        badge: '/api/placeholder/100/100',
        isActive: true,
        nextCourse: 'Advanced Negotiation Strategies',
    },
];

export default function LearningCertificationPage() {
    const { user } = useUser();
    const [certificates] = useState<Certificate[]>(mockCertificates);
    const [certificationPaths] = useState<CertificationPath[]>(mockCertificationPaths);
    const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
    const [showCertificateDetail, setShowCertificateDetail] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadCertificate = async (certificate: Certificate) => {
        setIsDownloading(true);
        try {
            // Simulate download process
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast({
                title: 'Certificate Downloaded',
                description: 'Your certificate has been saved to your downloads folder.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Download Failed',
                description: 'Failed to download certificate. Please try again.',
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleShareCertificate = async (certificate: Certificate) => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: certificate.title,
                    text: `I just earned my ${certificate.title} certification!`,
                    url: certificate.credentialUrl,
                });
            } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText(certificate.credentialUrl);
                toast({
                    title: 'Link Copied',
                    description: 'Certificate link copied to clipboard.',
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Share Failed',
                description: 'Failed to share certificate.',
            });
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'course': return <BookOpen className="h-4 w-4" />;
            case 'skill': return <Target className="h-4 w-4" />;
            case 'achievement': return <Trophy className="h-4 w-4" />;
            default: return <Award className="h-4 w-4" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'course': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'skill': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'achievement': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
        }
    };

    const getPathCategoryIcon = (category: string) => {
        switch (category) {
            case 'beginner': return <Target className="h-5 w-5" />;
            case 'intermediate': return <Zap className="h-5 w-5" />;
            case 'advanced': return <Brain className="h-5 w-5" />;
            case 'specialist': return <Star className="h-5 w-5" />;
            default: return <Award className="h-5 w-5" />;
        }
    };

    const getPathCategoryColor = (category: string) => {
        switch (category) {
            case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            case 'specialist': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">Certification & Achievements</CardTitle>
                    <CardDescription>
                        Track your learning progress and showcase your professional certifications
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Earned Certificates */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Your Certificates ({certificates.length})</h2>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download All
                    </Button>
                </div>

                {certificates.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {certificates.map((certificate) => (
                            <Card
                                key={certificate.id}
                                className="cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-primary/20"
                                onClick={() => {
                                    setSelectedCertificate(certificate);
                                    setShowCertificateDetail(true);
                                }}
                            >
                                <div className="aspect-square bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20" />
                                    <div className="relative z-10 text-center">
                                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Award className="h-10 w-10 text-white" />
                                        </div>
                                        <Badge className={getCategoryColor(certificate.category)}>
                                            {getCategoryIcon(certificate.category)}
                                            <span className="ml-1 capitalize">{certificate.category}</span>
                                        </Badge>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <Badge variant="secondary" className="bg-white/20 text-white">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Verified
                                        </Badge>
                                    </div>
                                </div>

                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-semibold text-lg mb-2 line-clamp-2">{certificate.title}</h3>
                                            <p className="text-sm text-muted-foreground line-clamp-3">{certificate.description}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Issued by</span>
                                                <span className="font-medium">{certificate.issuer}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Date</span>
                                                <span>{formatDate(certificate.issuedAt)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">ID</span>
                                                <span className="font-mono text-xs">{certificate.verificationCode}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1">
                                            {certificate.skills.slice(0, 2).map((skill) => (
                                                <Badge key={skill} variant="outline" className="text-xs">
                                                    {skill}
                                                </Badge>
                                            ))}
                                            {certificate.skills.length > 2 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{certificate.skills.length - 2}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                                    <Award className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold">No Certificates Yet</h3>
                                    <p className="text-muted-foreground">
                                        Complete courses and learning paths to earn your first certificate.
                                    </p>
                                </div>
                                <Button>
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Browse Courses
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Certification Paths */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Certification Paths</h2>
                    <Badge variant="outline">
                        {certificationPaths.filter(p => p.isActive).length} Active
                    </Badge>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {certificationPaths.map((path) => (
                        <Card
                            key={path.id}
                            className={cn(
                                "transition-all duration-200 hover:shadow-lg",
                                path.isActive && "ring-2 ring-primary/20"
                            )}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-lg flex items-center justify-center">
                                                {getPathCategoryIcon(path.category)}
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{path.title}</CardTitle>
                                                <Badge className={getPathCategoryColor(path.category)}>
                                                    {path.category}
                                                </Badge>
                                            </div>
                                        </div>
                                        <CardDescription className="text-sm">
                                            {path.description}
                                        </CardDescription>
                                    </div>
                                    {path.isActive && (
                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Active
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                {/* Progress */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Progress</span>
                                        <span>{path.completedCourses}/{path.totalCourses} courses</span>
                                    </div>
                                    <Progress
                                        value={(path.completedCourses / path.totalCourses) * 100}
                                        className="h-2"
                                    />
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span>{path.estimatedTime}h total</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                                        <span>{path.totalCourses} courses</span>
                                    </div>
                                </div>

                                {/* Skills */}
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Skills You'll Master</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {path.skills.map((skill) => (
                                            <Badge key={skill} variant="outline" className="text-xs">
                                                <Sparkles className="h-3 w-3 mr-1" />
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Next Course */}
                                {path.nextCourse && (
                                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">Next Course</p>
                                                <p className="text-xs text-muted-foreground">{path.nextCourse}</p>
                                            </div>
                                            <Button size="sm">
                                                Start
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Prerequisites */}
                                {path.prerequisites.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">Prerequisites</h4>
                                        <ul className="text-xs text-muted-foreground space-y-1">
                                            {path.prerequisites.map((prereq, index) => (
                                                <li key={index} className="flex items-center gap-2">
                                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                                    {prereq}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 pt-2 border-t">
                                    {path.isActive ? (
                                        <Button className="flex-1">
                                            <TrendingUp className="h-4 w-4 mr-2" />
                                            Continue Path
                                        </Button>
                                    ) : (
                                        <Button variant="outline" className="flex-1">
                                            <Target className="h-4 w-4 mr-2" />
                                            Start Path
                                        </Button>
                                    )}
                                    <Button variant="outline" size="sm">
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Certificate Detail Dialog */}
            <Dialog open={showCertificateDetail} onOpenChange={setShowCertificateDetail}>
                <DialogContent className="max-w-2xl">
                    {selectedCertificate && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl">{selectedCertificate.title}</DialogTitle>
                                <DialogDescription className="text-base">
                                    {selectedCertificate.description}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6">
                                {/* Certificate Preview */}
                                <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-lg flex items-center justify-center relative overflow-hidden border-2 border-primary/20">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20" />
                                    <div className="relative z-10 text-center">
                                        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Award className="h-12 w-12 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">{selectedCertificate.title}</h3>
                                        <p className="text-white/80 mb-4">Awarded to {user?.name || 'Professional'}</p>
                                        <Badge className="bg-white/20 text-white">
                                            {selectedCertificate.verificationCode}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Certificate Details */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-3">
                                        <div>
                                            <h4 className="font-semibold mb-1">Issued By</h4>
                                            <p className="text-sm text-muted-foreground">{selectedCertificate.issuer}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-1">Issue Date</h4>
                                            <p className="text-sm text-muted-foreground">{formatDate(selectedCertificate.issuedAt)}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-1">Verification Code</h4>
                                            <p className="text-sm font-mono text-muted-foreground">{selectedCertificate.verificationCode}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <h4 className="font-semibold mb-1">Category</h4>
                                            <Badge className={getCategoryColor(selectedCertificate.category)}>
                                                {getCategoryIcon(selectedCertificate.category)}
                                                <span className="ml-1 capitalize">{selectedCertificate.category}</span>
                                            </Badge>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-1">Skills Validated</h4>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedCertificate.skills.map((skill) => (
                                                    <Badge key={skill} variant="outline" className="text-xs">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowCertificateDetail(false)}>
                                    Close
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleShareCertificate(selectedCertificate)}
                                >
                                    <Share2 className="h-4 w-4 mr-2" />
                                    Share
                                </Button>
                                <Button
                                    onClick={() => handleDownloadCertificate(selectedCertificate)}
                                    disabled={isDownloading}
                                >
                                    {isDownloading ? (
                                        <>
                                            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}