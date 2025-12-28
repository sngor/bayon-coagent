import { cva } from "class-variance-authority"
import { SIDEBAR_MENU_BUTTON_CLASSES } from "./sidebar-constants"

// Centralized menu styling variants for better maintainability
export const sidebarMenuVariants = cva([
  "flex w-full min-h-0 flex-col gap-1 p-2"
], {
  variants: {
    variant: {
      default: "",
      compact: "gap-0.5 p-1",
      spacious: "gap-2 p-3"
    }
  },
  defaultVariants: {
    variant: "default"
  }
})

export const sidebarMenuItemVariants = cva([
  "group/menu-item relative"
], {
  variants: {
    variant: {
      default: "",
      highlighted: "bg-sidebar-accent/10 rounded-md",
      active: "bg-sidebar-accent rounded-md"
    }
  },
  defaultVariants: {
    variant: "default"
  }
})

export const sidebarMenuButtonVariants = cva([
  SIDEBAR_MENU_BUTTON_CLASSES.base,
  SIDEBAR_MENU_BUTTON_CLASSES.transitions,
  SIDEBAR_MENU_BUTTON_CLASSES.interactions,
  SIDEBAR_MENU_BUTTON_CLASSES.disabled,
  SIDEBAR_MENU_BUTTON_CLASSES.groupInteractions,
  SIDEBAR_MENU_BUTTON_CLASSES.collapsed,
  SIDEBAR_MENU_BUTTON_CLASSES.expanded,
  SIDEBAR_MENU_BUTTON_CLASSES.childElements,
  SIDEBAR_MENU_BUTTON_CLASSES.active,
],
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-ring))]",
      },
      size: {
        default: "h-11 text-sm min-h-[44px]",
        sm: "h-9 text-xs min-h-[36px]",
        lg: "h-12 text-sm min-h-[48px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export const sidebarMenuActionVariants = cva([
  "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0"
], {
  variants: {
    variant: {
      default: "",
      ghost: "hover:bg-transparent",
      subtle: "hover:bg-sidebar-accent/50"
    }
  },
  defaultVariants: {
    variant: "default"
  }
})

// Sub-menu specific variants
export const sidebarMenuSubVariants = cva([
  "mx-3.5 flex min-h-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5"
], {
  variants: {
    variant: {
      default: "",
      compact: "mx-2 px-1.5",
      spacious: "mx-4 px-3"
    }
  },
  defaultVariants: {
    variant: "default"
  }
})