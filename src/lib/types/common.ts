
import { ChartConfig } from '@/components/ui/chart';
import { ImagePlaceholder } from '@/lib/constants/placeholder-images';

export type Profile = {
  id?: string;
  name?: string;
  photoURL?: string;
  licenseNumber?: string;
  certifications?: string[] | string;
  yearsOfExperience?: number | string;
  bio?: string;
  phone?: string;
  address?: string;
  agencyName?: string;
  agencyId?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  googleBusinessProfileId?: string;
  domainAuthority?: number;
  zillowEmail?: string;
  teamId?: string;
};

export type Review = {
  id: string;
  agentId: string;
  author: {
    name: string;
  };
  source: 'Google' | 'Zillow' | 'Yelp';
  avatarUrl: string;
  rating: number;
  comment: string;
  date: string;
};

export type Award = {
  id: string;
  title: string;
  issuer: string;
  year: number;
};

export type NapAuditResult = {
  platform: string;
  platformUrl?: string;
  foundName?: string;
  foundAddress?: string;
  foundPhone?: string;
  status: 'Consistent' | 'Inconsistent' | 'Not Found';
};

export type BrandAudit = {
  id: string;
  results: NapAuditResult[];
  lastRun: string;
};

export type ReviewAnalysis = {
  id: string;
  overallSentiment: 'Positive' | 'Negative' | 'Mixed';
  summary: string;
  keywords: string[];
  commonThemes: string[];
  analyzedAt: string;
}

export type Property = {
  id: string;
  address: string;
  price: string;
  beds: number;
  baths: number;
  sqft: number | string;
  imageUrl: string;
  imageHint: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  type: string;
  description: string;
  image: ImagePlaceholder;
};

export type Competitor = {
  id: string;
  name: string;
  agency: string;
  reviewCount: number;
  avgRating: number;
  socialFollowers: number;
  domainAuthority: number;
  isYou?: boolean;
  createdAt?: string;
}

export type KeywordRanking = {
  rank: number;
  agentName: string;
  agencyName: string;
  url?: string;
  keyword?: string; // Added by the action for display purposes
}

export type ResearchReport = {
  id: string;
  topic: string;
  report: string;
  citations: string[];
  createdAt: string;
}

export type Project = {
  id: string;
  name: string;
  createdAt: string;
}

export type SavedContent = {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  } | string;
  name?: string;
  projectId?: string;
}


export type TrainingProgress = {
  id: string;
  completed: boolean;
  completedAt: string;
}

export type MarketingPlan = {
  id: string;
  steps: MarketingTask[];
  createdAt: string;
}

export type MarketingTask = {
  task: string;
  rationale: string;
  toolLink: string;
  tool: string;
  completed?: boolean;
}

export type ComparableProperty = {
  property: Property;
  justification: string;
  similarityScore: number;
}

export type CmaReport = {
  summary: string;
  estimatedValueRange: {
    low: number;
    high: number;
  };
  comparables: ComparableProperty[];
}

export type Transaction = {
  id: string;
  propertyId: string;
  propertyAddress: string;
  status: 'Pending' | 'Under Contract' | 'Closed' | 'Cancelled';
  currentValue: number;
  buyerName: string;
  sellerName: string;
  closingDate: string;
  checklist: TransactionTask[];
}

export type TransactionTask = {
  id: string;
  name: string;
  status: 'pending' | 'completed';
  dueDate?: string;
};

export type MarketTrendData = {
  month: string;
  price: number;
  inventory: number;
  demand: number;
}

export const marketTrendsChartConfig = {
  price: {
    label: "Median Price ($K)",
    color: "hsl(var(--chart-1))",
  },
  inventory: {
    label: "Inventory",
    color: "hsl(var(--chart-2))",
  },
  demand: {
    label: "Buyer Demand",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export type Client = {
  id: string;
  name: string;
  ownedProperty?: {
    propertyId: string;
    address: string;
    purchaseDate: string;
    bedrooms: number;
    bathrooms: number;
  };
  familyDetails?: {
    maritalStatus: 'Single' | 'Married' | 'Partnered';
    children: { age: number }[];
  };
  estimatedIncome?: number;
};

export type FurnitureItem = {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
  dataAiHint: string;
  promptHint: string;
};

export type FurnitureStyle = {
  name: string;
  items: FurnitureItem[];
};

export type Feedback = {
  id: string;
  userId: string;
  userEmail: string;
  type: 'bug' | 'feature' | 'improvement' | 'general';
  message: string;
  status: 'submitted' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
};

// ==================== Client Portal Types ====================

/**
 * Client Dashboard - Personalized dashboard for agent's clients
 * Accessed via secured, expiring links (no client authentication required)
 */
export type ClientDashboard = {
  id: string;
  agentId: string;

  // Client Information
  clientInfo: {
    name: string;
    email: string;
    phone?: string;
    propertyInterests?: string;
    notes?: string;
  };

  // Dashboard Configuration - which features are enabled
  config: {
    cmaEnabled: boolean;
    propertySearchEnabled: boolean;
    homeValuationEnabled: boolean;
    documentsEnabled: boolean;
  };

  // CMA (Comparative Market Analysis) Data
  cmaData?: {
    subjectProperty: {
      address: string;
      beds: number;
      baths: number;
      sqft: number;
      yearBuilt: number;
    };
    comparableProperties: Array<{
      address: string;
      soldPrice: number;
      soldDate: string;
      beds: number;
      baths: number;
      sqft: number;
      distance: number; // miles
    }>;
    marketTrends: {
      medianPrice: number;
      daysOnMarket: number;
      inventoryLevel: 'low' | 'medium' | 'high';
    };
    priceRecommendation: {
      low: number;
      mid: number;
      high: number;
    };
    agentNotes?: string;
  };

  // Branding Configuration
  branding: {
    logoUrl?: string;
    primaryColor: string;
    secondaryColor?: string;
    welcomeMessage: string;
    agentContact: {
      phone: string;
      email: string;
    };
  };

  // Metadata
  createdAt: string;
  updatedAt: string;
};

/**
 * Secured Link - Token-based access to client dashboards
 * No authentication required, just a valid, non-expired token
 */
export type SecuredLink = {
  id: string;
  token: string; // Unique token for accessing the dashboard
  dashboardId: string;
  agentId: string;

  // Expiration and Access Control
  expiresAt: string; // ISO timestamp
  isRevoked: boolean;

  // Analytics
  accessCount: number;
  lastAccessedAt?: string; // ISO timestamp

  // Metadata
  createdAt: string;
};

/**
 * Dashboard Analytics - Track client interactions with the dashboard
 */
export type DashboardAnalytics = {
  id: string;
  dashboardId: string;
  timestamp: string; // ISO timestamp

  // View Information
  viewType: 'dashboard' | 'cma' | 'property' | 'valuation' | 'document';

  // Property Interactions (if applicable)
  propertyInteraction?: {
    propertyId: string;
    action: 'view' | 'save' | 'inquiry';
  };

  // Contact Requests (if applicable)
  contactRequest?: {
    type: 'general' | 'cma' | 'property' | 'valuation';
    message?: string;
  };

  // Session Information
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
};

// ==================== Testimonial & SEO Features Types ====================

/**
 * Testimonial - Client testimonial with optional photo
 */
export type TestimonialStatus = 'pending' | 'published' | 'archived';

export type Testimonial = {
  id: string; // Unique identifier
  userId: string; // Agent's user ID
  clientName: string; // Client's full name
  testimonialText: string; // The testimonial content
  dateReceived: string; // ISO 8601 timestamp
  clientPhotoUrl?: string; // S3 URL for client photo
  isFeatured: boolean; // Display on profile page
  displayOrder?: number; // Order for featured testimonials
  tags: string[]; // Categories (e.g., "buyer", "seller", "luxury")
  requestId?: string; // Link to testimonial request if applicable
  status: TestimonialStatus;
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
};

/**
 * TestimonialRequest - Request sent to client for testimonial
 */
export type TestimonialRequest = {
  id: string; // Unique identifier
  userId: string; // Agent's user ID
  clientName: string; // Client's full name
  clientEmail: string; // Client's email address
  status: 'pending' | 'submitted' | 'expired';
  submissionLink: string; // Unique URL for client submission
  sentAt: string; // ISO 8601 timestamp
  reminderSentAt?: string; // ISO 8601 timestamp for reminder
  submittedAt?: string; // ISO 8601 timestamp when submitted
  expiresAt: string; // ISO 8601 timestamp (30 days from sent)
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
};

/**
 * SEOAnalysis - SEO analysis results for content
 */
export type SEOAnalysis = {
  id: string; // Unique identifier
  userId: string; // Agent's user ID
  contentId: string; // Reference to blog post or content
  contentType: 'blog-post' | 'market-update' | 'neighborhood-guide';
  score: number; // 0-100 SEO score
  recommendations: SEORecommendation[];
  analyzedAt: string; // ISO 8601 timestamp
  previousScore?: number; // Previous score for tracking
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
};

/**
 * SEORecommendation - Individual SEO recommendation
 */
export type SEORecommendation = {
  priority: 'high' | 'medium' | 'low';
  category: 'title' | 'headings' | 'keywords' | 'readability' | 'meta' | 'length';
  message: string; // Human-readable recommendation
  currentValue?: string; // Current state
  suggestedValue?: string; // Suggested improvement
};

/**
 * SavedKeyword - Saved keyword for SEO targeting
 */
export type SavedKeyword = {
  id: string; // Unique identifier
  userId: string; // Agent's user ID
  keyword: string; // The keyword phrase
  searchVolume: number; // Estimated monthly searches
  competition: 'low' | 'medium' | 'high';
  location: string; // Geographic area (from profile)
  addedAt: string; // ISO 8601 timestamp
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
};


