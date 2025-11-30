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
    clientName: string;
    role?: string;
    testimonialText: string;
    rating: number;
    avatar?: string;
    company?: string;
    isFeatured?: boolean;
    displayOrder?: number;
}
