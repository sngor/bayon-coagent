
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
} from 'lucide-react';
import {
  HouseIcon,
  AISparkleIcon,
} from '@/components/ui/real-estate-icons';
import Link from 'next/link';
import { usePathname, redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser, useAuthMethods } from '@/aws/auth/use-user';
import { PageTransition } from '@/components/page-transition';
import { TooltipProvider } from '@/contexts/tooltip-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useItem } from '@/aws/dynamodb/hooks';
import { getAgentProfileKeys } from '@/aws/dynamodb/keys';
import { SessionLoading } from '@/components/session-loading';

const navItems = [
  { href: '/dashboard', icon: HouseIcon, label: 'Dashboard', customIcon: true },
  { href: '/assistant', icon: MessageSquare, label: 'Chat' },
  { href: '/studio', icon: Wand2, label: 'Studio' },
  { href: '/brand', icon: Target, label: 'Brand' },
  { href: '/market', icon: AISparkleIcon, label: 'Market', customIcon: true },
  { href: '/library', icon: Library, label: 'Library' },
  { href: '/training', icon: GraduationCap, label: 'Training' },
];

function AppLoadingScreen() {
  return <SessionLoading />;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const { user, isUserLoading } = useUser();
  const { signOut } = useAuthMethods();
  const [showStickyTitle, setShowStickyTitle] = useState(false);
  const [pageTitle, setPageTitle] = useState<string>('');

  // Fetch user profile data
  const profileKeys = user ? getAgentProfileKeys(user.id, 'main') : null;
  const { data: profileData, refetch: refetchProfile } = useItem(profileKeys?.PK, profileKeys?.SK);
  const profile = profileData?.Data;

  // Get user display name and initials
  const userName = profile?.name || 'User';
  const firstName = profile?.name ? profile.name.split(' ')[0] : 'User';
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

  // Extract page title and handle scroll detection - optimized with RAF
  useEffect(() => {
    let rafId: number | null = null;
    let timeoutId: NodeJS.Timeout;

    const updateTitle = () => {
      const mainElement = document.querySelector('main');
      if (mainElement) {
        const h1 = mainElement.querySelector('h1');
        if (h1) {
          const title = h1.textContent || '';
          setPageTitle(title);
        } else {
          setPageTitle('');
        }
      }
    };

    const checkScroll = () => {
      if (rafId) return; // Throttle with RAF

      rafId = requestAnimationFrame(() => {
        const mainElement = document.querySelector('main');
        if (!mainElement) {
          rafId = null;
          return;
        }

        const h1 = mainElement.querySelector('h1');
        if (!h1) {
          setShowStickyTitle(false);
          rafId = null;
          return;
        }

        const rect = h1.getBoundingClientRect();
        const shouldShow = rect.bottom < 100;
        setShowStickyTitle(shouldShow);
        rafId = null;
      });
    };

    // Update title when pathname changes
    timeoutId = setTimeout(() => {
      updateTitle();
      checkScroll();
    }, 100); // Reduced from 300ms

    // Listen for scroll events on the main element (SidebarInset)
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.addEventListener('scroll', checkScroll, { passive: true });

      // Also observe DOM changes to catch dynamically rendered titles
      const observer = new MutationObserver(() => {
        updateTitle();
        checkScroll();
      });
      observer.observe(mainElement, { childList: true, subtree: true });

      return () => {
        clearTimeout(timeoutId);
        if (rafId) cancelAnimationFrame(rafId);
        mainElement.removeEventListener('scroll', checkScroll);
        observer.disconnect();
      };
    }

    return () => {
      clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
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
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center justify-between gap-2">
              <Logo />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      {item.customIcon ? (
                        <item.icon animated={false} className="w-5 h-5" />
                      ) : (
                        <item.icon />
                      )}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <div className="px-3 py-2 text-xs text-muted-foreground space-y-1 group-data-[state=collapsed]/sidebar-wrapper:hidden">
              <div className="flex gap-3 justify-center">
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms
                </Link>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-20 items-center justify-between px-4 mx-3 mt-3 mb-0 bg-background/80 dark:bg-background/40 backdrop-blur-xl rounded-t-xl">
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
              {showStickyTitle && pageTitle && (
                <div className="ml-2 transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-left-2">
                  <h2 className="text-lg font-semibold font-headline truncate whitespace-nowrap">
                    {pageTitle}
                  </h2>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
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
                      <span className="text-sm font-medium leading-none truncate max-w-[120px]">
                        {firstName}
                      </span>
                      <span className="text-xs text-muted-foreground leading-none mt-1">
                        Agent
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
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
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
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

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="p-4 md:p-8 lg:p-10">
            <PageTransition>{children}</PageTransition>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider >
  );
}
