// Accessibility utilities for sidebar components
export const SIDEBAR_ARIA_LABELS = {
  sidebar: "Main navigation sidebar",
  toggle: "Toggle sidebar",
  menu: "Navigation menu",
  menuItem: "Navigation item",
  menuButton: "Navigation button",
  expandedState: "Sidebar expanded",
  collapsedState: "Sidebar collapsed",
} as const

export const SIDEBAR_KEYBOARD_SHORTCUTS = {
  toggle: "Ctrl+B",
  escape: "Escape",
  enter: "Enter",
  space: "Space",
  arrowUp: "ArrowUp",
  arrowDown: "ArrowDown",
  home: "Home",
  end: "End",
} as const

// Keyboard navigation handler
export function handleSidebarKeyNavigation(
  event: React.KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  onNavigate: (index: number) => void
) {
  switch (event.key) {
    case SIDEBAR_KEYBOARD_SHORTCUTS.arrowUp:
      event.preventDefault()
      onNavigate(currentIndex > 0 ? currentIndex - 1 : totalItems - 1)
      break
    case SIDEBAR_KEYBOARD_SHORTCUTS.arrowDown:
      event.preventDefault()
      onNavigate(currentIndex < totalItems - 1 ? currentIndex + 1 : 0)
      break
    case SIDEBAR_KEYBOARD_SHORTCUTS.home:
      event.preventDefault()
      onNavigate(0)
      break
    case SIDEBAR_KEYBOARD_SHORTCUTS.end:
      event.preventDefault()
      onNavigate(totalItems - 1)
      break
  }
}

// Focus management utilities
export function focusNextSidebarItem(currentElement: HTMLElement) {
  const sidebar = currentElement.closest('[data-sidebar="sidebar"]')
  if (!sidebar) return

  const menuButtons = sidebar.querySelectorAll('[data-sidebar="menu-button"]')
  const currentIndex = Array.from(menuButtons).indexOf(currentElement)
  const nextIndex = (currentIndex + 1) % menuButtons.length
  
  const nextButton = menuButtons[nextIndex] as HTMLElement
  nextButton?.focus()
}

export function focusPreviousSidebarItem(currentElement: HTMLElement) {
  const sidebar = currentElement.closest('[data-sidebar="sidebar"]')
  if (!sidebar) return

  const menuButtons = sidebar.querySelectorAll('[data-sidebar="menu-button"]')
  const currentIndex = Array.from(menuButtons).indexOf(currentElement)
  const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuButtons.length - 1
  
  const prevButton = menuButtons[prevIndex] as HTMLElement
  prevButton?.focus()
}