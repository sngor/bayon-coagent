'use client';

import Link from 'next/link';
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@/components/ui/sidebar';
import { ICON_SIZES } from '@/lib/constants/icon-sizes';
import { useNavigation } from '@/lib/navigation';

export function DynamicNavigation() {
    const { navigationItems, isActiveRoute } = useNavigation();

    return (
        <SidebarMenu>
            {navigationItems.map((item) => {
                const isActive = isActiveRoute(item.href);

                return (
                    <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.label}
                        >
                            <Link href={item.href}>
                                {isActive ? (
                                    <item.filledIcon className={ICON_SIZES.md} />
                                ) : (
                                    <item.icon className={ICON_SIZES.md} />
                                )}
                                <span>{item.label}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                );
            })}
        </SidebarMenu>
    );
}