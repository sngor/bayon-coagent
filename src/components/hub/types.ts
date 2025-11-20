import { LucideIcon } from 'lucide-react';

export interface HubTab {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: number | string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

export interface HubLayoutProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  tabs: HubTab[];
  children: React.ReactNode;
  actions?: React.ReactNode;
  tabsVariant?: 'default' | 'pills' | 'underline';
}

export interface HubTabsProps {
  tabs: HubTab[];
  activeTab: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
}

export interface HubBreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
}

export interface HubHeaderProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
}
