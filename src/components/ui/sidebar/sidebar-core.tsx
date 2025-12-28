"use client"

import * as React from "react"
import { cn } from "@/lib/utils/common"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useSidebar } from "./sidebar-provider"
import { SIDEBAR_CONSTANTS } from "./sidebar-constants"

interface SidebarProps extends React.ComponentProps<"div"> {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === "none") {
      return isMobile ? (
        <MobileSidebar
          side={side}
          openMobile={openMobile}
          setOpenMobile={setOpenMobile}
          {...props}
        >
          {children}
        </MobileSidebar>
      ) : (
        <DesktopSidebar
          ref={ref}
          side={side}
          className={className}
          {...props}
        >
          {children}
        </DesktopSidebar>
      )
    }

    return isMobile ? (
      <MobileSidebar
        side={side}
        openMobile={openMobile}
        setOpenMobile={setOpenMobile}
        {...props}
      >
        {children}
      </MobileSidebar>
    ) : (
      <CollapsibleDesktopSidebar
        ref={ref}
        side={side}
        state={state}
        className={className}
        {...props}
      >
        {children}
      </CollapsibleDesktopSidebar>
    )
  }
)
Sidebar.displayName = "Sidebar"

// Extracted mobile sidebar component
const MobileSidebar: React.FC<{
  side: "left" | "right"
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  children: React.ReactNode
}> = ({ side, openMobile, setOpenMobile, children, ...props }) => (
  <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
    <SheetContent
      data-sidebar="sidebar"
      data-mobile="true"
      className="w-[--sidebar-width] h-[calc(100vh-3rem)] bg-transparent p-0 text-sidebar-foreground border-none top-6 left-6 right-6 bottom-6"
      style={{
        "--sidebar-width": SIDEBAR_CONSTANTS.WIDTH_MOBILE,
      } as React.CSSProperties}
      side={side}
      onSwipeClose={() => setOpenMobile(false)}
    >
      <SheetHeader className="sr-only">
        <SheetTitle>Sidebar Menu</SheetTitle>
      </SheetHeader>
      <div className="flex h-full w-full flex-col bg-sidebar border border-sidebar-border rounded-xl overflow-y-auto shadow-lg">
        {children}
      </div>
    </SheetContent>
  </Sheet>
)

// Extracted desktop sidebar component
const DesktopSidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"aside"> & { side: "left" | "right" }
>(({ side, className, children, ...props }, ref) => (
  <aside
    ref={ref}
    className={cn(
      "group peer fixed inset-y-0 z-20 hidden md:flex flex-col text-sidebar-foreground",
      side === 'left' ? "left-0 border-r" : "right-0 border-l",
      "w-[--sidebar-width] bg-sidebar border-sidebar-border",
      className
    )}
    {...props}
  >
    <div data-sidebar="sidebar" className="flex h-full w-full flex-col">
      {children}
    </div>
  </aside>
))
DesktopSidebar.displayName = "DesktopSidebar"

// Extracted collapsible desktop sidebar component
const CollapsibleDesktopSidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"aside"> & { 
    side: "left" | "right"
    state: "expanded" | "collapsed"
  }
>(({ side, state, className, children, ...props }, ref) => (
  <aside
    ref={ref}
    className={cn(
      "group peer fixed z-20 hidden md:flex flex-col text-sidebar-foreground overflow-visible",
      side === 'left' ? "left-3" : "right-3",
      "top-3 bottom-3",
      "transition-[width] duration-200 ease-linear",
      "w-[--sidebar-width] data-[state=collapsed]:w-[var(--sidebar-width-icon)]",
      className
    )}
    data-state={state}
    {...props}
  >
    <div
      data-sidebar="sidebar"
      className="flex h-full w-full flex-col bg-sidebar border border-sidebar-border rounded-xl overflow-y-auto shadow-lg"
    >
      {children}
    </div>
  </aside>
))
CollapsibleDesktopSidebar.displayName = "CollapsibleDesktopSidebar"