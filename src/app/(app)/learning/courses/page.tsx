'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    BookOpen,
    Play,
    Clock,
    Users,
    Star,
    CheckCircle,
    Lock,
    Award,
    TrendingUp
} from 'lucide-react';

interface Course {
    id: string;
    title: string;
    description: string;
    duration: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    progress: number;
    isCompleted: boolean;
    isLocked: boolean;
    instructor: string;
    rating: number;
    students: number;
    modules: number;
    category: string;
}

const mockCourses: Course[] = [
    {
        id: '1',
        title: 'Real Estate Marketing Fundamentals',
        description: 'Learn the basics of marketing yourself as a real estate agent, from social media to content creation.',
        duration: '2h 30m',
        level: 'Beginner',
        progress: 75,
        isCompleted: false,
        isLocked: false,
        instructor: 'Sarah Johnson',
        rating: 4.8,
        students: 1247,
        modules: 8,
        category: 'Marketing'
    },
    {
        id: '2',
        title: 'Advanced Lead Generation Strategies',
        description: 'Master advanced techniques for generating high-quality leads through digital marketing and networking.',
        duration: '3h 15m',
        level: 'Advanced',
        progress: 0,
        isCompleted: false,
        isLocked: false,
        instructor: 'Mike Chen',
        rating: 4.9,
        students: 892,
        modules: 12,
        category: 'Lead Generation'
    },
    {
        id: '3',
        title: 'Social Media for Real Estate',
        description: 'Build your brand and attract clients through strategic social media marketing.',
        duration: '1h 45m',
        level: 'Intermediate',
        progress: 100,
        isCompleted: true,
        isLocked: false,
        instructor: 'Lisa Rodriguez',
        rating: 4.7,
        students: 2156,
        modules: 6,
        category: 'Social Media'
    },
    {
        id: '4',
        title: 'AI Tools for Real Estate Agents',
        description: 'Leverage AI tools to streamline your workflow and create better content.',
        duration: '2h 00m',
        level: 'Intermediate',
        progress: 0,
        isCompleted: false,
        isLocked: true,
        instructor: 'David Kim',
        rating: 4.6,
        students: 567,
        modules: 7,
        category: 'Technology'
    }
];

export default function TrainingCoursesPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories = ['all', 'Marketing', 'Lead Generation', 'Social Media', 'Technology'];

    const filteredCourses = selectedCategory === 'all'
        ? mockCourses
        : mockCourses.filter(course => course.category === selectedCategory);

    const getLevelColor = (level: Course['level']) => {
        switch (level) {
            case 'Beginner': return 'bg-green-100 text-green-800';
            case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'Advanced': return 'bg-red-100 text-red-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Training Courses</h1>
                    <p className="text-muted-foreground">
                        Structured learning paths to master real estate marketing
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <BookOpen className="h-8 w-8 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">12</p>
                                <p className="text-sm text-muted-foreground">Available Courses</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold">3</p>
                                <p className="text-sm text-muted-foreground">Completed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="h-8 w-8 text-purple-600" />
                            <div>
                                <p className="text-2xl font-bold">68%</p>
                                <p className="text-sm text-muted-foreground">Overall Progress</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <Award className="h-8 w-8 text-yellow-600" />
                            <div>
                                <p className="text-2xl font-bold">2</p>
                                <p className="text-sm text-muted-foreground">Certificates Earned</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                    <Button
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className="capitalize"
                    >
                        {category}
                    </Button>
                ))}
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                    <Card key={course.id} className={`hover:shadow-lg transition-shadow ${course.isLocked ? 'opacity-60' : ''}`}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-lg mb-2">{course.title}</CardTitle>
                                    <CardDescription className="text-sm">
                                        {course.description}
                                    </CardDescription>
                                </div>
                                {course.isLocked && <Lock className="h-5 w-5 text-muted-foreground" />}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Course Meta */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {course.duration}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {course.students.toLocaleString()}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    {course.rating}
                                </div>
                            </div>

                            {/* Level and Category */}
                            <div className="flex items-center gap-2">
                                <Badge className={getLevelColor(course.level)}>
                                    {course.level}
                                </Badge>
                                <Badge variant="outline">
                                    {course.category}
                                </Badge>
                            </div>

                            {/* Progress */}
                            {!course.isLocked && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Progress</span>
                                        <span>{course.progress}%</span>
                                    </div>
                                    <Progress value={course.progress} className="h-2" />
                                </div>
                            )}

                            {/* Instructor */}
                            <div className="text-sm text-muted-foreground">
                                Instructor: {course.instructor}
                            </div>

                            {/* Action Button */}
                            <Button
                                className="w-full"
                                disabled={course.isLocked}
                                variant={course.isCompleted ? 'outline' : 'default'}
                            >
                                {course.isLocked ? (
                                    <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Locked
                                    </>
                                ) : course.isCompleted ? (
                                    <>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Review Course
                                    </>
                                ) : course.progress > 0 ? (
                                    <>
                                        <Play className="h-4 w-4 mr-2" />
                                        Continue Learning
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4 mr-2" />
                                        Start Course
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Coming Soon */}
            <Card className="border-dashed border-2">
                <CardContent className="p-8 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">More Courses Coming Soon</h3>
                    <p className="text-muted-foreground">
                        We're constantly adding new courses to help you grow your real estate business.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}