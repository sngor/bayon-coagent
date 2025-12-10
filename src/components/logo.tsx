
'use client';

import { cn } from "@/lib/utils/common";
import { useSidebar } from "./ui/sidebar";
import Image from "next/image";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  // Safely access the sidebar context. It will be null on pages without a SidebarProvider.
  const sidebar = useSidebar();
  const state = sidebar?.state;

  const LogoImage = ({ size }: { size: number }) => (
    <Image
      src="/logo.png"
      alt="Bayon Coagent"
      width={size}
      height={size}
      className="w-full h-full object-contain"
      priority
      onError={(e) => {
        // Fallback to text if image fails to load
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        if (target.parentElement) {
          target.parentElement.innerHTML = '<div class="w-full h-full bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold text-xl">B</div>';
        }
      }}
    />
  );

  return (
    <div className={cn("flex items-center font-headline overflow-hidden", className)}>
      {state === 'collapsed' ? (
        <div className="flex items-center justify-center w-9 h-9 rounded-lg overflow-hidden">
          <LogoImage size={36} />
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <LogoImage size={32} />
          </div>
          <span className="text-xl font-bold transition-all duration-200 whitespace-nowrap">
            Bayon Coagent
          </span>
        </div>
      )}
    </div>
  );
}
