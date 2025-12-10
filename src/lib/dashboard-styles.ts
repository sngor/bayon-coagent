import { cn } from '@/lib/utils';

// Common dashboard card styles
export const dashboardCardStyles = {
    base: "border-0 shadow-xl overflow-hidden",
    animated: (delay: number) => `animate-fade-in-up animate-delay-${delay}`,

    // Gradient backgrounds for different sections
    performance: "bg-gradient-to-br from-card to-muted/20",
    priority: "bg-gradient-to-br from-card to-orange-500/5",
    reputation: "bg-gradient-to-br from-card to-yellow-500/5",
    focus: "bg-gradient-to-br from-primary/10 via-purple-500/5 to-card",
    announcements: "bg-gradient-to-br from-orange-500/10 via-card to-card",

    // Hover effects
    hover: "hover:shadow-2xl transition-all duration-300",

    // Background decorations
    decoration: (color: string) => `absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-${color}/10 to-transparent rounded-full blur-3xl`,
};

// Metric card styles
export const metricCardStyles = {
    base: "group relative overflow-hidden rounded-xl border bg-card hover:shadow-md transition-all duration-300 p-5",
    hoverBg: (color: string) => `absolute inset-0 bg-gradient-to-br from-${color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`,
    icon: (color: string) => `w-10 h-10 rounded-lg bg-${color}/10 flex items-center justify-center`,
};

// Utility function to combine dashboard styles
export function getDashboardCardClass(
    type: keyof typeof dashboardCardStyles,
    delay?: number,
    additionalClasses?: string
) {
    const baseClasses = [
        dashboardCardStyles.base,
        dashboardCardStyles.hover,
    ];

    if (delay) {
        baseClasses.push(dashboardCardStyles.animated(delay));
    }

    if (type in dashboardCardStyles) {
        baseClasses.push(dashboardCardStyles[type]);
    }

    return cn(baseClasses, additionalClasses);
}