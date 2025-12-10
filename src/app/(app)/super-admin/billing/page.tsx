/**
 * Super Admin Billing Management Page
 * 
 * Comprehensive billing dashboard with enhanced Stripe power capabilities
 */

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedBillingSearch } from '@/components/admin/enhanced-billing-search';
import { PromotionManager } from '@/components/admin/promotion-manager';
import {
    CreditCard,
    Search,
    Tag,
    TrendingUp,
    DollarSign,
    Users,
    Receipt
} from 'lucide-react';

export default function SuperAdminBillingPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Billing Management</h1>
                    <p className="text-muted-foreground">
                        Comprehensive billing operations powered by Stripe integration
                    </p>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$45,231.89</div>
                        <p className="text-xs text-muted-foreground">
                            +20.1% from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2,350</div>
                        <p className="text-xs text-muted-foreground">
                            +180 new this month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payment Failures</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">
                            -4 from last week
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3.2%</div>
                        <p className="text-xs text-muted-foreground">
                            +0.5% from last month
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="search" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="search" className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Advanced Search
                    </TabsTrigger>
                    <TabsTrigger value="promotions" className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Promotions
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="search">
                    <EnhancedBillingSearch />
                </TabsContent>

                <TabsContent value="promotions">
                    <PromotionManager />
                </TabsContent>

                <TabsContent value="analytics">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Billing Analytics Dashboard
                            </CardTitle>
                            <CardDescription>
                                Comprehensive billing metrics and insights
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-muted-foreground">
                                <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold mb-2">Advanced Analytics Coming Soon</h3>
                                <p className="max-w-md mx-auto">
                                    Detailed revenue analytics, cohort analysis, churn metrics,
                                    and real estate market performance insights will be available here.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}