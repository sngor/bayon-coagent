'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    AnimatedTabs as Tabs,
    AnimatedTabsContent as TabsContent,
    AnimatedTabsList as TabsList,
    AnimatedTabsTrigger as TabsTrigger,
} from '@/components/ui/animated-tabs';
import {
    Search,
    Users,
    CreditCard,
    Receipt,
    Filter,
    Download,
    Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
    id: string;
    type: string;
    created: number;
    [key: string]: any;
}

export function EnhancedBillingSearch() {
    const [searchType, setSearchType] = useState<'customers' | 'subscriptions' | 'payments'>('customers');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchCriteria, setSearchCriteria] = useState({
        email: '',
        domain: '',
        name: '',
        status: '',
        customerId: '',
        amountGreaterThan: '',
        amountLessThan: '',
        currency: 'usd',
    });
    const { toast } = useToast();

    const handleSearch = async () => {
        try {
            setIsSearching(true);

            // Build criteria object based on search type
            let criteria: any = {};

            if (searchType === 'customers') {
                if (searchCriteria.email) criteria.email = searchCriteria.email;
                if (searchCriteria.domain) criteria.domain = searchCriteria.domain;
                if (searchCriteria.name) criteria.name = searchCriteria.name;
            } else if (searchType === 'subscriptions') {
                if (searchCriteria.status) criteria.status = searchCriteria.status;
                if (searchCriteria.customerId) criteria.customerId = searchCriteria.customerId;
            } else if (searchType === 'payments') {
                if (searchCriteria.status) criteria.status = searchCriteria.status;
                if (searchCriteria.customerId) criteria.customerId = searchCriteria.customerId;
                if (searchCriteria.amountGreaterThan) criteria.amountGreaterThan = parseFloat(searchCriteria.amountGreaterThan);
                if (searchCriteria.amountLessThan) criteria.amountLessThan = parseFloat(searchCriteria.amountLessThan);
                if (searchCriteria.currency) criteria.currency = searchCriteria.currency;
            }

            const response = await fetch('/api/admin/billing/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    searchType,
                    criteria,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSearchResults(data.results || []);
                toast({
                    title: 'Search Complete',
                    description: `Found ${data.results?.length || 0} results`,
                });
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error searching:', error);
            toast({
                variant: 'destructive',
                title: 'Search Failed',
                description: 'Failed to search billing data',
            });
        } finally {
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchCriteria({
            email: '',
            domain: '',
            name: '',
            status: '',
            customerId: '',
            amountGreaterThan: '',
            amountLessThan: '',
            currency: 'usd',
        });
        setSearchResults([]);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    const formatAmount = (amount: number, currency: string = 'usd') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amount / 100);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Enhanced Billing Search
                    </CardTitle>
                    <CardDescription>
                        Advanced search capabilities powered by Stripe's search API
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <Label>Search Type</Label>
                            <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="customers">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Customers
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="subscriptions">
                                        <div className="flex items-center gap-2">
                                            <Receipt className="h-4 w-4" />
                                            Subscriptions
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="payments">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            Payments
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleSearch} disabled={isSearching}>
                                {isSearching ? 'Searching...' : 'Search'}
                            </Button>
                            <Button variant="outline" onClick={clearSearch}>
                                Clear
                            </Button>
                        </div>
                    </div>

                    {/* Search Criteria Forms */}
                    {searchType === 'customers' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Email Address</Label>
                                <Input
                                    placeholder="user@example.com"
                                    value={searchCriteria.email}
                                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>Email Domain</Label>
                                <Input
                                    placeholder="realestate.com"
                                    value={searchCriteria.domain}
                                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, domain: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>Customer Name</Label>
                                <Input
                                    placeholder="John Doe"
                                    value={searchCriteria.name}
                                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}

                    {searchType === 'subscriptions' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Subscription Status</Label>
                                <Select value={searchCriteria.status} onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, status: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Statuses</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="canceled">Canceled</SelectItem>
                                        <SelectItem value="past_due">Past Due</SelectItem>
                                        <SelectItem value="trialing">Trialing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Customer ID</Label>
                                <Input
                                    placeholder="cus_..."
                                    value={searchCriteria.customerId}
                                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, customerId: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}

                    {searchType === 'payments' && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label>Payment Status</Label>
                                <Select value={searchCriteria.status} onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, status: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Statuses</SelectItem>
                                        <SelectItem value="succeeded">Succeeded</SelectItem>
                                        <SelectItem value="requires_payment_method">Failed</SelectItem>
                                        <SelectItem value="requires_action">Requires Action</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Min Amount ($)</Label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={searchCriteria.amountGreaterThan}
                                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, amountGreaterThan: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>Max Amount ($)</Label>
                                <Input
                                    type="number"
                                    placeholder="1000.00"
                                    value={searchCriteria.amountLessThan}
                                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, amountLessThan: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>Currency</Label>
                                <Select value={searchCriteria.currency} onValueChange={(value) => setSearchCriteria(prev => ({ ...prev, currency: value }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="usd">USD</SelectItem>
                                        <SelectItem value="eur">EUR</SelectItem>
                                        <SelectItem value="gbp">GBP</SelectItem>
                                        <SelectItem value="cad">CAD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Search Results ({searchResults.length})</CardTitle>
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {searchResults.map((result) => (
                                <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="secondary">{result.type}</Badge>
                                            <span className="font-mono text-sm">{result.id}</span>
                                            <span className="text-sm text-muted-foreground">
                                                Created: {formatDate(result.created)}
                                            </span>
                                        </div>

                                        {/* Type-specific details */}
                                        {result.type === 'customers' && (
                                            <div className="mt-2 text-sm">
                                                <span className="font-medium">{result.name || 'No name'}</span>
                                                {result.email && <span className="text-muted-foreground ml-2">({result.email})</span>}
                                            </div>
                                        )}

                                        {result.type === 'payment_intents' && (
                                            <div className="mt-2 text-sm">
                                                <span className="font-medium">
                                                    {formatAmount(result.amount, result.currency)}
                                                </span>
                                                <Badge variant={result.status === 'succeeded' ? 'default' : 'destructive'} className="ml-2">
                                                    {result.status}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    <Button variant="ghost" size="sm">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}