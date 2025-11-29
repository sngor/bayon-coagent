
'use client';

import { Logo } from '@/components/logo';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
  SidebarToggle,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  PanelLeft,
  LogOut,
  GraduationCap,
  Settings,
  Library,
  Target,
  Wand2,
  MessageSquare,
  Bell,
  HelpCircle,
  Calculator,
  BarChart3,
  Shield,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import {
  HouseIcon,
  AISparkleIcon,
} from '@/components/ui/real-estate-icons';
import Link from 'next/link';
import { usePathname, useRouter, redirect } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useUser, useAuthMethods } from '@/aws/auth/use-user';
import { PageTransition } from '@/components/page-transition';
import { TooltipProvider } from '@/contexts/tooltip-context';
import { AdminProvider, useAdmin } from '@/contexts/admin-context';
import { AccessibilityProvider } from '@/contexts/accessibility-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StickyHeaderProvider, useStickyHeader } from '@/hooks/use-sticky-header';

import { SessionLoading } from '@/components/session-loading';
import { FeedbackButton } from '@/components/feedback-button';
import { DynamicNavigation } from '@/components/dynamic-navigation';
import { useFeatureToggle } from '@/lib/feature-toggles';
import { NotificationCenter } from '@/lib/notifications/components';
import { SubtleGradientMesh } from '@/components/ui/gradient-mesh';
import { ImpersonationBanner } from '@/components/impersonation-banner';

const allNavItems = [
  { href: '/dashboard', icon: HouseIcon, label: 'Dashboard', customIcon: true, featureId: null },
  { href: '/assistant', icon: MessageSquare, label: 'Chat', featureId: 'assistant' },
  { href: '/studio', icon: Wand2, label: 'Studio', featureId: 'studio' },
  { href: '/brand', icon: Target, label: 'Brand', featureId: 'brand' },
  { href: '/research', icon: AISparkleIcon, label: 'Research', customIcon: true, featureId: 'research' },
  { href: '/market', icon: BarChart3, label: 'Market', featureId: 'market' },
  { href: '/tools', icon: Calculator, label: 'Tools', featureId: 'tools' },
  { href: '/library', icon: Library, label: 'Library', featureId: 'library' },
  { href: '/training', icon: GraduationCap, label: 'Training', featureId: 'training' },
];

function AppLoadingScreen() {
  return <SessionLoading />;
}

function StickyHeaderTitle() {
  const { headerInfo } = useStickyHeader();

  if (!headerInfo.isVisible || !headerInfo.title) {
    return null;
  }

  return (
    <div className="animate-in fade-in slide-in-from-left-2 duration-200">
      <h2 className="text-lg font-semibold font-headline text-foreground truncate whitespace-nowrap">
        {headerInfo.title}
      </h2>
    </div>
  );
}

function NavigationItems() {
  const [navItems, setNavItems] = useState(allNavItems);
  const pathname = usePathname();

  useEffect(() => {
    // Import feature toggle manager dynamically to avoid SSR issues
    import('@/lib/feature-toggles').then(({ featureToggleManager }) => {
      const filteredItems = allNavItems.filter(item => {
        // Always show dashboard
        if (!item.featureId) return true;
        // Check if feature is enabled
        return featureToggleManager.isEnabled(item.featureId);
      });
      setNavItems(filteredItems);

      // Listen for feature toggle changes
      const handleToggleChange = () => {
        const updatedItems = allNavItems.filter(item => {
          if (!item.featureId) return true;
          return featureToggleManager.isEnabled(item.featureId);
        });
        setNavItems(updatedItems);
      };

      window.addEventListener('featureToggleChanged', handleToggleChange);
      window.addEventListener('featureToggleReset', handleToggleChange);

      return () => {
        window.removeEventListener('featureToggleChanged', handleToggleChange);
        window.removeEventListener('featureToggleReset', handleToggleChange);
      };
    });
  }, []);

  return (
    <>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname.startsWith(item.href)}
            tooltip={item.label}
          >
            <Link href={item.href}>
              <item.icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
              <span className="button-text-hover">{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
}

function AdminModeBadge() {
  const { adminMode } = useAdmin();

  if (adminMode === 'user') return null;

  return (
    <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-400">
      <Shield className="h-3 w-3 mr-1" />
      {adminMode === 'super_admin' ? 'Super Admin Mode' : 'Admin Mode'}
    </Badge>
  );
}

function UserDropdownContent({ profile, user, userName, getInitials, handleSignOut }: {
  profile: any;
  user: any;
  userName: string;
  getInitials: (name: string) => string;
  handleSignOut: () => void;
}) {
  const { isAdmin, isSuperAdmin, adminMode, toggleAdminMode } = useAdmin();
  const router = useRouter();

  // Debug logging
  console.log('[UserDropdownContent] Admin status:', { isAdmin, isSuperAdmin, adminMode, userId: user?.id });

  const handleModeSwitch = (mode: 'user' | 'admin' | 'super_admin') => {
    toggleAdminMode(mode);
    if (mode === 'user') router.push('/dashboard');
    else if (mode === 'admin') router.push('/admin');
    else if (mode === 'super_admin') router.push('/super-admin');
  };

  return (
    <DropdownMenuContent align="end" className="w-64">
      <DropdownMenuLabel>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.photoURL} alt={userName} />
            <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 min-w-0 flex-1">
            <p className="text-sm font-semibold leading-none truncate">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/settings" className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/support" className="cursor-pointer">
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Support</span>
        </Link>
      </DropdownMenuItem>

      {/* Admin Mode Toggles */}
      {(isAdmin || isSuperAdmin) && (
        <>
          <DropdownMenuSeparator />

          {/* Exit Admin Mode */}
          {adminMode !== 'user' && (
            <DropdownMenuItem onClick={() => handleModeSwitch('user')} className="cursor-pointer">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span>{adminMode === 'super_admin' ? 'Exit Super Admin Mode' : 'Exit Admin Mode'}</span>
            </DropdownMenuItem>
          )}

          {/* Enter Admin Mode */}
          {adminMode !== 'admin' && (
            <DropdownMenuItem onClick={() => handleModeSwitch('admin')} className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              <span>Enter Admin Mode</span>
            </DropdownMenuItem>
          )}

          {/* Enter Super Admin Mode */}
          {isSuperAdmin && adminMode !== 'super_admin' && (
            <DropdownMenuItem onClick={() => handleModeSwitch('super_admin')} className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4 text-orange-600" />
              <span>Enter Super Admin Mode</span>
            </DropdownMenuItem>
          )}
        </>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
        <LogOut className="mr-2 h-4 w-4" />
        <span>Sign Out</span>
      </DropdownMenuItem>
      <div className="px-2 py-2 border-t">
        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </DropdownMenuContent>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isUserLoading } = useUser();
  const { signOut } = useAuthMethods();

  // Fetch user profile data using the same approach as dashboard
  const [profile, setProfile] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setIsProfileLoading(false);
        return;
      }

      try {
        const { getDashboardData } = await import('@/app/(app)/dashboard/actions');
        const result = await getDashboardData(user.id);

        if (result.success && result.data?.agentProfile) {
          setProfile(result.data.agentProfile);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  // Listen for profile updates dispatched elsewhere in the app (e.g. after uploading a new photo)
  useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const custom = ev as CustomEvent<any>;
        if (custom?.detail) {
          setProfile((prev: any) => ({ ...prev, ...custom.detail }));
        }
      } catch (err) {
        console.warn('Failed to apply profile update event', err);
      }
    };

    window.addEventListener('profileUpdated', handler as EventListener);
    return () => window.removeEventListener('profileUpdated', handler as EventListener);
  }, []);

  // Get user display name and initials
  // Try profile name first, then Cognito attributes, then email, then fallback to 'User'
  const userName = profile?.name ||
    user?.attributes?.name ||
    user?.attributes?.given_name ||
    user?.email?.split('@')[0] ||
    'User';
  // Extract first name from the full userName
  const firstName = userName.split(' ')[0];
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Scroll detection for header border
  useEffect(() => {
    const handleScroll = () => {
      // SidebarInset renders as <main> with overflow-y-auto, so it's the scroll container
      const scrollContainer = document.querySelector('main');
      const scrollTop = scrollContainer?.scrollTop || window.scrollY || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 10);
    };

    // Listen to both window scroll and main container scroll
    const scrollContainer = document.querySelector('main');

    const addScrollListeners = () => {
      window.addEventListener('scroll', handleScroll);
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll);
      }
    };

    const removeScrollListeners = () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };

    // Add listeners after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(addScrollListeners, 100);

    return () => {
      clearTimeout(timeoutId);
      removeScrollListeners();
    };
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      redirect('/login');
    }
  }, [isUserLoading, user]);

  if (isUserLoading || !user) {
    return <AppLoadingScreen />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <TooltipProvider>
      <AdminProvider>
        <AccessibilityProvider>
          <StickyHeaderProvider>
            <SubtleGradientMesh>
              <SidebarProvider>
                <Sidebar collapsible="icon">
                  <SidebarHeader>
                    <div className="flex items-center justify-between gap-2">
                      <Logo />
                    </div>
                  </SidebarHeader>
                  <SidebarContent>
                    <DynamicNavigation />
                  </SidebarContent>
                  <SidebarFooter>
                    <div className="space-y-3">
                      {/* Feedback Button */}
                      <div className="px-1">
                        <FeedbackButton />
                      </div>
                    </div>
                  </SidebarFooter>
                </Sidebar>
                <SidebarInset>
                  <ImpersonationBanner />
                  <header className={`sticky top-0 z-10 flex h-20 items-center justify-between px-4 md:px-6 -mx-4 md:-mx-6 bg-transparent backdrop-blur-xl transition-all duration-200 ${isScrolled ? 'border-b border-border/20' : ''}`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {isMounted && (
                        <>
                          <div className="md:hidden">
                            <SidebarTrigger>
                              <PanelLeft />
                            </SidebarTrigger>
                          </div>
                          <div className="hidden md:block">
                            <SidebarToggle tooltip="Toggle Sidebar" />
                          </div>
                        </>
                      )}
                      {/* Sticky Page Title */}
                      <StickyHeaderTitle />
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Admin Mode Badge */}
                      <AdminModeBadge />
                      {/* Notifications Center - Temporarily disabled due to infinite loop */}
                      {false && user && (
                        <NotificationCenter
                          userId={user?.id || ''}
                          className="h-9 w-9 rounded-full hover:bg-accent"
                        />
                      )}

                      {/* User Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="flex items-center gap-3 h-10 px-2 pr-3 rounded-full hover:bg-accent transition-colors"
                          >
                            <Avatar className="h-8 w-8 ring-2 ring-background shadow-sm">
                              <AvatarImage src={profile?.photoURL} alt={userName} />
                              <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                                {getInitials(userName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="hidden sm:flex flex-col items-start min-w-0">
                              <span className="text-sm font-medium leading-tight truncate max-w-[120px] button-text-hover">
                                {firstName}
                              </span>
                              <span className="text-xs text-muted-foreground leading-tight mt-0.5">
                                Agent
                              </span>
                            </div>
                          </Button>
                        </DropdownMenuTrigger>
                        <UserDropdownContent
                          profile={profile}
                          user={user}
                          userName={userName}
                          getInitials={getInitials}
                          handleSignOut={handleSignOut}
                        />
                      </DropdownMenu>
                    </div>
                  </header>
                  <main className="flex-1 w-full p-4 md:p-6">
                    <PageTransition>{children}</PageTransition>
                  </main>
                </SidebarInset>
              </SidebarProvider>
            </SubtleGradientMesh>
          </StickyHeaderProvider>
        </AccessibilityProvider>
      </AdminProvider>
    </TooltipProvider >
  );
}
