import {
    PenTool,
    Search,
    Calculator,
    Users,
    Settings,
    BarChart3,
    Target,
    Brain,
    Home,
    FileText,
    Image,
    TrendingUp,
    Award,
    Newspaper,
    BookOpen,
    DollarSign,
    Building,
    MessageSquare,
    Calendar,
    Bell,
    Gift,
    Plug,
    Zap
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

/**
 * Centralized icon mapping for consistent icon usage across the application
 * Maps string icon names to Lucide React components
 */
export const ICON_MAP: Record<string, LucideIcon> = {
    PenTool,
    Search,
    Calculator,
    Users,
    Settings,
    BarChart3,
    Target,
    Brain,
    Home,
    FileText,
    Image,
    TrendingUp,
    Award,
    Newspaper,
    BookOpen,
    DollarSign,
    Building,
    MessageSquare,
    Calendar,
    Bell,
    Gift,
    Plug,
    Zap
};

/**
 * Get an icon component by name with fallback
 * @param iconName - The name of the icon
 * @param fallback - Fallback icon if the named icon is not found
 * @returns The icon component
 */
export function getIcon(iconName: string, fallback: LucideIcon = Zap): LucideIcon {
    return ICON_MAP[iconName] || fallback;
}

/**
 * Type for valid icon names
 */
export type IconName = keyof typeof ICON_MAP;