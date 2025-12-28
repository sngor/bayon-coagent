"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils/common"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SIDEBAR_CONSTANTS, SIDEBAR_CSS_VARS, SidebarState, SidebarSide } from './sidebar-constants'

export type SidebarContext = {
  state: SidebarState
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
  side: SidebarSide
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProviderProps extends React.ComponentProps<"div"> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const SidebarProvider = React.forwardRef<HTMLDivElement, SidebarProviderProps>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)
    const [side] = React.useState<SidebarSide>("left")

    // Internal state management
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    
    // Memoize setOpen to prevent unnecessary re-renders
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }

        // Persist sidebar state in cookie
        document.cookie = `${SIDEBAR_CONSTANTS.COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_CONSTANTS.COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    // Memoize toggle function
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open)
    }, [isMobile, setOpen, setOpenMobile])

    // Keyboard shortcut handler
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_CONSTANTS.KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    const state: SidebarState = open ? "expanded" : "collapsed"

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
        side,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar, side]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            className={cn(
              "group/sidebar-wrapper w-full",
              "[--sidebar-width:14rem] [--sidebar-width-icon:3.5rem]",
              className
            )}
            ref={ref}
            data-state={state}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)

SidebarProvider.displayName = "SidebarProvider"