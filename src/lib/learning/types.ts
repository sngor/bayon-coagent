/**
 * Learning System Type Definitions
 * Centralized types for the learning hub
 */

// Re-export types from learning-actions for consistency
export type {
    CourseProgress,
    TutorialProgress,
    BestPracticeBookmark,
    LearningCertificate
} from '@/app/learning-actions';

// Learning Module Structure
export interface LearningModule {
    id: string;
    title: string;
    description: string;
    content: string;
    category: 'marketing' | 'closing' | 'professional';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedMinutes: number;
    prerequisites?: string[];
    learningObjectives: string[];
    quiz: QuizQuestion[];
    tags?: string[];
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
}

// Role-Play System - Unified type definition
export interface RolePlayScenario {
    id: string;
    title: string;
    description: string;
    category: 'objection-handling' | 'listing-presentation' | 'buyer-consultation' | 'negotiation';
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced'; // Capitalized to match data
    duration: number; // minutes
    scenario: string; // Added for scenario description
    objectives: string[]; // Renamed from learningObjectives for consistency
    successCriteria: string[]; // Added for success metrics
    keyPoints?: string[]; // Optional key points
    relatedModules?: string[]; // Made optional
    learningObjectives?: string[]; // Deprecated, use objectives instead
    persona: RolePlayPersona;
    aiPersona: RolePlayAIPersona; // Added for AI-specific persona data
    isCompleted?: boolean;
    bestScore?: number;
}

export interface RolePlayPersona {
    name: string;
    role?: string; // Made optional for backward compatibility
    background: string;
    personality: string;
    goals: string[];
    concerns: string[];
    communicationStyle: string;
    gender?: 'male' | 'female'; // Added for compatibility
}

// AI-specific persona interface for enhanced role-play
export interface RolePlayAIPersona {
    name: string;
    role: string;
    personality: string;
    background: string;
    goals: string[];
    concerns: string[];
}

export interface RolePlayMessage {
    role: 'user' | 'ai';
    content: string;
    timestamp: string;
}

export interface RolePlaySession {
    id: string;
    scenarioId: string;
    userId: string;
    messages: RolePlayMessage[];
    startTime: string;
    endTime?: string;
    feedback?: string;
    score?: number;
}

// Community System
export interface CommunityPost {
    id: string;
    userId: string;
    content: string;
    category: 'question' | 'discussion' | 'success-story' | 'tip' | 'announcement';
    tags: string[];
    likes: number;
    replies: number;
    createdAt: string;
    lastActivity: string;
    isLiked?: boolean;
}

export interface CommunityReply {
    id: string;
    postId: string;
    userId: string;
    content: string;
    likes: number;
    createdAt: string;
    isLiked?: boolean;
}

// Progress Tracking
export interface LearningProgress {
    userId: string;
    moduleId: string;
    completed: boolean;
    completedAt?: string;
    lastAccessedAt: string;
    timeSpent: number; // minutes
    quizScore?: number;
}

export interface LearningAnalytics {
    coursesEnrolled: number;
    coursesCompleted: number;
    tutorialsWatched: number;
    certificatesEarned: number;
    totalLearningTime: number; // minutes
    streakDays: number;
    lastActivity: string;
    averageQuizScore: number;
    completionRate: number; // percentage
}

// Learning Paths
export interface LearningPath {
    id: string;
    title: string;
    description: string;
    modules: string[]; // module IDs in order
    estimatedHours: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    category: 'marketing' | 'closing' | 'professional' | 'mixed';
}

// Certificates
export interface Certificate {
    id: string;
    userId: string;
    type: 'course' | 'path' | 'skill' | 'achievement';
    title: string;
    description: string;
    issuedAt: string;
    expiresAt?: string;
    credentialUrl: string;
    badgeUrl: string;
    moduleIds: string[];
}

// Learning Preferences
export interface LearningPreferences {
    userId: string;
    preferredLearningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    difficultyPreference: 'beginner' | 'intermediate' | 'advanced';
    timePreference: 'short' | 'medium' | 'long'; // session length
    reminderFrequency: 'daily' | 'weekly' | 'never';
    categories: string[]; // preferred learning categories
}

// Search and Filtering
export interface LearningFilters {
    category?: 'marketing' | 'closing' | 'professional' | 'all';
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'all';
    duration?: 'short' | 'medium' | 'long' | 'all'; // < 15min, 15-30min, > 30min
    completed?: boolean;
    search?: string;
}

export interface LearningSearchResult {
    modules: LearningModule[];
    scenarios: RolePlayScenario[];
    posts: CommunityPost[];
    totalCount: number;
}

// UI Component Props
export interface ProgressHeroProps {
    completedModules: Set<string>;
    totalModules: number;
    marketingModules: LearningModule[];
    closingModules: LearningModule[];
    professionalModules: LearningModule[];
    firstIncompleteModule?: LearningModule;
    onContinueLearning: () => void;
}

export interface ModuleCardProps {
    module: LearningModule;
    isCompleted: boolean;
    isActive: boolean;
    onSelect: (module: LearningModule) => void;
}

export interface ScenarioCardProps {
    scenario: RolePlayScenario;
    onClick: (scenario: RolePlayScenario) => void;
}

// API Response Types
export interface LearningApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    errors?: string[];
}

export type EnrollCourseResponse = LearningApiResponse<CourseProgress>;
export type UpdateProgressResponse = LearningApiResponse<LearningProgress>;
export type GetAnalyticsResponse = LearningApiResponse<LearningAnalytics>;
export type CreatePostResponse = LearningApiResponse<CommunityPost>;

// Constants
export const LEARNING_CATEGORIES = ['marketing', 'closing', 'professional'] as const;
export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export const ROLE_PLAY_CATEGORIES = [
    'objection-handling',
    'listing-presentation',
    'buyer-consultation',
    'negotiation'
] as const;

export type LearningCategory = typeof LEARNING_CATEGORIES[number];
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number];
export type RolePlayCategory = typeof ROLE_PLAY_CATEGORIES[number];