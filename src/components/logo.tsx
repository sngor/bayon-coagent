
'use client';

import { cn } from "@/lib/utils";
import { useSidebar } from "./ui/sidebar";

export function Logo({ className }: { className?: string }) {
    // Safely access the sidebar context. It will be null on pages without a SidebarProvider.
    const sidebar = useSidebar();
    const state = sidebar?.state;
    
  return (
    <div className={cn("flex items-center gap-2 font-headline", className)}>
        <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
        >
            <path
            d="M4 14L16 2L28 14V28C28 28.5304 27.7893 29.0391 27.4142 29.4142C27.0391 29.7893 26.5304 30 26 30H6C5.46957 30 4.96086 29.7893 4.58579 29.4142C4.21071 29.0391 4 28.5304 4 28V14Z"
            fill="currentColor"
            stroke="hsl(var(--sidebar-background))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            />
            <path
            d="M12 20H20V30H12V20Z"
            fill="hsl(var(--sidebar-background))"
            stroke="hsl(var(--sidebar-background))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            />
        </svg>
        <span className={cn("text-xl font-bold transition-opacity duration-200", state === 'collapsed' ? 'opacity-0' : 'opacity-100')}>Co-agent Marketer</span>
    </div>
  );
}
