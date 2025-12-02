'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
    AnimatedTabs as Tabs,
    AnimatedTabsList as TabsList,
    AnimatedTabsTrigger as TabsTrigger,
} from '@/components/ui/animated-tabs';

interface SessionFiltersProps {
    currentStatus: string;
}

export function SessionFilters({ currentStatus }: SessionFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleStatusChange = (status: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (status === 'all') {
            params.delete('status');
        } else {
            params.set('status', status);
        }
        router.push(`/open-house/sessions?${params.toString()}`);
    };

    return (
        <Tabs value={currentStatus} onValueChange={handleStatusChange}>
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
