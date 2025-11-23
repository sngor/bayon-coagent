
import { ChartConfig } from '@/components/ui/chart';
import { ImagePlaceholder } from './placeholder-images';

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
}

export type KeywordRanking = {
  rank: number;
  agentName: string;
  agencyName: string;
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
