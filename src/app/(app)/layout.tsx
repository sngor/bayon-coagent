
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
  Home,
  User,
  BookText,
  PanelLeft,
  LogOut,
  ShieldCheck,
  Users,
  BrainCircuit,
  Plug,
  GraduationCap,
  Settings,
  Loader2,
  Folder,
  Library,
  Target,
  FileText,
  TrendingUp,
  HeartPulse,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useUser, useAuthMethods } from '@/aws/auth/use-user';
import { PageTransition } from '@/components/page-transition';
import { TooltipProvider } from '@/contexts/tooltip-context';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/marketing-plan', icon: Target, label: 'Marketing Plan' },
  { href: '/brand-audit', icon: ShieldCheck, label: 'Brand Audit' },
  { href: '/competitive-analysis', icon: Users, label: 'Competitive Analysis' },
  { href: '/content-engine', icon: BookText, label: 'Content Engine' },
  { href: '/research-agent', icon: BrainCircuit, label: 'Research Agent' },
  { href: '/projects', icon: Folder, label: 'Projects' },
  { href: '/knowledge-base', icon: Library, label: 'Knowledge Base' },
  { href: '/training-hub', icon: GraduationCap, label: 'Training Hub' },
  { href: '/integrations', icon: Plug, label: 'Integrations' },
  { href: '/listing-description-generator', icon: FileText, label: 'Listing Description Generator' },
  { href: '/investment-opportunity-identification', icon: TrendingUp, label: 'Investment Opportunity' },
  { href: '/life-event-predictor', icon: HeartPulse, label: 'Life Event Predictor' },
];

function AppLoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Initializing your dashboard...</p>
      </div>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const { user, isUserLoading } = useUser();
  const { signOut } = useAuthMethods();

  useEffect(() => {
    setIsMounted(true);
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
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center justify-between">
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
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarToggle tooltip="Collapse" />
          <SidebarFooter>
            <div className="p-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/profile')} tooltip="Profile">
                    <Link href="/profile">
                      <User />
                      <span>Profile</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/settings')} tooltip="Settings">
                    <Link href="/settings">
                      <Settings />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
                    <LogOut />
                    <span>Sign Out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center justify-end md:justify-end px-4 border-b bg-background/80 backdrop-blur-sm">
            {isMounted && (
              <div className="md:hidden">
                <SidebarTrigger>
                  <PanelLeft />
                </SidebarTrigger>
              </div>
            )}
          </header>
          <main className="p-4 md:p-8 lg:p-10">
            <PageTransition>{children}</PageTransition>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
