
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
  Calculator,
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
  { href: '/tools', icon: Calculator, label: 'Tools' },
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

  // Extract page title and handle scroll detection - using IntersectionObserver for reliability
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let intersectionObserver: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let retryCount = 0;
    const maxRetries = 15;

    const findAndSetupTitle = () => {
      const mainElement = document.querySelector('main');
      if (!mainElement) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(findAndSetupTitle, 100 * retryCount);
        }
        return;
      }

      // Look for h1 in multiple possible locations
      const h1 = mainElement.querySelector('h1') ||
        document.querySelector('[data-page-title]') ||
        mainElement.querySelector('[role="heading"][aria-level="1"]');

      if (!h1) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(findAndSetupTitle, 100 * retryCount);
        } else {
          setPageTitle('');
          setShowStickyTitle(false);
        }
        return;
      }

      // Extract title
      const title = h1.textContent || h1.getAttribute('data-page-title') || '';
      setPageTitle(title);
      retryCount = 0;

      // Clean up existing observer
      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }

      // Set up IntersectionObserver for more reliable scroll detection
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // Show sticky title when h1 is not intersecting (scrolled out of view)
            setShowStickyTitle(!entry.isIntersecting);
          });
        },
        {
          root: mainElement,
          rootMargin: '-80px 0px 0px 0px', // Trigger when h1 is 80px from top
          threshold: 0
        }
      );

      intersectionObserver.observe(h1);
    };

    // Initial setup with delay for page transitions
    timeoutId = setTimeout(findAndSetupTitle, 150);

    // Set up MutationObserver to detect when new content is added
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mutationObserver = new MutationObserver((mutations) => {
        let shouldRetry = false;
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                if (element.tagName === 'H1' || element.querySelector('h1') || element.hasAttribute('data-page-title')) {
                  shouldRetry = true;
                }
              }
            });
          }
        });

        if (shouldRetry) {
          retryCount = 0; // Reset retry count
          setTimeout(findAndSetupTitle, 100);
        }
      });

      mutationObserver.observe(mainElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-page-title']
      });
    }

    return () => {
      clearTimeout(timeoutId);
      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
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
              <div className={`ml-2 transition-all duration-300 ease-in-out ${showStickyTitle && pageTitle
                ? 'opacity-100 translate-x-0'
                : 'opacity-0 -translate-x-2 pointer-events-none'
                }`}>
                <h2 className="text-lg font-semibold font-headline truncate whitespace-nowrap">
                  {pageTitle}
                </h2>
              </div>
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
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
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
