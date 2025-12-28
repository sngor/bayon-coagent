import { VariantProps } from "class-variance-authority"
import { TooltipContent } from "@/components/ui/tooltip"
import { sidebarMenuButtonVariants } from "./sidebar-menu-variants"
import type { SidebarState, SidebarSide, SidebarVariant, SidebarCollapsible } from './sidebar-constants'

// Enhanced type definitions for better type safety
export interface SidebarContextValue {
  state: SidebarState
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
  side: SidebarSide
}

export interface SidebarProviderProps extends React.ComponentProps<"div"> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export interface SidebarMenuButtonProps extends 
  React.ComponentProps<"button">,
  VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
}

export interface SidebarMenuItemProps extends React.ComponentProps<"li"> {}

export interface SidebarMenuProps extends React.ComponentProps<"ul"> {}

// Re-export types from constants for convenience
export type { SidebarState, SidebarSide, SidebarVariant, SidebarCollapsible } from './sidebar-constants'