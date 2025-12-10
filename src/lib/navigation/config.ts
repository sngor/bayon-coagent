import {
    Users,
    MessageSquare,
    MessagesSquare,
    BarChart3,
    Settings,
    Activity,
    Shield,
    GraduationCap,
    Library,
    Target,
    Wand2,
    Calculator,
    FileText,
    DoorOpen,
    CreditCard,
    Flag,
    Bell,
    Megaphone,
    DollarSign,
    Key,
} from 'lucide-react';
import {
    HouseIcon,
    AISparkleIcon,
} from '@/components/ui/real-estate-icons';
import { NavigationConfig } from './types';

// Navigation configuration
export const NAVIGATION_CONFIG: NavigationConfig = {
    regular: [
        {
            href: '/dashboard',
            icon: HouseIcon,
            filledIcon: HouseIcon,
            label: 'Dashboard',
            customIcon: true,
            featureId: null
        },
        {
            href: '/brand',
            icon: Target,
            filledIcon: Target,
            label: 'Brand',
            featureId: 'brand'
        },
        {
            href: '/studio',
            icon: Wand2,
            filledIcon: Wand2,
            label: 'Studio',
            featureId: 'studio'
        },
        {
            href: '/intelligence',
            icon: AISparkleIcon,
            filledIcon: AISparkleIcon,
            label: 'Intelligence',
            customIcon: true,
            featureId: 'research'
        },
        {
            href: '/tools',
            icon: Calculator,
            filledIcon: Calculator,
            label: 'Tools',
            featureId: 'tools'
        },
        {
            href: '/library',
            icon: Library,
            filledIcon: Library,
            label: 'Library',
            featureId: 'library'
        },
        {
            href: '/client-dashboards',
            icon: Users,
            filledIcon: Users,
            label: 'Clients',
            featureId: 'client-dashboards'
        },
        {
            href: '/learning',
            icon: GraduationCap,
            filledIcon: GraduationCap,
            label: 'Learning',
            featureId: 'training'
        },
        {
            href: '/assistant',
            icon: MessagesSquare,
            filledIcon: MessagesSquare,
            label: 'Assistant',
            featureId: 'assistant'
        },
        {
            href: '/open-house',
            icon: DoorOpen,
            filledIcon: DoorOpen,
            label: 'Open House',
            featureId: 'open-house'
        },
        {
            href: '/admin',
            icon: Shield,
            filledIcon: Shield,
            label: 'Admin',
            featureId: null,
            adminOnly: true
        },
    ],
    admin: [
        {
            href: '/admin',
            icon: Shield,
            filledIcon: Shield,
            label: 'Overview'
        },
        {
            href: '/admin/analytics',
            icon: BarChart3,
            filledIcon: BarChart3,
            label: 'Analytics'
        },
        {
            href: '/admin/users',
            icon: Users,
            filledIcon: Users,
            label: 'Users'
        },
        {
            href: '/admin/content/moderation',
            icon: Flag,
            filledIcon: Flag,
            label: 'Content'
        },
        // Super admin only items
        {
            href: '/admin/announcements',
            icon: Megaphone,
            filledIcon: Megaphone,
            label: 'Announcements',
            superAdminOnly: true
        },
        {
            href: '/admin/support',
            icon: MessageSquare,
            filledIcon: MessageSquare,
            label: 'Support',
            superAdminOnly: true
        },
        {
            href: '/admin/feedback',
            icon: Bell,
            filledIcon: Bell,
            label: 'Feedback',
            superAdminOnly: true
        },
        {
            href: '/admin/system/health',
            icon: Activity,
            filledIcon: Activity,
            label: 'System',
            superAdminOnly: true
        },
        {
            href: '/admin/config/features',
            icon: Settings,
            filledIcon: Settings,
            label: 'Config',
            superAdminOnly: true
        },
        {
            href: '/admin/billing',
            icon: DollarSign,
            filledIcon: DollarSign,
            label: 'Billing',
            superAdminOnly: true
        },
        {
            href: '/admin/integrations',
            icon: Key,
            filledIcon: Key,
            label: 'Integrations',
            superAdminOnly: true
        },
        {
            href: '/admin/audit',
            icon: FileText,
            filledIcon: FileText,
            label: 'Audit',
            superAdminOnly: true
        }
    ],
    superAdmin: [
        {
            href: '/super-admin',
            icon: Shield,
            filledIcon: Shield,
            label: 'Super Admin Dashboard'
        },
        {
            href: '/super-admin/users',
            icon: Users,
            filledIcon: Users,
            label: 'User Management'
        },
        {
            href: '/super-admin/teams',
            icon: Users,
            filledIcon: Users,
            label: 'Teams'
        },
        {
            href: '/super-admin/feedback',
            icon: MessageSquare,
            filledIcon: MessageSquare,
            label: 'Feedback'
        },
        {
            href: '/super-admin/analytics',
            icon: BarChart3,
            filledIcon: BarChart3,
            label: 'Analytics'
        },
        {
            href: '/super-admin/health',
            icon: Activity,
            filledIcon: Activity,
            label: 'System Health'
        },
        {
            href: '/super-admin/features',
            icon: Settings,
            filledIcon: Settings,
            label: 'Features'
        },
        {
            href: '/super-admin/audit-logs',
            icon: FileText,
            filledIcon: FileText,
            label: 'Audit Logs'
        },
        {
            href: '/super-admin/billing',
            icon: CreditCard,
            filledIcon: CreditCard,
            label: 'Billing Management'
        }
    ]
};