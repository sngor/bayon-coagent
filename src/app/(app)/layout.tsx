
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
import { useEffect, useState } from 'react';
import { useUser, useAuthMethods } from '@/aws/auth/use-user';
import { PageTransition } from '@/components/page-transition';
import { TooltipProvider } from '@/contexts/tooltip-context';
import { AdminProvider, useAdmin } from '@/contexts/admin-context';
import { AccessibilityProvider } from '@/contexts/accessibility-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { SessionLoading } from '@/components/session-loading';
import { FeedbackButton } from '@/components/feedback-button';
import { DynamicNavigation } from '@/components/dynamic-navigation';
import { useFeatureToggle } from '@/lib/feature-toggles';

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
              {item.customIcon ? (
                <item.icon animated={false} className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
              ) : (
                <item.icon className="transition-transform duration-200 group-hover:scale-110" />
              )}
              <span className="button-text-hover">{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
}

function AdminModeBadge() {
  const { isAdminMode } = useAdmin();

  if (!isAdminMode) return null;

  return (
    <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-400">
      <Shield className="h-3 w-3 mr-1" />
      Admin Mode
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
  const { isAdmin, isAdminMode, toggleAdminMode } = useAdmin();
  const router = useRouter();

  const handleAdminModeToggle = () => {
    toggleAdminMode();

    // Navigate to appropriate dashboard based on the new mode
    if (isAdminMode) {
      // Currently in admin mode, switching to regular mode
      router.push('/dashboard');
    } else {
      // Currently in regular mode, switching to admin mode
      router.push('/admin');
    }
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
      {isAdmin && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleAdminModeToggle} className="cursor-pointer">
            {isAdminMode ? (
              <>
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span>Exit Admin Mode</span>
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                <span>Enter Admin Mode</span>
              </>
            )}
          </DropdownMenuItem>
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
  const { user, isUserLoading } = useUser();
  const { signOut } = useAuthMethods();
  const [showStickyTitle, setShowStickyTitle] = useState(false);
  const [pageTitle, setPageTitle] = useState<string>('');

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

  // Temporarily disable title detection to prevent infinite re-renders
  // TODO: Re-implement with a more stable approach
  useEffect(() => {
    // Reset title state on pathname change
    setPageTitle('');
    setShowStickyTitle(false);
  }, [pathname]);

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
              <header className="sticky top-0 z-10 flex h-20 items-center justify-between px-4 mx-3 mt-3 mb-0 bg-transparent backdrop-blur-xl">
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
                  {/* Sticky Page Title - Temporarily disabled */}
                  <div className="opacity-0 pointer-events-none">
                    <h2 className="text-lg font-semibold font-headline truncate whitespace-nowrap">
                      {pageTitle}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Admin Mode Badge */}
                  <AdminModeBadge />
                  {/* Notifications Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full hover:bg-accent relative"
                    asChild
                  >
                    <Link href="/notifications">
                      <Bell className="h-5 w-5" />
                      {/* Notification Badge - uncomment when you have unread notifications */}
                      {/* <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" /> */}
                      <span className="sr-only">Notifications</span>
                    </Link>
                  </Button>

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
              <main className="p-4 md:p-8 lg:p-10">
                <PageTransition>{children}</PageTransition>
              </main>
            </SidebarInset>
          </SidebarProvider>
        </AccessibilityProvider>
      </AdminProvider>
    </TooltipProvider >
  );
}
