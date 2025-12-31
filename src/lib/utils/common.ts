import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns"

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

/**
 * Format a number as currency (USD)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number with commas for thousands
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatDate(timestamp: number | Date | string): string {
  try {
    let date: Date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      date = timestamp;
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Format a time as HH:MM AM/PM
 */
export function formatTime(timestamp: number | Date | string): string {
  try {
    let date: Date;
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      date = timestamp;
    }
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return 'Unknown';
  }
}
