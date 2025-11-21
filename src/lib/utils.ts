import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Sticky positioning utilities for hub pages
export const STICKY_POSITIONS = {
  // For elements that should stick below the topbar (80px)
  BELOW_TOPBAR: 'top-20',
  // For elements that should stick below hub tabs (144px = 80px topbar + ~64px tabs)
  BELOW_HUB_TABS: 'top-36',
  // For elements that should stick at the very top
  TOP: 'top-0',
} as const
