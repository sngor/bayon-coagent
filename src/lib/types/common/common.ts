export interface Review {
    id: string;
    author: string;
    rating: number;
    date: string;
    content: string;
    source: string;
}

export interface Profile {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    bio?: string;
    role?: string;
}

export interface MarketingTask {
    id: string;
    task: string;
    rationale: string;
    status: 'pending' | 'in_progress' | 'completed';
    dueDate?: string;
}

export interface MarketingPlan {
    id: string;
    title: string;
    steps: MarketingTask[];
    createdAt: string;
}

export interface BrandAudit {
    id: string;
    score: number;
    findings: string[];
    recommendations: string[];
    date: string;
}

export interface Competitor {
    id: string;
    name: string;
    website?: string;
    strengths?: string[];
    weaknesses?: string[];
}

export interface Testimonial {
    id: string;
    userId: string;
    clientName: string;
    testimonialText: string;
    dateReceived: string;
    clientPhotoUrl?: string;
    isFeatured: boolean;
    displayOrder?: number;
    tags: string[];
    requestId?: string;
    createdAt: number;
    updatedAt: number;
}

export interface TestimonialRequest {
    id: string;
    userId: string;
    clientName: string;
    clientEmail: string;
    status: 'pending' | 'submitted' | 'expired';
    submissionLink: string;
    sentAt: string;
    reminderSentAt?: string;
    submittedAt?: string;
    expiresAt: string;
    createdAt: number;
    updatedAt: number;
}

export type TestimonialStatus = 'pending' | 'submitted' | 'expired';
