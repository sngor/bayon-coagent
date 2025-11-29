
'use client';

import { cn } from "@/lib/utils/common";
import { useSidebar } from "./ui/sidebar";

export function Logo({ className }: { className?: string }) {
  // Safely access the sidebar context. It will be null on pages without a SidebarProvider.
  const sidebar = useSidebar();
  const state = sidebar?.state;

  return (
    <div className={cn("flex items-center font-headline overflow-hidden", className)}>
      {state === 'collapsed' ? (
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-xl">
          B
        </div>
      ) : (
        <span className="text-xl font-bold transition-all duration-200 whitespace-nowrap">
          Bayon Coagent
        </span>
      )}
    </div>
  );
}
