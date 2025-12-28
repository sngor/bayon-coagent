import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface LoadingStateProps {
    variant?: 'default' | 'card' | 'list' | 'profile' | 'dashboard'
    count?: number
    className?: string
}

export function LoadingState({ variant = 'default', count = 1, className }: LoadingStateProps) {
    const items = Array.from({ length: count })

    if (variant === 'card') {
        return (
            <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
                {items.map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                        <CardHeader className="space-y-2">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-3/4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-24 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (variant === 'list') {
        return (
            <div className={`space-y-4 ${className}`}>
                {items.map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (variant === 'profile') {
        return (
            <div className={`flex items-center space-x-4 ${className}`}>
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        )
    }

    if (variant === 'dashboard') {
        return (
            <div className={`space-y-6 ${className}`}>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-[100px]" />
                                <Skeleton className="h-4 w-4 rounded-full" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-[60px] mb-2" />
                                <Skeleton className="h-3 w-[80px]" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <Skeleton className="h-6 w-[150px]" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[300px] w-full" />
                        </CardContent>
                    </Card>
                    <Card className="col-span-3">
                        <CardHeader>
                            <Skeleton className="h-6 w-[150px]" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center">
                                        <Skeleton className="h-9 w-9 rounded-full mr-3" />
                                        <div className="space-y-1">
                                            <Skeleton className="h-4 w-[120px]" />
                                            <Skeleton className="h-3 w-[80px]" />
                                        </div>
                                        <Skeleton className="h-4 w-[60px] ml-auto" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className={`space-y-2 ${className}`}>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
        </div>
    )
}
