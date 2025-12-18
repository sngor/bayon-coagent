
'use client';

import { Logo } from '@/components/logo';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
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
  PanelLeft,
  LogOut,
  Settings,
  HelpCircle,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser, useAuthMethods } from '@/aws/auth/use-user';
import { PageTransition } from '@/components/page-transition';
import { TooltipProvider } from '@/contexts/tooltip-context';
import { AdminProvider, useAdmin } from '@/contexts/admin-context';
import { AccessibilityProvider, useAccessibility } from '@/contexts/accessibility-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StickyHeaderProvider, useStickyHeader } from '@/hooks/use-sticky-header';

import { SessionLoading } from '@/components/session-loading';
import { FeedbackButton } from '@/components/feedback-button';
import { DynamicNavigation } from '@/components/dynamic-navigation';
import { NotificationCenter } from '@/lib/notifications/components';
import { SubtleGradientMesh } from '@/components/ui/gradient-mesh';
import { ImpersonationBanner } from '@/components/impersonation-banner';
import { RoleBadge } from '@/components/admin/role-badge';
import { UserRole } from '@/aws/dynamodb/admin-types';

function AppLoadingScreen() {
  return <SessionLoading />;
}

function ContentWrapper({ children }: { children: React.ReactNode }) {
  const { preferences } = useAccessibility();

  return (
    <div className={preferences.fullWidth ? '' : 'max-w-6xl mx-auto'}>
      {children}
    </div>
  );
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

function AdminModeControls({
  isAdmin,
  isSuperAdmin,
  adminMode,
  onModeSwitch
}: {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  adminMode: 'user' | 'admin' | 'super_admin';
  onModeSwitch: (mode: 'user' | 'admin' | 'super_admin') => void;
}) {
  if (!isAdmin && !isSuperAdmin) return null;

  return (
    <>
      <DropdownMenuSeparator />

      {/* Exit Admin Mode */}
      {adminMode !== 'user' && (
        <DropdownMenuItem onClick={() => onModeSwitch('user')} className="cursor-pointer">
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span>{adminMode === 'super_admin' ? 'Exit Super Admin Mode' : 'Exit Admin Mode'}</span>
        </DropdownMenuItem>
      )}

      {/* Enter Admin Mode */}
      {adminMode !== 'admin' && (
        <DropdownMenuItem onClick={() => onModeSwitch('admin')} className="cursor-pointer">
          <Shield className="mr-2 h-4 w-4" />
          <span>Enter Admin Mode</span>
        </DropdownMenuItem>
      )}

      {/* Enter Super Admin Mode */}
      {isSuperAdmin && adminMode !== 'super_admin' && (
        <DropdownMenuItem onClick={() => onModeSwitch('super_admin')} className="cursor-pointer">
          <Shield className="mr-2 h-4 w-4 text-orange-600" />
          <span>Enter Super Admin Mode</span>
        </DropdownMenuItem>
      )}
    </>
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



  const handleModeSwitch = (mode: 'user' | 'admin' | 'super_admin') => {
    toggleAdminMode(mode);
    if (mode === 'user') router.push('/dashboard');
    else if (mode === 'admin') router.push('/admin');
    else if (mode === 'super_admin') router.push('/super-admin');
  };

  // Get user role for badge display
  const userRole = (isAdmin || isSuperAdmin)
    ? (isSuperAdmin ? 'superadmin' : 'admin')
    : 'user';

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
            {/* Role Badge */}
            {(isAdmin || isSuperAdmin) && (
              <div className="mt-1">
                <RoleBadge role={userRole as UserRole} size="sm" />
              </div>
            )}
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

      {/* Admin Dashboard Links */}
      {(isAdmin || isSuperAdmin) && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/admin" className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4 text-blue-600" />
              <span>Admin Panel</span>
            </Link>
          </DropdownMenuItem>
          {isSuperAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/super-admin" className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4 text-orange-600" />
                <span>Super Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          )}
        </>
      )}

      {/* Admin Mode Toggles */}
      <AdminModeControls
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
        adminMode={adminMode}
        onModeSwitch={handleModeSwitch}
      />
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
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isUserLoading } = useUser();
  const { signOut } = useAuthMethods();

  // Fetch user profile data using the same approach as dashboard
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
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
                    <div className="flex items-center gap-3 mr-2 md:mr-4">
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
                    <ContentWrapper>
                      <PageTransition>{children}</PageTransition>
                    </ContentWrapper>
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
