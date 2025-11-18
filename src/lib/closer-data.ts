
import type { ChartConfig } from '@/components/ui/chart';
import type { ImagePlaceholder } from './placeholder-images';

/**
 * Represents a single property listing.
 */
export type Property = {
  id: string; // The unique identifier for the property (e.g., from an MLS).
  image: ImagePlaceholder; // Object containing URLs and metadata for the property's primary image.
  address: string; // The full street address.
  city: string; // The city where the property is located.
  state: string; // The state or province.
  zip: string; // The postal code.
  lat: number; // The geographical latitude.
  lng: number; // The geographical longitude.
  price: number; // The listing price in USD.
  beds: number; // The number of bedrooms.
  baths: number; // The number of bathrooms.
  sqft: number; // The total square footage.
  type: string; // The type of property (e.g., 'Single-Family', 'Condo').
  description: string; // A detailed text description of the property.
};

/**
 * Represents a single comparable property with AI analysis.
 */
export type ComparableProperty = {
    property: Property;
    justification: string;
    similarityScore: number;
}

/**
 * Represents a full Comparative Market Analysis (CMA) report.
 */
export type CmaReport = {
    summary: string;
    estimatedValueRange: {
        low: number;
        high: number;
    };
    comparables: ComparableProperty[];
}


/**
 * Represents a real estate transaction from start to finish.
 */
export type Transaction = {
    id: string; // The unique identifier for this transaction record.
    propertyId: string; // The ID of the property involved.
    propertyAddress: string; // The address of the property, stored for display purposes.
    status: 'Pending' | 'Under Contract' | 'Closed' | 'Cancelled'; // The current stage of the transaction.
    currentValue: number; // The sale price of the property.
    buyerName: string; // The name of the primary buyer.
    sellerName: string; // The name of the primary seller.
    closingDate: string; // The target closing date in ISO 8601 format.
    checklist: TransactionTask[]; // A list of tasks to be completed for this transaction.
}

/**
 * Represents a single task within a transaction's checklist.
 */
export type TransactionTask = {
    id: string; // A unique slug for the task (e.g., 'initial-deposit').
    name: string; // The human-readable name of the task.
    status: 'pending' | 'completed'; // The current status of the task.
    dueDate?: string; // The suggested due date in ISO 8601 format.
};

/**
 * Represents simulated market trend data for a specific location over time.
 */
export type MarketTrendData = {
  month: string; // The month for the data point (e.g., 'Jan', 'Feb').
  price: number; // The median property price for that month (in thousands).
  inventory: number; // The number of active listings for that month.
  demand: number; // A simulated buyer demand metric for that month.
}

/**
 * Configuration for the market trends chart component.
 */
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

/**
 * Represents a real estate client, including data for predictive modeling.
 */
export type Client = {
  id: string; // Unique identifier for the client.
  name: string; // The client's full name.
  ownedProperty?: {
    propertyId: string; // The ID of the property, if known.
    address: string; // The address of the owned property.
    purchaseDate: string; // The date they bought the property (ISO 8601).
    bedrooms: number; // Number of bedrooms in their current home.
    bathrooms: number; // Number of bathrooms in their current home.
  };
  familyDetails?: {
    maritalStatus: 'Single' | 'Married' | 'Partnered'; // The client's marital status.
    children: { age: number }[]; // A list of children, used for life-stage modeling.
  };
  estimatedIncome?: number; // The client's estimated annual household income.
};

/**
 * Represents a piece of AI-generated content saved by the user.
 */
export type SavedContent = {
  id: string; // The unique ID for the saved document.
  title: string; // The title of the saved content.
  content: string; // The content itself, which can be plain text or HTML.
  type: string; // The type of content (e.g., 'listing-description', 'roi-calculation').
  createdAt: { // The Firestore timestamp when the content was saved.
    seconds: number;
    nanoseconds: number;
  } | string; 
}


/**
 * Represents a single furniture item in the staging library.
 */
export type FurnitureItem = {
    id: string;
    name: string;
    type: string;
    imageUrl: string;
    dataAiHint: string;
    promptHint: string;
};

/**
 * Represents a style category containing multiple furniture items.
 */
export type FurnitureStyle = {
    name: string;
    items: FurnitureItem[];
};
