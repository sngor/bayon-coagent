/**
 * Performance-Optimized Components
 * 
 * This module provides components optimized for performance:
 * - LazyComponent: Dynamic imports with loading fallback and error boundary
 * - VirtualList: Virtualized list for large datasets
 * - OptimizedImage: Next.js Image wrapper with consistent sizing and loading
 * 
 * Requirements: 2.3, 2.4, 7.1, 7.2, 7.4, 8.4
 */

// Lazy loading
export {
    LazyComponent,
    useLazyComponent,
    createLazyComponent,
} from './lazy-component';

// Virtual scrolling
export {
    VirtualList,
    SimpleVirtualList,
    useVirtualListScroll,
} from './virtual-list';

// Image optimization
export {
    OptimizedImage,
    HeroImage,
    CardImage,
    AvatarImage,
    ThumbnailImage,
    PropertyImage,
    LogoImage,
    BackgroundImage,
    generateBlurDataURL,
} from './optimized-image';

// Dynamic imports for heavy components
export {
    createDynamicChart,
    DynamicAnalyticsDashboard,
    DynamicAEOScoreHistoryChart,
    DynamicFutureCastChart,
    DynamicAIVisibilityTrends,
    DynamicOpenHouseComparison,
    DynamicInterestLevelChart,
    DynamicTimelineChart,
} from './dynamic-chart';

export {
    createDynamicMap,
    DynamicCMAReport,
} from './dynamic-map';

// Re-export types
export type { VirtualListProps } from './virtual-list';
