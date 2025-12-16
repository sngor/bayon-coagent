'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Brain,
    Sparkles,
    Clock,
    Target,
    Users,
    BookOpen,
    CheckCircle,
    Star,
    Download,
    Save,
    Play,
    Lightbulb,
    TrendingUp,
    Award,
    Calendar,
    BarChart3,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth/use-user';
import { cn } from '@/lib/utils';

type LearningObjective = {
    id: string;
    description: string;
    category: 'knowledge' | 'skill' | 'behavior';
    priority: 'high' | 'medium' | 'low';
};

type LessonActivity = {
    id: string;
    type: 'reading' | 'video' | 'practice' | 'quiz' | 'discussion' | 'role-play';
    title: string;
    description: string;
    duration: number; // in minutes
    resources: string[];
    instructions: string;
};

type AssessmentCriteria = {
    id: string;
    criteria: string;
    weight: number; // percentage
    rubric: {
        excellent: string;
        good: string;
        needs_improvement: string;
    };
};

type AILessonPlan = {
    id: string;
    title: string;
    description: string;
    topic: string;
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
    duration: number; // total duration in minutes
    objectives: LearningObjective[];
    prerequisites: string[];
    activities: LessonActivity[];
    assessments: AssessmentCriteria[];
    resources: string[];
    adaptations: {
        visual: string[];
        auditory: string[];
        kinesthetic: string[];
    };
    followUp: string[];
    createdAt: string;
    generatedBy: 'ai' | 'user';
};

const skillLevels = [
    { value: 'beginner', label: 'Beginner', description: 'New to real estate or this topic' },
    { value: 'intermediate', label: 'Intermediate', description: 'Some experience, looking to improve' },
    { value: 'advanced', label: 'Advanced', description: 'Experienced, seeking mastery' },
];

const topicCategories = [
    'Lead Generation',
    'Client Communication',
    'Listing Presentations',
    'Negotiation Skills',
    'Market Analysis',
    'Digital Marketing',
    'Social Media Strategy',
    'Content Creation',
    'Brand Building',
    'Technology Tools',
    'Legal & Ethics',
    'Customer Service',
];

const mockLessonPlans: AILessonPlan[] = [
    {
        id: 'plan-1',
        title: 'Mastering First-Time Buyer Consultations',
        description: 'Learn to guide nervous first-time buyers through the home buying process with confidence and expertise.',
        topic: 'Client Communication',
        skillLevel: 'intermediate',
        duration: 90,
        objectives: [
            {
                id: 'obj-1',
                description: 'Identify and address common first-time buyer concerns',
                category: 'knowledge',
                priority: 'high'
            },
            {
                id: 'obj-2',
                description: 'Demonstrate effective consultation techniques',
                category: 'skill',
                priority: 'high'
            },
            {
                id: 'obj-3',
                description: 'Build trust and rapport with anxious clients',
                category: 'behavior',
                priority: 'medium'
            }
        ],
        prerequisites: [
            'Basic understanding of the home buying process',
            'Familiarity with mortgage pre-approval',
            'Knowledge of local market conditions'
        ],
        activities: [
            {
                id: 'act-1',
                type: 'reading',
                title: 'First-Time Buyer Psychology',
                description: 'Understanding the emotional journey of first-time homebuyers',
                duration: 15,
                resources: ['First-Time Buyer Guide', 'Psychology of Home Buying'],
                instructions: 'Read the materials and take notes on key emotional triggers'
            },
            {
                id: 'act-2',
                type: 'video',
                title: 'Consultation Best Practices',
                description: 'Watch expert consultations and identify key techniques',
                duration: 20,
                resources: ['Expert Consultation Videos', 'Technique Checklist'],
                instructions: 'Watch videos and complete the technique identification worksheet'
            },
            {
                id: 'act-3',
                type: 'role-play',
                title: 'Practice Consultation',
                description: 'Role-play a first-time buyer consultation scenario',
                duration: 30,
                resources: ['Scenario Scripts', 'Evaluation Rubric'],
                instructions: 'Practice with a partner or AI, focusing on building rapport and addressing concerns'
            }
        ],
        assessments: [
            {
                id: 'assess-1',
                criteria: 'Rapport Building',
                weight: 30,
                rubric: {
                    excellent: 'Establishes immediate connection, shows genuine empathy, creates comfortable environment',
                    good: 'Shows interest in client, demonstrates understanding, maintains professional warmth',
                    needs_improvement: 'Limited connection, focuses mainly on process rather than client needs'
                }
            },
            {
                id: 'assess-2',
                criteria: 'Information Gathering',
                weight: 40,
                rubric: {
                    excellent: 'Asks insightful questions, uncovers hidden concerns, thoroughly understands needs',
                    good: 'Covers essential topics, identifies main concerns, gathers necessary information',
                    needs_improvement: 'Basic questioning, misses important details, surface-level understanding'
                }
            }
        ],
        resources: [
            'First-Time Buyer Checklist',
            'Mortgage Calculator',
            'Local Market Reports',
            'Consultation Script Templates'
        ],
        adaptations: {
            visual: ['Infographics of the buying process', 'Visual timeline charts', 'Property comparison sheets'],
            auditory: ['Recorded client testimonials', 'Podcast episodes on buying tips', 'Audio guides'],
            kinesthetic: ['Interactive market tours', 'Hands-on document review', 'Physical property visits']
        },
        followUp: [
            'Schedule follow-up consultation practice',
            'Review client feedback forms',
            'Implement learned techniques with real clients',
            'Track consultation success rates'
        ],
        createdAt: '2024-12-15T10:00:00Z',
        generatedBy: 'ai'
    }
];

export default function AILessonPlanPage() {
    const { user } = useUser();
    const [lessonPlans, setLessonPlans] = useState<AILessonPlan[]>(mockLessonPlans);
    const [selectedPlan, setSelectedPlan] = useState<AILessonPlan | null>(null);
    const [showPlanDetail, setShowPlanDetail] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Form state for creating new lesson plans
    const [formData, setFormData] = useState({
        topic: '',
        skillLevel: 'intermediate' as const,
        duration: 60,
        specificGoals: '',
        learningStyle: 'mixed' as const,
        additionalRequirements: ''
    });

    const handleGeneratePlan = async () => {
        if (!formData.topic.trim()) {
            toast({
                title: 'Topic Required',
                description: 'Please enter a topic for your lesson plan.',
                variant: 'destructive',
            });
            return;
        }

        setIsGenerating(true);

        try {
            // Simulate AI generation (in real implementation, this would call an AI service)
            await new Promise(resolve => setTimeout(resolve, 3000));

            const newPlan: AILessonPlan = {
                id: `plan-${Date.now()}`,
                title: `${formData.topic} Mastery Plan`,
                description: `Comprehensive lesson plan for mastering ${formData.topic.toLowerCase()}`,
                topic: formData.topic,
                skillLevel: formData.skillLevel,
                duration: formData.duration,
                objectives: [
                    {
                        id: 'obj-new-1',
                        description: `Understand key concepts in ${formData.topic}`,
                        category: 'knowledge',
                        priority: 'high'
                    },
                    {
                        id: 'obj-new-2',
                        description: `Apply ${formData.topic} techniques effectively`,
                        category: 'skill',
                        priority: 'high'
                    }
                ],
                prerequisites: [`Basic understanding of real estate principles`],
                activities: [
                    {
                        id: 'act-new-1',
                        type: 'reading',
                        title: `${formData.topic} Fundamentals`,
                        description: `Core concepts and principles`,
                        duration: Math.round(formData.duration * 0.3),
                        resources: [`${formData.topic} Guide`],
                        instructions: 'Review materials and complete knowledge check'
                    },
                    {
                        id: 'act-new-2',
                        type: 'practice',
                        title: `${formData.topic} Practice`,
                        description: `Hands-on application of concepts`,
                        duration: Math.round(formData.duration * 0.5),
                        resources: [`Practice Scenarios`],
                        instructions: 'Complete practice exercises and self-assessment'
                    }
                ],
                assessments: [
                    {
                        id: 'assess-new-1',
                        criteria: 'Knowledge Application',
                        weight: 50,
                        rubric: {
                            excellent: 'Demonstrates mastery of concepts with creative application',
                            good: 'Shows solid understanding with correct application',
                            needs_improvement: 'Basic understanding with some application errors'
                        }
                    }
                ],
                resources: [`${formData.topic} Resource Library`],
                adaptations: {
                    visual: [`${formData.topic} infographics and charts`],
                    auditory: [`${formData.topic} podcasts and discussions`],
                    kinesthetic: [`${formData.topic} hands-on activities`]
                },
                followUp: [`Practice ${formData.topic} in real scenarios`],
                createdAt: new Date().toISOString(),
                generatedBy: 'ai'
            };

            setLessonPlans(prev => [newPlan, ...prev]);
            setShowCreateDialog(false);
            setFormData({
                topic: '',
                skillLevel: 'intermediate',
                duration: 60,
                specificGoals: '',
                learningStyle: 'mixed',
                additionalRequirements: ''
            });

            toast({
                title: 'Lesson Plan Generated!',
                description: `Your AI-powered lesson plan for ${formData.topic} is ready.`,
            });
        } catch (error) {
            toast({
                title: 'Generation Failed',
                description: 'Failed to generate lesson plan. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSavePlan = (plan: AILessonPlan) => {
        // In real implementation, this would save to the backend
        toast({
            title: 'Plan Saved',
            description: 'Lesson plan saved to your library.',
        });
    };

    const handleDownloadPlan = (plan: AILessonPlan) => {
        const content = generatePlanHTML(plan);
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lesson-plan-${plan.title.replace(/\s+/g, '-').toLowerCase()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
            title: 'Downloaded',
            description: 'Lesson plan downloaded as HTML file.',
        });
    };

    const generatePlanHTML = (plan: AILessonPlan) => {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Lesson Plan - ${plan.title}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; }
        .section { margin-bottom: 30px; }
        .objective, .activity { margin-bottom: 15px; padding: 15px; border-left: 4px solid #3b82f6; background: #f8fafc; }
        .badge { display: inline-block; padding: 4px 8px; background: #e2e8f0; border-radius: 4px; font-size: 12px; margin-right: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${plan.title}</h1>
        <p>${plan.description}</p>
        <p>Generated by Bayon Coagent AI Learning System</p>
    </div>
    
    <div class="section">
        <h2>Learning Objectives</h2>
        ${plan.objectives.map(obj => `
            <div class="objective">
                <span class="badge">${obj.category}</span>
                <span class="badge">${obj.priority} priority</span>
                <p>${obj.description}</p>
            </div>
        `).join('')}
    </div>
    
    <div class="section">
        <h2>Activities</h2>
        ${plan.activities.map(activity => `
            <div class="activity">
                <h3>${activity.title} (${activity.duration} min)</h3>
                <p><strong>Type:</strong> ${activity.type}</p>
                <p><strong>Description:</strong> ${activity.description}</p>
                <p><strong>Instructions:</strong> ${activity.instructions}</p>
            </div>
        `).join('')}
    </div>
</body>
</html>
        `;
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'knowledge': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'skill': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'behavior': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'reading': return <BookOpen className="h-4 w-4" />;
            case 'video': return <Play className="h-4 w-4" />;
            case 'practice': return <Target className="h-4 w-4" />;
            case 'quiz': return <CheckCircle className="h-4 w-4" />;
            case 'discussion': return <Users className="h-4 w-4" />;
            case 'role-play': return <Users className="h-4 w-4" />;
            default: return <Lightbulb className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-headline flex items-center gap-2">
                                <Brain className="h-6 w-6 text-primary" />
                                AI Lesson Plan Generator
                            </CardTitle>
                            <CardDescription>
                                Create personalized, adaptive lesson plans powered by AI for any real estate topic
                            </CardDescription>
                        </div>
                        <Button onClick={() => setShowCreateDialog(true)}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate New Plan
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Lesson Plans Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {lessonPlans.map((plan) => (
                    <Card
                        key={plan.id}
                        className="cursor-pointer transition-all duration-200 hover:shadow-lg"
                        onClick={() => {
                            setSelectedPlan(plan);
                            setShowPlanDetail(true);
                        }}
                    >
                        <div className="aspect-video bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-600/20" />
                            <div className="relative z-10 text-center">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <Brain className="h-8 w-8 text-primary" />
                                </div>
                                <Badge className="bg-white/20 text-white">
                                    {plan.topic}
                                </Badge>
                            </div>
                            <div className="absolute top-3 right-3">
                                <Badge variant="secondary" className="bg-white/20 text-white">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {plan.duration}m
                                </Badge>
                            </div>
                        </div>

                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{plan.title}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-3">{plan.description}</p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <Badge className={
                                        plan.skillLevel === 'beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                            plan.skillLevel === 'intermediate' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                    }>
                                        {plan.skillLevel}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Target className="h-4 w-4" />
                                        {plan.objectives.length} objectives
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-sm font-medium">Activities: {plan.activities.length}</div>
                                    <div className="flex gap-1">
                                        {plan.activities.slice(0, 3).map((activity, index) => (
                                            <div key={index} className="w-6 h-6 bg-muted rounded flex items-center justify-center">
                                                {getActivityIcon(activity.type)}
                                            </div>
                                        ))}
                                        {plan.activities.length > 3 && (
                                            <div className="w-6 h-6 bg-muted rounded flex items-center justify-center text-xs">
                                                +{plan.activities.length - 3}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Create Lesson Plan Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Generate AI Lesson Plan
                        </DialogTitle>
                        <DialogDescription>
                            Tell us what you want to learn, and our AI will create a personalized lesson plan for you.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="topic">Topic or Skill *</Label>
                            <Input
                                id="topic"
                                placeholder="e.g., Lead Generation, Negotiation Skills, Social Media Marketing"
                                value={formData.topic}
                                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="skillLevel">Skill Level</Label>
                                <Select
                                    value={formData.skillLevel}
                                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, skillLevel: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {skillLevels.map((level) => (
                                            <SelectItem key={level.value} value={level.value}>
                                                <div>
                                                    <div className="font-medium">{level.label}</div>
                                                    <div className="text-sm text-muted-foreground">{level.description}</div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (minutes)</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    min="15"
                                    max="240"
                                    value={formData.duration}
                                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="goals">Specific Learning Goals (Optional)</Label>
                            <Textarea
                                id="goals"
                                placeholder="What specific outcomes do you want to achieve? Any particular challenges you're facing?"
                                value={formData.specificGoals}
                                onChange={(e) => setFormData(prev => ({ ...prev, specificGoals: e.target.value }))}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="requirements">Additional Requirements (Optional)</Label>
                            <Textarea
                                id="requirements"
                                placeholder="Any specific requirements, constraints, or preferences for your lesson plan?"
                                value={formData.additionalRequirements}
                                onChange={(e) => setFormData(prev => ({ ...prev, additionalRequirements: e.target.value }))}
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleGeneratePlan} disabled={isGenerating || !formData.topic.trim()}>
                            {isGenerating ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Plan
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Lesson Plan Detail Dialog */}
            <Dialog open={showPlanDetail} onOpenChange={setShowPlanDetail}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                    {selectedPlan && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-2xl">{selectedPlan.title}</DialogTitle>
                                <DialogDescription className="text-base">
                                    {selectedPlan.description}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex-1 overflow-auto space-y-6">
                                {/* Plan Overview */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{selectedPlan.duration} minutes</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm capitalize">{selectedPlan.skillLevel}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Target className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{selectedPlan.objectives.length} objectives</span>
                                    </div>
                                </div>

                                {/* Learning Objectives */}
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Target className="h-4 w-4" />
                                        Learning Objectives
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedPlan.objectives.map((objective) => (
                                            <div key={objective.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm">{objective.description}</p>
                                                    <div className="flex gap-2 mt-1">
                                                        <Badge className={getCategoryColor(objective.category)}>
                                                            {objective.category}
                                                        </Badge>
                                                        <Badge variant="outline">
                                                            {objective.priority} priority
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Activities */}
                                <div>
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Play className="h-4 w-4" />
                                        Learning Activities
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedPlan.activities.map((activity, index) => (
                                            <div key={activity.id} className="border rounded-lg p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 bg-primary/10 rounded flex items-center justify-center">
                                                            {getActivityIcon(activity.type)}
                                                        </div>
                                                        <h5 className="font-medium">{activity.title}</h5>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {activity.duration}m
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                                                <p className="text-sm"><strong>Instructions:</strong> {activity.instructions}</p>
                                                {activity.resources.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-xs font-medium text-muted-foreground">Resources:</p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {activity.resources.map((resource, idx) => (
                                                                <Badge key={idx} variant="secondary" className="text-xs">
                                                                    {resource}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Assessment Criteria */}
                                {selectedPlan.assessments.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                            <Award className="h-4 w-4" />
                                            Assessment Criteria
                                        </h4>
                                        <div className="space-y-3">
                                            {selectedPlan.assessments.map((assessment) => (
                                                <div key={assessment.id} className="border rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h5 className="font-medium">{assessment.criteria}</h5>
                                                        <Badge variant="outline">{assessment.weight}%</Badge>
                                                    </div>
                                                    <div className="grid gap-2 md:grid-cols-3 text-sm">
                                                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                                            <div className="font-medium text-green-800 dark:text-green-300">Excellent</div>
                                                            <div className="text-green-700 dark:text-green-400">{assessment.rubric.excellent}</div>
                                                        </div>
                                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                                            <div className="font-medium text-blue-800 dark:text-blue-300">Good</div>
                                                            <div className="text-blue-700 dark:text-blue-400">{assessment.rubric.good}</div>
                                                        </div>
                                                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                                                            <div className="font-medium text-orange-800 dark:text-orange-300">Needs Improvement</div>
                                                            <div className="text-orange-700 dark:text-orange-400">{assessment.rubric.needs_improvement}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowPlanDetail(false)}>
                                    Close
                                </Button>
                                <Button variant="outline" onClick={() => handleDownloadPlan(selectedPlan)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                                <Button onClick={() => handleSavePlan(selectedPlan)}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save to Library
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}