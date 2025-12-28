// Centralized constants for better maintainability
export const SIDEBAR_CONSTANTS = {
  COOKIE_NAME: "sidebar_state",
  COOKIE_MAX_AGE: 60 * 60 * 24 * 7, // 7 days
  WIDTH: "14rem",
  WIDTH_MOBILE: "calc(100vw - 3rem)",
  WIDTH_ICON: "3.5rem",
  KEYBOARD_SHORTCUT: "b",
} as const

export const SIDEBAR_CSS_VARS = {
  "--sidebar-width": SIDEBAR_CONSTANTS.WIDTH,
  "--sidebar-width-icon": SIDEBAR_CONSTANTS.WIDTH_ICON,
} as React.CSSProperties

// Extracted CSS class constants for better maintainability
export const SIDEBAR_MENU_BUTTON_CLASSES = {
  base: "peer/menu-button relative flex w-full items-center overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring",
  transitions: "transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
  interactions: "active:bg-primary/15 active:scale-[0.98]",
  disabled: "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
  groupInteractions: [
    "group-has-[[data-sidebar=menu-action]]/menu-item:pr-8",
    "data-[state=open]:hover:bg-sidebar-accent",
    "data-[state=open]:hover:text-sidebar-accent-foreground"
  ].join(" "),
  collapsed: [
    "group-data-[state=collapsed]/sidebar-wrapper:justify-center",
    "group-data-[state=collapsed]/sidebar-wrapper:!px-0",
    "group-data-[state=collapsed]/sidebar-wrapper:!mx-auto",
    "group-data-[state=collapsed]/sidebar-wrapper:w-full",
    "group-data-[state=collapsed]/sidebar-wrapper:flex"
  ].join(" "),
  expanded: "group-data-[state=expanded]/sidebar-wrapper:gap-3 md:group-data-[state=expanded]/sidebar-wrapper:gap-3 gap-4 md:gap-3",
  childElements: [
    "[&>span:last-child]:group-data-[state=collapsed]/sidebar-wrapper:opacity-0",
    "[&>span:last-child]:truncate",
    "[&>svg]:size-5",
    "[&>svg]:shrink-0",
    "[&>svg]:group-data-[state=collapsed]/sidebar-wrapper:mx-auto",
    "[&>svg]:group-data-[state=collapsed]/sidebar-wrapper:block"
  ].join(" "),
  active: [
    "data-[active=true]:bg-blue-50",
    "data-[active=true]:text-blue-900",
    "data-[active=true]:font-extrabold",
    "data-[active=true]:shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.05)]",
    "dark:data-[active=true]:bg-blue-950/50",
    "dark:data-[active=true]:text-blue-100"
  ].join(" ")
} as const

export type SidebarState = "expanded" | "collapsed"
export type SidebarSide = "left" | "right"
export type SidebarVariant = "sidebar" | "floating" | "inset"
export type SidebarCollapsible = "offcanvas" | "icon" | "none"