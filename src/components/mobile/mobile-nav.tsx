"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils/common"
import { triggerHapticFeedback } from "@/lib/mobile-optimization"

interface NavItem {
    label: string
    href: string
    icon: LucideIcon
    badge?: number
}

interface MobileNavProps {
    items: NavItem[]
    className?: string
}

/**
 * Mobile bottom navigation bar
 * 
 * Features:
 * - Fixed bottom position
 * - Touch-optimized targets (44px min)
 * - Active state indication
 * - Badge support for notifications
 * - Haptic feedback
 * 
 * Requirements: 4.1, 8.3
 */
export function MobileNav({ items, className }: MobileNavProps) {
    const pathname = usePathname()

    return (
        <nav
            className={cn(
                "fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-lg",
                "safe-area-inset-bottom", // iOS safe area support
                className
            )}
        >
            <div className="flex items-center justify-around px-2 py-2">
                {items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => triggerHapticFeedback(10)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all touch-manipulation min-h-[44px] min-w-[44px]",
                                isActive
                                    ? "text-primary bg-primary/10"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <div className="relative">
                                <Icon className="h-5 w-5" />
                                {item.badge !== undefined && item.badge > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                                        {item.badge > 9 ? "9+" : item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}

interface MobileNavDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
    className?: string
}

/**
 * Mobile navigation drawer (hamburger menu)
 * 
 * Requirements: 4.1, 8.3
 */
export function MobileNavDrawer({
    open,
    onOpenChange,
    children,
    className,
}: MobileNavDrawerProps) {
    const [touchStart, setTouchStart] = React.useState<number | null>(null)
    const [touchEnd, setTouchEnd] = React.useState<number | null>(null)

    const minSwipeDistance = 50

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
    }

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return

        const distance = touchStart - touchEnd
        const isLeftSwipe = distance > minSwipeDistance

        if (isLeftSwipe && open) {
            onOpenChange(false)
            triggerHapticFeedback(10)
        }
    }

    React.useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }

        return () => {
            document.body.style.overflow = ""
        }
    }, [open])

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
                    open ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => onOpenChange(false)}
            />

            {/* Drawer */}
            <div
                className={cn(
                    "fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-background shadow-2xl transition-transform duration-300 ease-out",
                    open ? "translate-x-0" : "-translate-x-full",
                    className
                )}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {children}
            </div>
        </>
    )
}

interface MobileNavItemProps {
    href: string
    icon: LucideIcon
    label: string
    badge?: number
    onClick?: () => void
    className?: string
}

/**
 * Individual navigation item for drawer
 */
export function MobileNavItem({
    href,
    icon: Icon,
    label,
    badge,
    onClick,
    className,
}: MobileNavItemProps) {
    const pathname = usePathname()
    const isActive = pathname === href || pathname.startsWith(href + "/")

    const handleClick = () => {
        triggerHapticFeedback(10)
        onClick?.()
    }

    return (
        <Link
            href={href}
            onClick={handleClick}
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all touch-manipulation min-h-[44px]",
                isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted",
                className
            )}
        >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1 font-medium">{label}</span>
            {badge !== undefined && badge > 0 && (
                <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-destructive px-2 text-xs font-bold text-destructive-foreground">
                    {badge > 99 ? "99+" : badge}
                </span>
            )}
        </Link>
    )
}

interface MobileTabBarProps {
    tabs: Array<{ id: string; label: string; icon?: LucideIcon }>
    activeTab: string
    onTabChange: (tabId: string) => void
    className?: string
}

/**
 * Mobile tab bar for section navigation
 * 
 * Requirements: 8.3
 */
export function MobileTabBar({
    tabs,
    activeTab,
    onTabChange,
    className,
}: MobileTabBarProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 overflow-x-auto scrollbar-hide bg-background border-b border-border px-2 py-2",
                className
            )}
            role="tablist"
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                const Icon = tab.icon

                return (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={isActive ? "true" : "false"}
                        onClick={() => {
                            triggerHapticFeedback(10)
                            onTabChange(tab.id)
                        }}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all touch-manipulation min-h-[44px]",
                            isActive
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        {Icon && <Icon className="h-4 w-4" />}
                        {tab.label}
                    </button>
                )
            })}
        </div>
    )
}
